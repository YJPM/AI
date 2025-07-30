import {
    name2,
    eventSource,
    event_types,
    isStreamingEnabled,
    saveSettingsDebounced,
} from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { selected_group } from '../../../group-chats.js';

const MODULE = 'typing_indicator';
const legacyIndicatorTemplate = document.getElementById('typing_indicator_template');

// 新增日志记录器
const logger = {
    log: (...args) => {
        if (getSettings().debug) {
            console.log(`[${MODULE}]`, ...args);
        }
    },
    error: (...args) => {
        console.error(`[${MODULE}]`, ...args);
    },
};

/**
 * @typedef {Object} TypingIndicatorSettings
 * @property {boolean} enabled
 * @property {boolean} showCharName
 * @property {boolean} animationEnabled - 是否启用末尾的...动画。
 * @property {string} customText
 * @property {boolean} debug - 是否启用调试日志
 * @property {boolean} optionsGenEnabled - 是否启用选项生成功能
 * @property {string} optionsApiType - API类型 ('openai' 或 'gemini')
 * @property {string} optionsApiKey - API密钥
 * @property {string} optionsApiModel - 使用的模型
 * @property {string} optionsBaseUrl - API基础URL (仅限OpenAI)
 * @property {number} optionsCount - 生成选项数量
 * @property {string} optionsTemplate - 选项生成提示模板
 */

/**
 * @type {TypingIndicatorSettings}
 */
const defaultSettings = {
    enabled: true,
    showCharName: true,
    animationEnabled: true,
    customText: '正在输入',
    debug: false,
    // 选项生成相关设置
    optionsGenEnabled: false,
    optionsApiType: 'openai',
    optionsApiKey: '',
    optionsApiModel: 'gpt-4o-mini',
    optionsBaseUrl: 'https://api.openai.com/v1',
    optionsCount: 3,
    optionsTemplate: `
# 角色
你是一位拥有顶级创作能力的AI叙事导演。

# 核心目标
基于完整的聊天上下文，通过一个严谨的内部思考过程，为“我”（用户角色）生成3-5个接下来可能发生的、最具戏剧性的行动或事件选项。

# 内部思考过程
1.  **[情境分析]**: 快速分析当前场景、我的情绪和目标、以及当前的冲突点。
2.  **[选项构思]**: 基于分析，在内部构思多个多样化的选项（升级冲突、探索未知、反映内心、意外转折等）。
3.  **[排序与决策]**: 根据戏剧性、角色一致性和叙事推动力，对构思的选项进行排序，将你认为的“最优选项”放在第一位。

# 最终输出格式 (!!!至关重要!!!)
- 你的最终输出必须是一个不换行的单行文本，包含3-5个高质量选项。
- **第一个选项必须是你决策出的最优选项。**
- 每个选项都必须用全角括号【】包裹。
- **绝对禁止**包含任何序号、JSON、思考过程、解释或其他多余字符。

# 对话上下文
[完整的上下文在上方消息中提供，请基于此进行创作]

# 开始执行导演任务，并输出你的最终选项列表：
`.trim(),
};

/**
 * 获取此扩展的设置。
 */
function getSettings() {
    if (extension_settings[MODULE] === undefined) {
        extension_settings[MODULE] = structuredClone(defaultSettings);
    }
    for (const key in defaultSettings) {
        if (extension_settings[MODULE][key] === undefined) {
            extension_settings[MODULE][key] = defaultSettings[key];
        }
    }
    return extension_settings[MODULE];
}

/**
 * 应用固定样式
 */
function applyBasicStyle() {
    let styleTag = document.getElementById('typing-indicator-theme-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'typing-indicator-theme-style';
        document.head.appendChild(styleTag);
    }

    // 使用透明背景样式
    styleTag.textContent = `
        .typing_indicator {
            background-color: transparent;
            padding: 8px 16px;
            margin: 8px auto;
            width: fit-content;
            max-width: 90%;
            text-align: center;
            color: var(--text_color); /* 使用主题的默认文字颜色 */
        }
    `;
}

