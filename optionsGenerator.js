import { getSettings } from './settings.js';
import { logger } from './logger.js';

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

async function generateOptions() {
    if (OptionsGenerator.isGenerating) {
        logger.log('已在生成选项，跳过本次请求。');
        return;
    }
    OptionsGenerator.isManuallyStopped = false;
    const settings = getSettings();
    if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
        logger.log('选项生成功能未启用或API密钥未设置');
        return;
    }
    showGeneratingUI('AI助手思考中');
    OptionsGenerator.isGenerating = true;
    try {
        const apiContext = OptionsGenerator.getContextForAPI();
        if (apiContext.length === 0) {
            throw new Error('无法获取聊天上下文');
        }
        const userInput = OptionsGenerator.getUserInput();
        let processedTemplate = settings.optionsTemplate
            .replace(/{{context}}/g, '对话历史已在上方消息中提供')
            .replace(/{{user_input}}/g, userInput || '用户当前输入')
            .replace(/{{char_card}}/g, OptionsGenerator.getCharacterCard() || '角色信息')
            .replace(/{{world_info}}/g, OptionsGenerator.getWorldInfo() || '世界设定信息');
        const finalMessages = [
            ...apiContext,
            { role: 'user', content: processedTemplate }
        ];
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
            const optionsBaseUrl = settings.optionsBaseUrl;
            const optionsApiKey = settings.optionsApiKey;
            const optionsApiModel = settings.optionsApiModel;
            const apiUrl = `${optionsBaseUrl.replace(/\/$/, '')}/chat/completions`;
            logger.log('Requesting options from OpenAI-compatible API:', apiUrl);
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${optionsApiKey}`,
                },
                body: JSON.stringify({
                    model: optionsApiModel,
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
            logger.log('API 响应数据 (OpenAI-兼容模式):', data);
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || '';
        }
        const options = parseOptions(content);
        logger.log('解析出的选项:', options);
        await displayOptions(options);
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