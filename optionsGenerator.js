import { getSettings, DYNAMIC_DIRECTOR_TEMPLATE } from './settings.js';
import { logger } from './logger.js';
import { saveSettingsDebounced } from '../../../../script.js';

function getUserInput() {
    // 获取输入框内容
    const textarea = document.querySelector('#send_textarea, .send_textarea');
    return textarea ? textarea.value.trim() : '';
}

function getCharacterCard() {
    // 获取角色卡信息
    try {
        if (typeof window.getCharacters === 'function') {
            const characters = window.getCharacters();
            const currentCharId = window.characterId;
            if (characters && currentCharId) {
                const character = characters.find(c => c.avatar === currentCharId);
                return character ? character.description || character.name : '';
            }
        }
        return '';
    } catch (error) {
        logger.error('获取角色卡信息失败:', error);
        return '';
    }
}

function getWorldInfo() {
    // 获取世界设定信息
    try {
        if (typeof window.getLorebooks === 'function') {
            const lorebooks = window.getLorebooks();
            if (lorebooks && lorebooks.length > 0) {
                return lorebooks.map(lb => lb.entries?.map(entry => entry.content).join('\n')).join('\n\n');
            }
        }
        return '';
    } catch (error) {
        logger.error('获取世界设定信息失败:', error);
        return '';
    }
}

function getContextForAPI() {
    // 迁移自 index.js 的 DOM 提取逻辑
    try {
        const messageElements = document.querySelectorAll('#chat .mes');
        const messages = [];
        messageElements.forEach((el) => {
            const contentEl = el.querySelector('.mes_text');
            if (contentEl) {
                let role = 'system';
                const isUserAttr = el.getAttribute('is_user');
                if (isUserAttr === 'true') {
                    role = 'user';
                } else if (isUserAttr === 'false') {
                    role = 'assistant';
                }
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = contentEl.innerHTML.replace(/<br\s*\/?>/gi, '\n');
                const content = (tempDiv.textContent || tempDiv.innerText || '').trim();
                if (content && (role === 'user' || role === 'assistant')) {
                    messages.push({ role, content });
                }
            }
        });
        // 只取最后20条
        return messages.slice(-20);
    } catch (error) {
        logger.error('getContextForAPI 解析失败:', error);
        return [];
    }
}

function transformMessagesForGemini(messages) {
    // Gemini API 需要 user/model 角色交替
    const contents = [];
    let lastRole = '';
    messages.forEach(msg => {
        const currentRole = msg.role === 'assistant' ? 'model' : 'user';
        if (currentRole === 'user' && lastRole === 'user' && contents.length > 0) {
            contents[contents.length - 1].parts[0].text += `\n\n${msg.content}`;
        } else {
            contents.push({ role: currentRole, parts: [{ text: msg.content }] });
        }
        lastRole = currentRole;
    });
    // 最后一条必须是 user
    if (contents.length > 0 && contents[contents.length - 1].role !== 'user') {
        contents.push({ role: 'user', parts: [{text: '(继续)'}]});
    }
    return contents;
}

function parseOptions(content) {
    // 1. 优先尝试解析【...】格式
    let options = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim());
    if (options.length > 0) {
        logger.log('使用【】格式解析器成功。');
        return options.filter(Boolean);
    }
    // 2. 如果失败，尝试解析列表格式 (e.g., "- ...", "1. ...")
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const listRegex = /^(?:\*|-\s|\d+\.\s)\s*(.*)/;
    options = lines.map(line => {
        const match = line.trim().match(listRegex);
        return match ? match[1].trim() : null;
    }).filter(Boolean);
    if (options.length > 0) {
        logger.log('使用列表格式解析器成功。');
        return options;
    }
    logger.log('所有解析器都未能找到选项。');
    return [];
}