/**
 * 将扩展所需的全局 CSS 注入到文档头部。
 */
function injectGlobalStyles() {
    const css = `
        /* 核心指示器样式修复 */
        #typing_indicator.typing_indicator {
            opacity: 1 !important; /* 强制覆盖主机应用可能存在的透明度样式，以修复不透明CSS仍然半透明的问题。 */
        }

        /* 省略号动画 */
        .typing-ellipsis::after {
            display: inline-block;
            animation: ellipsis-animation 1.4s infinite;
            content: '.';
            width: 1.2em; /* 预留足够空间防止布局抖动 */
            text-align: left;
            vertical-align: bottom;
        }
        @keyframes ellipsis-animation {
            0% { content: '.'; }
            33% { content: '..'; }
            66%, 100% { content: '...'; }
        }

        /* 选项按钮样式 */
        #ti-options-container {
            width: 100%;
            padding: 8px 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }
        .ti-options-capsule {
            flex: 1;
            white-space: normal;
            text-align: center;
            margin: 0 !important;
            height: auto;
            min-width: 120px;
        }
    `;
    let styleTag = document.getElementById('typing-indicator-global-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'typing-indicator-global-style';
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
    }
}


/**
 * 绘制此扩展的设置界面。
 */
function addExtensionSettings(settings) {
    const settingsContainer = document.getElementById('typing_indicator_container') ?? document.getElementById('extensions_settings');
    if (!settingsContainer) return;

    const inlineDrawer = document.createElement('div');
    inlineDrawer.classList.add('inline-drawer');
    settingsContainer.append(inlineDrawer);

    const inlineDrawerToggle = document.createElement('div');
    inlineDrawerToggle.classList.add('inline-drawer-toggle', 'inline-drawer-header');
    const extensionName = document.createElement('b');
    extensionName.textContent = 'AI助手';
    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');
    inlineDrawerToggle.append(extensionName, inlineDrawerIcon);

    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');
    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

    // 选项生成设置
    const optionsContainer = document.createElement('div');
    optionsContainer.style.marginTop = '20px';
    optionsContainer.style.borderTop = '1px solid var(--border_color)';
    optionsContainer.style.paddingTop = '15px';

    const optionsHeader = document.createElement('h4');
    optionsHeader.textContent = '回复选项生成';
    optionsHeader.style.margin = '0 0 10px 0';
    optionsContainer.appendChild(optionsHeader);

    // 启用选项生成
    const optionsEnabledLabel = document.createElement('label');
    optionsEnabledLabel.classList.add('checkbox_label');
    const optionsEnabledCheckbox = document.createElement('input');
    optionsEnabledCheckbox.type = 'checkbox';
    optionsEnabledCheckbox.checked = settings.optionsGenEnabled;
    optionsEnabledCheckbox.addEventListener('change', () => {
        settings.optionsGenEnabled = optionsEnabledCheckbox.checked;
        optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';
        saveSettingsDebounced();
    });
    const optionsEnabledText = document.createElement('span');
    optionsEnabledText.textContent = '启用回复选项生成';
    optionsEnabledLabel.append(optionsEnabledCheckbox, optionsEnabledText);
    optionsContainer.appendChild(optionsEnabledLabel);

    // 调试模式
    const debugLabel = document.createElement('label');
    debugLabel.classList.add('checkbox_label');
    debugLabel.style.marginLeft = '10px';
    const debugCheckbox = document.createElement('input');
    debugCheckbox.type = 'checkbox';
    debugCheckbox.checked = settings.debug;
    debugCheckbox.addEventListener('change', () => {
        settings.debug = debugCheckbox.checked;
        saveSettingsDebounced();
    });
    const debugText = document.createElement('span');
    debugText.textContent = '启用调试日志';
    debugLabel.append(debugCheckbox, debugText);
    optionsContainer.appendChild(debugLabel);


    // 选项设置容器
    const optionsSettingsContainer = document.createElement('div');
    optionsSettingsContainer.style.marginTop = '10px';
    optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';

    // API Type
    const apiTypeLabel = document.createElement('label');
    apiTypeLabel.textContent = 'API 类型:';
    apiTypeLabel.style.display = 'block';
    apiTypeLabel.style.marginTop = '10px';
    const apiTypeSelect = document.createElement('select');
    apiTypeSelect.id = 'options-api-type';
    apiTypeSelect.style.width = '100%';
    apiTypeSelect.innerHTML = `
        <option value="openai">OpenAI-兼容</option>
        <option value="gemini">Google Gemini</option>
    `;
    apiTypeSelect.value = settings.optionsApiType;
    optionsSettingsContainer.appendChild(apiTypeLabel);
    optionsSettingsContainer.appendChild(apiTypeSelect);

    // API Key
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'API密钥:';
    apiKeyLabel.style.display = 'block';
    apiKeyLabel.style.marginTop = '10px';
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.value = settings.optionsApiKey;
    apiKeyInput.placeholder = '输入API密钥';
    apiKeyInput.style.width = '100%';
    apiKeyInput.addEventListener('input', () => {
        settings.optionsApiKey = apiKeyInput.value;
        saveSettingsDebounced();
    });
    optionsSettingsContainer.appendChild(apiKeyLabel);
    optionsSettingsContainer.appendChild(apiKeyInput);

    // 模型选择
    const modelLabel = document.createElement('label');
    modelLabel.textContent = '模型:';
    modelLabel.style.display = 'block';
    modelLabel.style.marginTop = '10px';
    const modelInput = document.createElement('input');
    modelInput.type = 'text';
    modelInput.value = settings.optionsApiModel;
    modelInput.placeholder = '输入模型名称';
    modelInput.style.width = '100%';
    modelInput.addEventListener('input', () => {
        settings.optionsApiModel = modelInput.value;
        saveSettingsDebounced();
    });
    optionsSettingsContainer.appendChild(modelLabel);
    optionsSettingsContainer.appendChild(modelInput);

    // 基础URL
    const baseUrlGroup = document.createElement('div');
    baseUrlGroup.id = 'options-base-url-group';
    const baseUrlLabel = document.createElement('label');
    baseUrlLabel.textContent = '基础URL:';
    baseUrlLabel.style.display = 'block';
    baseUrlLabel.style.marginTop = '10px';
    const baseUrlInput = document.createElement('input');
    baseUrlInput.type = 'text';
    baseUrlInput.value = settings.optionsBaseUrl;
    baseUrlInput.placeholder = '输入API基础URL';
    baseUrlInput.style.width = '100%';
    baseUrlInput.addEventListener('input', () => {
        settings.optionsBaseUrl = baseUrlInput.value;
        saveSettingsDebounced();
    });
    baseUrlGroup.appendChild(baseUrlLabel);
    baseUrlGroup.appendChild(baseUrlInput);
    optionsSettingsContainer.appendChild(baseUrlGroup);


    apiTypeSelect.addEventListener('change', () => {
        settings.optionsApiType = apiTypeSelect.value;
        baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
        saveSettingsDebounced();
    });
    // Initial state
    baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';


    // 选项数量
    const countLabel = document.createElement('label');
    countLabel.textContent = '选项数量:';
    countLabel.style.display = 'block';
    countLabel.style.marginTop = '10px';
    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.min = 1;
    countInput.max = 10;
    countInput.value = settings.optionsCount;
    countInput.style.width = '100%';
    countInput.addEventListener('input', () => {
        settings.optionsCount = parseInt(countInput.value) || 3;
        saveSettingsDebounced();
    });
    optionsSettingsContainer.appendChild(countLabel);
    optionsSettingsContainer.appendChild(countInput);

    // 提示模板
    const templateLabel = document.createElement('label');
    templateLabel.textContent = '提示模板:';
    templateLabel.style.display = 'block';
    templateLabel.style.marginTop = '10px';
    const templateInput = document.createElement('textarea');
    templateInput.value = settings.optionsTemplate;
    templateInput.placeholder = '输入提示模板';
    templateInput.style.width = '100%';
    templateInput.style.height = '150px';
    templateInput.style.fontFamily = 'monospace';
    templateInput.addEventListener('input', () => {
        settings.optionsTemplate = templateInput.value;
        saveSettingsDebounced();
    });

    const templateHint = document.createElement('small');
    templateHint.textContent = '使用 {{context}} 表示对话历史, {{user_input}} 表示当前输入, {{char_card}} 表示角色卡, {{world_info}} 表示世界设定。';
    templateHint.style.display = 'block';
    templateHint.style.marginTop = '4px';
    templateHint.style.color = 'var(--text_color_secondary)';

    optionsSettingsContainer.appendChild(templateLabel);
    optionsSettingsContainer.appendChild(templateInput);
    optionsSettingsContainer.appendChild(templateHint);

    optionsContainer.appendChild(optionsSettingsContainer);
    inlineDrawerContent.append(optionsContainer);
}

