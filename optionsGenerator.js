import { getSettings, MERGED_DIRECTOR_PROMPT } from './settings.js';
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
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.width = '100%';
        container.style.padding = '8px 16px';
        container.style.margin = '8px auto';
        container.style.maxWidth = '90%';
        container.style.textAlign = 'center';
        container.style.color = 'var(--text_color)';
        container.style.backgroundColor = 'transparent';
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
        setTimeout(() => hideGeneratingUI(), duration);
    }
}

function hideGeneratingUI() {
    const loadingContainer = document.getElementById('ti-loading-container');
    if (loadingContainer) {
        logger.log('hideGeneratingUI: 隐藏提示。');
        loadingContainer.style.display = 'none';
    }
}

async function displayOptions(options, isStreaming = false) {
    hideGeneratingUI();
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
    
    // 获取当前发送模式
    const settings = getSettings();
    const sendMode = settings.sendMode || 'manual';
    
    for (const text of options) {
        const btn = document.createElement('button');
        btn.className = 'qr--button menu_button interactable ti-options-capsule';
        container.appendChild(btn);
        
        if (isStreaming) {
            // 流式显示：打字机效果
            for (let i = 0; i < text.length; i++) {
                btn.textContent = text.substring(0, i + 1);
                await sleep(15);
            }
        } else {
            // 非流式显示：一次性显示完整文字
            btn.textContent = text;
        }
        
        btn.onclick = () => {
            const textarea = document.querySelector('#send_textarea, .send_textarea');
            const sendButton = document.querySelector('#send_but, .send_but, button[onclick*="send"], button[onclick*="Send"]');
            
            if (textarea) {
                textarea.value = text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.focus();
                
                // 根据发送模式决定是否自动发送
                if (sendMode === 'auto' && sendButton) {
                    sendButton.click();
                }
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
    let prompt = MERGED_DIRECTOR_PROMPT;
    prompt = prompt.replace(/{{scene_type}}/g, analysisResult.scene_type || '未知');
    prompt = prompt.replace(/{{user_mood}}/g, analysisResult.user_mood || '未知');
    prompt = prompt.replace(/{{narrative_focus}}/g, analysisResult.narrative_focus || '未知');
    prompt = prompt.replace(/{{learned_style}}/g, settings.learnedStyle || '无特定偏好');
    // 注入用户画像
    if (settings.userProfile && settings.userProfile.summary) {
        prompt += `\n# 用户画像：${settings.userProfile.summary}`;
    }
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

// ========== 用户行为采集与分析 ========== //

function logUserAction(actionType, detail) {
    const settings = getSettings();
    const log = {
        type: actionType,
        detail,
        timestamp: Date.now()
    };
    settings.userBehaviorLog.push(log);
    // 限制日志长度，防止无限增长
    if (settings.userBehaviorLog.length > 100) settings.userBehaviorLog.shift();
    if (typeof saveSettingsDebounced === 'function') saveSettingsDebounced();
}

function tryAnalyzeUserProfile() {
    const settings = getSettings();
    const logCount = settings.userBehaviorLog.length;
    
    logger.log(`尝试分析用户画像，当前日志数量: ${logCount}, 当前画像:`, settings.userProfile);
    
    // 降低触发频率：每3次行为分析一次，或者第一次有数据时
    if (logCount > 0 && (logCount % 3 === 0 || settings.userProfile.summary === '')) {
        logger.log(`开始分析用户画像，当前日志数量: ${logCount}`);
        analyzeUserBehavior();
    }
}

function analyzeUserBehavior() {
    const settings = getSettings();
    const logs = settings.userBehaviorLog;
    if (!logs.length) {
        logger.log('用户行为日志为空，跳过分析');
        return;
    }
    
    logger.log(`分析 ${logs.length} 条用户行为日志...`);
    
    // 简单统计：
    const sceneCount = {};
    const moodCount = {};
    const focusCount = {};
    const keywordCount = {};
    let validLogs = 0;
    
    logs.forEach((log, index) => {
        logger.log(`处理第 ${index + 1} 条日志:`, log);
        
        if (log.type === 'select_suggestion' && log.detail) {
            const { scene_type, user_mood, narrative_focus, keywords } = log.detail;
            if (scene_type) sceneCount[scene_type] = (sceneCount[scene_type] || 0) + 1;
            if (user_mood) moodCount[user_mood] = (moodCount[user_mood] || 0) + 1;
            if (narrative_focus) focusCount[narrative_focus] = (focusCount[narrative_focus] || 0) + 1;
            if (Array.isArray(keywords)) keywords.forEach(k => keywordCount[k] = (keywordCount[k] || 0) + 1);
            
            logger.log(`处理建议选择日志:`, { scene_type, user_mood, narrative_focus });
            validLogs++;
        } else if (log.type === 'manual_input' && log.detail && log.detail.inputText) {
            // 从手动输入中提取关键词
            const text = log.detail.inputText.toLowerCase();
            const keywords = text.split(/[\s,，。！？；：""''（）【】]/).filter(word => word.length > 1);
            keywords.forEach(k => keywordCount[k] = (keywordCount[k] || 0) + 1);
            
            logger.log(`处理手动输入日志:`, { inputText: log.detail.inputText.substring(0, 50) + '...' });
            validLogs++;
        }
    });
    
    logger.log(`有效日志数量: ${validLogs}, 场景统计:`, sceneCount, '情绪统计:', moodCount, '焦点统计:', focusCount, '关键词统计:', keywordCount);
    
    // 取出现最多的
    function getTop(obj) {
        return Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    }
    
    settings.userProfile.favoriteScene = getTop(sceneCount);
    settings.userProfile.favoriteMood = getTop(moodCount);
    settings.userProfile.preferedFocus = getTop(focusCount);
    settings.userProfile.customKeywords = Object.entries(keywordCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    
    // 生成简单总结
    settings.userProfile.summary = `偏好场景：${settings.userProfile.favoriteScene || '未知'}，情绪：${settings.userProfile.favoriteMood || '未知'}，叙事焦点：${settings.userProfile.preferedFocus || '未知'}，关键词：${settings.userProfile.customKeywords.join('、') || '无'}`;
    
    logger.log('用户画像分析完成:', settings.userProfile);
    
    if (typeof saveSettingsDebounced === 'function') saveSettingsDebounced();
}

// ========== 修改建议点击、输入等行为 ========== //
// 在 handleSuggestionClick 处埋点
async function handleSuggestionClick(text, analysisData, isAuto = false) {
    logUserAction('select_suggestion', {
        suggestionText: text,
        ...(analysisData || {})
    });
    tryAnalyzeUserProfile();
    
    // 发送建议内容
    await sendSuggestion(text, isAuto);
}
async function sendSuggestion(text, isAuto = false) {
    if (!isAuto) {
        logUserAction('manual_input', { inputText: text });
    }
    tryAnalyzeUserProfile();
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

// 在建议生成/选择后定期分析
async function generateOptions() {
    const settings = getSettings();
    if (OptionsGenerator.isGenerating) return;
    OptionsGenerator.isManuallyStopped = false;
    if (!settings.optionsGenEnabled || !settings.optionsApiKey) return;
    showGeneratingUI('AI助手思考中');
    OptionsGenerator.isGenerating = true;
    try {
        // 组装合并prompt
        const context = await getContextCompatible();
        const prompt = MERGED_DIRECTOR_PROMPT
            .replace(/{{context}}/g, context.messages.map(m => `[${m.role}] ${m.content}`).join('\n'))
            .replace(/{{learned_style}}/g, settings.learnedStyle || '无');
        const finalMessages = [{ role: 'user', content: prompt }];
        let content = '';
        const apiUrl = `${settings.optionsBaseUrl.replace(/\/$/, '')}/chat/completions`;
        
        if (settings.streamOptions) {
            // 流式生成
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
                    stream: true,
                }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                logger.error('API 响应错误 (raw):', errorText);
                throw new Error('API 请求失败');
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta?.content || '';
                            content += delta;
                            
                            // 实时解析并显示选项
                            const suggestions = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim()).filter(Boolean);
                            if (suggestions.length > 0) {
                                await displayOptions(suggestions, true); // true表示流式显示
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
        } else {
            // 非流式生成
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
                throw new Error('API 请求失败');
            }
            
            const data = await response.json();
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || '';
        }
        
        // 解析AI返回
        const jsonMatch = content.match(/\{.*\}/s);
        let analysisData = null;
        if (jsonMatch) {
            try { analysisData = JSON.parse(jsonMatch[0]); } catch {}
        }
        // 记录情境分析到choiceLog
        if (analysisData) {
            settings.choiceLog.push(analysisData);
            if (settings.choiceLog.length >= settings.logTriggerCount) {
                await reflectOnChoices();
            }
            if (typeof saveSettingsDebounced === 'function') saveSettingsDebounced();
        }
        // 解析建议
        const suggestions = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim()).filter(Boolean);
        await displayOptions(suggestions, false); // false表示非流式显示
        hideGeneratingUI();
    } catch (error) {
        logger.error('生成选项时出错:', error);
        showGeneratingUI(`生成失败: ${error.message}`, 5000);
    } finally {
        OptionsGenerator.isGenerating = false;
    }
}

/**
 * 测试API连接并获取模型列表
 * @returns {Promise<Object>} 包含连接状态、错误信息和模型列表的对象
 */
async function testApiConnection() {
    const settings = getSettings();
    try {
        // 获取当前设置
        const apiKey = settings.optionsApiKey;
        const apiType = settings.optionsApiType;
        const model = settings.optionsApiModel;
        const baseUrl = settings.optionsBaseUrl || 'https://api.openai.com/v1';
        
        // 验证API密钥
        if (!apiKey) {
            return {
                success: false,
                message: '请输入API密钥'
            };
        }
        
        // 根据API类型构建不同的请求
        if (apiType === 'gemini') {
            // Google Gemini API
            try {
                // 构建Gemini API URL
                const geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1';
                
                // 获取模型列表
                const modelsResponse = await fetch(`${geminiBaseUrl}/models?key=${apiKey}`);
                
                if (!modelsResponse.ok) {
                    const errorData = await modelsResponse.json();
                    return {
                        success: false,
                        message: `连接失败: ${errorData.error?.message || '未知错误'}`
                    };
                }
                
                const modelsData = await modelsResponse.json();
                
                // 过滤出Gemini模型
                const geminiModels = modelsData.models.filter(m => 
                    m.name.includes('gemini') || 
                    m.displayName?.includes('Gemini')
                );
                
                // 查找当前设置的模型
                const currentModel = geminiModels.find(m => m.name === model) || 
                                    geminiModels.find(m => m.name.includes(model)) || 
                                    geminiModels[0];
                
                // 获取API实际返回的模型名称，而不是用户设置的模型名称
                const actualModelName = currentModel?.displayName || currentModel?.name || '未知模型';
                return {
                    success: true,
                    message: '连接成功!',
                    models: geminiModels,
                    currentModel: currentModel?.name,
                    actualModelName: actualModelName
                };
            } catch (error) {
                logger.error('Gemini API连接测试失败:', error);
                return {
                    success: false,
                    message: `连接失败: ${error.message}`
                };
            }
        } else {
            // OpenAI兼容API
            try {
                // 构建请求URL
                const modelsUrl = `${baseUrl}/models`;
                
                // 发送请求获取模型列表
                const response = await fetch(modelsUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: { message: '未知错误' } }));
                    return {
                        success: false,
                        message: `连接失败: ${errorData.error?.message || '未知错误'}`
                    };
                }
                
                const data = await response.json();
                
                // 查找当前设置的模型
                const currentModel = data.data.find(m => m.id === model) || data.data[0];
                
                // 获取API实际返回的模型名称，而不是用户设置的模型名称
                const actualModelName = currentModel?.id || '未知模型';
                return {
                    success: true,
                    message: '连接成功!',
                    models: data.data,
                    currentModel: currentModel?.id,
                    actualModelName: actualModelName
                };
            } catch (error) {
                logger.error('OpenAI API连接测试失败:', error);
                return {
                    success: false,
                    message: `连接失败: ${error.message}`
                };
            }
        }
    } catch (error) {
        logger.error('API连接测试失败:', error);
        return {
            success: false,
            message: `连接失败: ${error.message}`
        };
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
    testApiConnection,
    analyzeUserBehavior,
    tryAnalyzeUserProfile
};

// 暴露到全局，方便UI调用
if (typeof window !== 'undefined') {
    window.analyzeUserBehavior = analyzeUserBehavior;
    window.tryAnalyzeUserProfile = tryAnalyzeUserProfile;
}