function showGeneratingUI(message, duration = null) {
    logger.log(`showGeneratingUI: 尝试显示提示: "${message}"`);
    let container = document.getElementById('ti-loading-container');
    const chat = document.getElementById('chat');
    if (!chat) {
        logger.log('showGeneratingUI: chat 未找到，无法显示。');
        return;
    }
    if (!container) {
        logger.log('showGeneratingUI: 未找到现有容器，创建新容器。');
        container = document.createElement('div');
        container.id = 'ti-loading-container';
        container.classList.add('typing_indicator');
        chat.appendChild(container);
        logger.log('showGeneratingUI: 容器已附加到 chat。');
    } else {
        logger.log('showGeneratingUI: 找到现有容器，更新内容并尝试显示。');
    }
    const animationHtml = getSettings().animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
            <div class="typing-indicator-text">${message}</div>
            ${animationHtml}
        </div>
    `;
    container.style.display = 'flex';
    logger.log(`showGeneratingUI: 最终容器 display 属性: ${container.style.display}`);
    if (duration) {
        logger.log(`showGeneratingUI: 将在 ${duration}ms 后隐藏提示。`);
        setTimeout(() => OptionsGenerator.hideGeneratingUI(), duration);
    }
}

function hideGeneratingUI() {
    const loadingContainer = document.getElementById('ti-loading-container');
    if (loadingContainer) {
        logger.log('hideGeneratingUI: 隐藏提示。');
        loadingContainer.style.display = 'none';
    }
}

async function displayOptions(options) {
    OptionsGenerator.hideGeneratingUI();
    const oldContainer = document.getElementById('ti-options-container');
    if (oldContainer) oldContainer.remove();
    const sendForm = document.getElementById('send_form');
    if (!sendForm || !options || options.length === 0) {
        if (!options || options.length === 0) {
            showGeneratingUI('未能生成有效选项', 3000);
        }
        return;
    }
    const container = document.createElement('div');
    container.id = 'ti-options-container';
    sendForm.insertAdjacentElement('beforebegin', container);
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    for (const text of options) {
        const btn = document.createElement('button');
        btn.className = 'qr--button menu_button interactable ti-options-capsule';
        container.appendChild(btn);
        for (let i = 0; i < text.length; i++) {
            btn.textContent = text.substring(0, i + 1);
            await sleep(15);
        }
        btn.onclick = () => {
            const textarea = document.querySelector('#send_textarea, .send_textarea');
            if (textarea) {
                textarea.value = text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.focus();
            }
            container.remove();
        };
    }
}

// 1. 兼容型上下文提取
async function getContextCompatible(limit = 20) {
    // 兼容 TavernHelper 或 DOM
    if (typeof window.TavernHelper?.getContext === 'function') {
        return await window.TavernHelper.getContext({ tokenLimit: 8192 });
    } else {
        // DOM fallback
        const messageElements = document.querySelectorAll('#chat .mes');
        const messages = [];
        messageElements.forEach((el) => {
            const contentEl = el.querySelector('.mes_text');
            if (contentEl) {
                let role = 'system';
                const isUserAttr = el.getAttribute('is_user');
                if (isUserAttr === 'true') role = 'user';
                else if (isUserAttr === 'false') role = 'assistant';
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = contentEl.innerHTML.replace(/<br\s*\/?>/gi, '\n');
                const content = (tempDiv.textContent || tempDiv.innerText || '').trim();
                if (content && (role === 'user' || role === 'assistant')) {
                    messages.push({ role, content });
                }
            }
        });
        return { messages: messages.slice(-limit) };
    }
}

// 2. 情境分析
async function analyzeContext() {
    const settings = getSettings();
    const context = await getContextCompatible(5);
    if (!context || !context.messages.length) return null;
    const analysisPrompt = `分析以下最新的对话片段，严格以JSON格式返回当前情境。JSON必须包含 scene_type(场景类型), user_mood(我的情绪), narrative_focus(当前叙事焦点) 三个键。\n\n对话片段:\n${JSON.stringify(context.messages)}\n\n你的JSON输出:`;
    try {
        // 用 analysisModel 调用 OpenAI 兼容API
        const response = await fetch(settings.optionsBaseUrl + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.optionsApiKey}`
            },
            body: JSON.stringify({
                model: settings.analysisModel,
                messages: [{ role: 'user', content: analysisPrompt }],
                temperature: 0.2,
                stream: false
            })
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        const jsonMatch = text.match(/\{.*\}/s);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        logger.error('analyzeContext 失败:', e);
        return null;
    }
}