/**
 * 在聊天中显示一个打字指示器。
 */
function showTypingIndicator(type, _args, dryRun) {
    const settings = getSettings();
    const noIndicatorTypes = ['quiet', 'impersonate'];

    if (type !== 'refresh' && (noIndicatorTypes.includes(type) || dryRun)) {
        return;
    }

    if (!settings.enabled) {
        return;
    }

    if (settings.showCharName && !name2 && type !== 'refresh') {
        return;
    }

    if (legacyIndicatorTemplate && selected_group && !isStreamingEnabled()) {
        return;
    }

    // 构建最终显示的文本
    const placeholder = '{char}';
    let finalText = settings.customText || defaultSettings.customText;

    if (settings.showCharName && name2) {
        if (finalText.includes(placeholder)) {
            finalText = finalText.replace(placeholder, name2);
        } else {
            finalText = `${name2}${finalText}`;
        }
    } else {
        finalText = finalText.replace(placeholder, '').replace(/  +/g, ' ').trim();
    }

    const animationHtml = settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
    const htmlContent = `
    <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
        <div class="typing-indicator-text">${finalText}</div>
        ${animationHtml}
    </div>
`;

    const existingIndicator = document.getElementById('typing_indicator');
    if (existingIndicator) {
        existingIndicator.innerHTML = htmlContent;
        return;
    }

    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing_indicator';
    typingIndicator.classList.add('typing_indicator');
    typingIndicator.innerHTML = htmlContent;

    const chat = document.getElementById('chat');
    if (chat) {
        // 检查用户是否已滚动到底部（允许有几个像素的误差）
        const wasChatScrolledDown = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 5;

        chat.appendChild(typingIndicator);

        // 如果用户在指示器出现前就位于底部，则自动滚动到底部以保持指示器可见
        if (wasChatScrolledDown) {
            chat.scrollTop = chat.scrollHeight;
        }
    }
}

/**
 * 隐藏打字指示器。
 */
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing_indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// (DOM-based, v2) 检查最后一条消息是否来自AI
function isLastMessageFromAI() {
    logger.log('检查最后一条消息 (DOM模式, v3)...');
    try {
        // 只选择明确来自用户或机器人的消息
        const allMessages = document.querySelectorAll('#chat .mes.bot_mes, #chat .mes.user_mes');
        logger.log(`找到 ${allMessages.length} 条有效对话消息。`);

        if (allMessages.length === 0) {
            logger.log('聊天记录中未找到用户或机器人消息，判定为非AI。');
            return false;
        }
        const lastMessage = allMessages[allMessages.length - 1];
        const isBot = lastMessage.classList.contains('bot_mes');
        const messageText = (lastMessage.querySelector('.mes_text')?.textContent || '').substring(0, 50);
        logger.log(`找到最后一条有效消息元素。内容预览: "${messageText}...". ClassList: ${Array.from(lastMessage.classList)}. 结论: ${isBot ? '是' : '不是'} AI消息。`);
        return isBot;
    } catch (error) {
        logger.error('通过DOM检查最后一条消息时出错:', error);
        return false;
    }
}


// 选项生成器对象
const OptionsGenerator = {
    isGenerating: false,

    // (DOM-based) 获取API上下文，增加详细日志
    getContextForAPI() {
        logger.log('从DOM获取API上下文 (增强日志模式)...');
        try {
            const messageElements = document.querySelectorAll('#chat .mes');
            const messages = [];
            logger.log(`发现 ${messageElements.length} 个 .mes 元素。开始遍历...`);

            messageElements.forEach((el, index) => {
                const contentEl = el.querySelector('.mes_text');
                if (contentEl) {
                    const role = el.classList.contains('user_mes') ? 'user' : (el.classList.contains('bot_mes') ? 'assistant' : 'system');
                    
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = contentEl.innerHTML.replace(/<br\s*\/?>/gi, '\n');
                    const content = (tempDiv.textContent || tempDiv.innerText || '').trim();

                    if (content) {
                        const messageData = { role, content };
                        messages.push(messageData);
                        logger.log(`[消息 ${index}] -> 有效:`, messageData);
                    } else {
                        logger.log(`[消息 ${index}] -> 跳过 (无内容)`);
                    }
                } else {
                     logger.log(`[消息 ${index}] -> 跳过 (无 .mes_text 子元素)`);
                }
            });
            
            logger.log(`从DOM中提取了 ${messages.length} 条有效消息。`);
            const finalMessages = messages.slice(-20);
            logger.log('最终用于API的上下文:', finalMessages);
            return finalMessages;
        } catch (error) {
            logger.error('从DOM获取API上下文失败:', error);
            return [];
        }
    },


    transformMessagesForGemini(messages) {
        const contents = [];
        let lastRole = '';
        messages.forEach(msg => {
            const currentRole = msg.role === 'assistant' ? 'model' : 'user';
            // Gemini API requires alternating user/model roles.
            // If the last role was also 'user', we merge the content.
            if (currentRole === 'user' && lastRole === 'user' && contents.length > 0) {
                contents[contents.length - 1].parts[0].text += `\n\n${msg.content}`;
            } else {
                contents.push({ role: currentRole, parts: [{ text: msg.content }] });
            }
            lastRole = currentRole;
        });
        // The last message must be from the user.
        if (contents.length > 0 && contents[contents.length - 1].role !== 'user') {
            contents.push({ role: 'user', parts: [{text: '(继续)'}]});
        }
        return contents;
    },

    async generateOptions() {
        if (this.isGenerating) {
            logger.log('已在生成选项，跳过本次请求。');
            return;
        }

        const settings = getSettings();
        if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
            logger.log('选项生成功能未启用或API密钥未设置');
            return;
        }

        this.showGeneratingUI('导演思考中...');
        this.isGenerating = true;

        try {
            const apiContext = this.getContextForAPI();
            if (apiContext.length === 0) {
                throw new Error('无法获取聊天上下文');
            }

            const finalMessages = [
                ...apiContext,
                { role: 'user', content: settings.optionsTemplate }
            ];

            let content = '';

            if (settings.optionsApiType === 'gemini') {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.optionsApiModel}:generateContent?key=${settings.optionsApiKey}`;
                logger.log('Requesting options from Gemini:', url);
                const body = { contents: this.transformMessagesForGemini(finalMessages) };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    logger.error('Gemini API 响应错误:', errorText);
                    throw new Error(`Gemini API请求失败: ${response.status} - ${errorText}`);
                }
                const data = await response.json();
                logger.log('Gemini API 响应数据:', data);
                content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } else { // 'openai'
                const { optionsApiKey, optionsBaseUrl, optionsApiModel } = settings;
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
                        stream: false, // 强制非流式，与参考脚本一致
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    logger.error('API 响应错误 (raw):', errorText);
                    throw new Error(`API请求失败: ${response.status} - ${errorText}`);
                }
                const data = await response.json();
                logger.log('API 响应数据 (OpenAI-兼容模式):', data);
                // Per user request, parse this response as if it's from Gemini,
                // because they use a Gemini proxy. Fallback to OpenAI format.
                content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || '';
            }


            const options = this.parseOptions(content);
            logger.log('解析出的选项:', options);
            this.displayOptions(options);
        } catch (error) {
            logger.error('生成选项失败:', error);
            this.showGeneratingUI(`生成失败: ${error.message}`, 5000);
        } finally {
            this.isGenerating = false;
        }
    },

    parseOptions(content) {
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
    },


    showGeneratingUI(message, duration = null) {
        let container = document.getElementById('ti-loading-container');
        const sendForm = document.getElementById('send_form');
        if (!sendForm) return;

        if (!container) {
            container = document.createElement('div');
            container.id = 'ti-loading-container';
            Object.assign(container.style, {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px',
                color: 'var(--text_color_secondary)',
                opacity: '0.8',
                width: '100%',
            });
            sendForm.insertAdjacentElement('beforebegin', container);
        }
        container.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span style="margin-left: 8px;">${message}</span>`;
        container.style.display = 'flex';


        if (duration) {
            setTimeout(() => this.hideGeneratingUI(), duration);
        }
    },

    hideGeneratingUI() {
        const loadingContainer = document.getElementById('ti-loading-container');
        if (loadingContainer) loadingContainer.style.display = 'none';
    },

    async displayOptions(options) {
        this.hideGeneratingUI();
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) oldContainer.remove();

        const sendForm = document.getElementById('send_form');
        if (!sendForm || !options || options.length === 0) {
            if (!options || options.length === 0) {
                this.showGeneratingUI('未能生成有效选项', 3000);
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
};

function initializeTypingIndicator() {
    injectGlobalStyles();
    const settings = getSettings();
    addExtensionSettings(settings);
    applyBasicStyle();

    const showIndicatorEvents = [event_types.GENERATION_AFTER_COMMANDS];
    const hideIndicatorEvents = [event_types.GENERATION_STOPPED, event_types.GENERATION_ENDED, event_types.CHAT_CHANGED];

    showIndicatorEvents.forEach(e => eventSource.on(e, showTypingIndicator));
    hideIndicatorEvents.forEach(e => eventSource.on(e, hideTypingIndicator));

    eventSource.on(event_types.GENERATION_ENDED, () => {
        if (getSettings().optionsGenEnabled) {
            OptionsGenerator.generateOptions();
        }
    });

    eventSource.on(event_types.CHAT_CHANGED, () => {
        logger.log('CHAT_CHANGED event triggered.');
        // 首先，像往常一样隐藏所有UI
        hideTypingIndicator();
        OptionsGenerator.hideGeneratingUI();
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) {
            logger.log('隐藏已存在的选项容器。');
            oldContainer.remove();
        }

        // 然后，在新聊天加载后，检查是否需要自动生成选项
        setTimeout(() => {
            logger.log('开始延时检查...');
            const settings = getSettings();
            if (!settings.optionsGenEnabled) {
                logger.log('选项生成已禁用，跳过检查。');
                return;
            }

            const isLastFromAI = isLastMessageFromAI();
            const optionsContainer = document.getElementById('ti-options-container');

            if (isLastFromAI && !optionsContainer && !OptionsGenerator.isGenerating) {
                logger.log('条件满足，准备自动生成选项。');
                OptionsGenerator.generateOptions();
            } else {
                logger.log('不满足自动生成条件:', { isLastFromAI, hasOptionsContainer: !!optionsContainer, isGenerating: OptionsGenerator.isGenerating });
            }
        }, 500); // 延迟500毫秒以确保新聊天渲染完成
    });
}

function waitForCoreSystem() {
    if (typeof eventSource !== 'undefined' && eventSource.on) {
        logger.log('核心事件系统已就绪，初始化插件。');
        initializeTypingIndicator();
    } else {
        logger.log('等待核心事件系统加载...');
        setTimeout(waitForCoreSystem, 200);
    }
}

// 启动就绪检查
waitForCoreSystem();