// 3. 动态prompt组装
function assembleDynamicPrompt(analysisResult) {
    const settings = getSettings();
    let prompt = DYNAMIC_DIRECTOR_TEMPLATE;
    prompt = prompt.replace(/{{scene_type}}/g, analysisResult.scene_type || '未知');
    prompt = prompt.replace(/{{user_mood}}/g, analysisResult.user_mood || '未知');
    prompt = prompt.replace(/{{narrative_focus}}/g, analysisResult.narrative_focus || '未知');
    prompt = prompt.replace(/{{learned_style}}/g, settings.learnedStyle || '无特定偏好');
    return prompt;
}

// 4. 长期记忆/自我进化
async function logChoice(analysisData) {
    const settings = getSettings();
    if (!analysisData) return;
    settings.choiceLog.push(analysisData);
    if (settings.choiceLog.length >= settings.logTriggerCount) {
        await reflectOnChoices();
    }
    // 这里假设有 saveSettingsDebounced
    if (typeof saveSettingsDebounced === 'function') saveSettingsDebounced();
}
async function reflectOnChoices() {
    const settings = getSettings();
    const reflectionPrompt = `这里是一个用户在不同叙事场景下的情境分析日志（JSON数组）。请分析这些数据，用一句话总结出该用户的核心创作偏好或“玩家风格”。你的回答必须简洁、精炼、如同一个资深编辑的评语。\n\n情境日志:\n${JSON.stringify(settings.choiceLog)}\n\n你的总结评语:`;
    try {
        const response = await fetch(settings.optionsBaseUrl + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.optionsApiKey}`
            },
            body: JSON.stringify({
                model: settings.analysisModel,
                messages: [{ role: 'user', content: reflectionPrompt }],
                temperature: 0.5,
                stream: false
            })
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        settings.learnedStyle = text.trim();
        settings.choiceLog = [];
        if (typeof saveSettingsDebounced === 'function') saveSettingsDebounced();
    } catch (e) {
        logger.error('reflectOnChoices 失败:', e);
    }
}

// 5. 建议渲染与点击处理
async function renderSuggestions(suggestions, analysisData) {
    // 兼容UI，支持自动/手动/全自动
    const sendForm = document.getElementById('send_form');
    if (!sendForm || !suggestions || suggestions.length === 0) return;
    
    // 清理旧的建议容器
    const oldContainer = document.getElementById('ti-options-container');
    if (oldContainer) oldContainer.remove();
    
    const container = document.createElement('div');
    container.id = 'ti-options-container';
    container.style.marginBottom = '10px';
    sendForm.insertAdjacentElement('beforebegin', container);
    
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    for (const text of suggestions) {
        const btn = document.createElement('button');
        btn.className = 'qr--button menu_button interactable ti-options-capsule';
        btn.style.margin = '2px';
        btn.style.padding = '8px 12px';
        container.appendChild(btn);
        
        // 打字机效果
        for (let i = 0; i < text.length; i++) {
            btn.textContent = text.substring(0, i + 1);
            await sleep(15);
        }
        
        // 根据发送模式设置点击行为
        const settings = getSettings();
        if (settings.sendMode === 'auto') {
            // 自动模式：点击后自动发送
            btn.onclick = () => handleSuggestionClick(text, analysisData, true);
        } else {
            // 手动模式：点击后只填充文本
            btn.onclick = () => handleSuggestionClick(text, analysisData, false);
        }
    }
}
async function handleSuggestionClick(text, analysisData, isAuto = false) {
    await sendSuggestion(text, isAuto);
    const settings = getSettings();
    if (settings.enableDynamicDirector && analysisData) {
        await logChoice(analysisData);
    }
}
async function sendSuggestion(text, isAuto = false) {
    // 兼容自动/手动发送
    const textarea = document.querySelector('#send_textarea, .send_textarea');
    const sendButton = document.querySelector('#send_but, .send_but, button[onclick*="send"], button[onclick*="Send"]');
    
    if (textarea) {
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
        
        // 根据发送模式处理
        if (isAuto || getSettings().sendMode === 'auto' || getSettings().sendMode === 'stream_auto_send') {
            // 自动发送：模拟点击发送按钮
            if (sendButton) {
                sendButton.click();
            } else {
                // 尝试触发回车键事件
                textarea.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                }));
            }
        }
        // manual 模式只填充文本，不自动发送
    }
    
    // 清理建议UI
    const oldContainer = document.getElementById('ti-options-container');
    if (oldContainer) oldContainer.remove();
}

async function generateOptions() {
    const settings = getSettings();
    if (OptionsGenerator.isGenerating) return;
    OptionsGenerator.isManuallyStopped = false;
    if (!settings.optionsGenEnabled || !settings.optionsApiKey) return;
    showGeneratingUI('AI助手思考中');
    OptionsGenerator.isGenerating = true;
    try {
        let prompt = settings.optionsTemplate;
        let analysisData = null;
        if (settings.enableDynamicDirector && settings.analysisModel && settings.dynamicPromptTemplate) {
            analysisData = await analyzeContext();
            if (analysisData) {
                prompt = assembleDynamicPrompt(analysisData);
            }
        }
        const context = await getContextCompatible();
        const finalMessages = [...context.messages, { role: 'user', content: prompt }];
        let content = '';
        if (settings.optionsApiType === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.optionsApiModel}:generateContent?key=${settings.optionsApiKey}`;
            logger.log('Requesting options from Gemini:', url);
            const body = { contents: OptionsGenerator.transformMessagesForGemini(finalMessages) };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorText = await response.text();
                logger.error('API 响应错误 (raw):', errorText);
                throw new Error('Gemini API 请求失败');
            }
            const data = await response.json();
            logger.log('API 响应数据 (Gemini):', data);
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
            const apiUrl = `${settings.optionsBaseUrl.replace(/\/$/, '')}/chat/completions`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.optionsApiKey}`,
                },
                body: JSON.stringify({
                    model: settings.optionsApiModel,
                    messages: finalMessages,
                    temperature: 0.8,
                    stream: false,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                logger.error('API 响应错误 (raw):', errorText);
                throw new Error('OpenAI-兼容 API 请求失败');
            }
            const data = await response.json();
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || '';
        }
        const suggestions = parseOptions(content);
        if (settings.sendMode === 'stream_auto_send' && suggestions.length > 0) {
            await handleSuggestionClick(suggestions[0], analysisData, true);
        } else if (settings.sendMode === 'auto' && suggestions.length > 0) {
            await renderSuggestions(suggestions, analysisData);
        } else if (settings.sendMode === 'manual') {
            await renderSuggestions(suggestions, analysisData);
        }
        hideGeneratingUI();
    } catch (error) {
        logger.error('生成选项时出错:', error);
        showGeneratingUI(`生成失败: ${error.message}`, 5000);
    } finally {
        OptionsGenerator.isGenerating = false;
    }
}

export const OptionsGenerator = {
    isGenerating: false,
    isManuallyStopped: false,
    getUserInput,
    getCharacterCard,
    getWorldInfo,
    getContextForAPI,
    transformMessagesForGemini,
    parseOptions,
    showGeneratingUI,
    hideGeneratingUI,
    displayOptions,
    generateOptions,
};