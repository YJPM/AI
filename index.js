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

    // 恢复为原始透明背景样式，移除所有渐变、圆角和阴影
    styleTag.textContent = `
        .typing_indicator {
            background-color: transparent; /* 恢复透明背景 */
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
            background-color: transparent !important; /* 强制透明背景 */
        }

        /* 确保所有提示容器都是透明背景 */
        .typing_indicator {
            background-color: transparent !important;
        }

        /* 省略号动画 */
        /* 恢复省略号显示 */
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

        /* 移除提示文字渐变样式，恢复为普通文本 */
        .typing-indicator-text {
            font-weight: normal; /* 恢复正常字体粗细 */
            background: none; /* 移除背景 */
            -webkit-background-clip: unset; /* 移除裁剪 */
            background-clip: unset;
            -webkit-text-fill-color: unset; /* 恢复文本颜色 */
            display: inline; /* 恢复默认行内显示 */
            animation: none; /* 移除动画 */
            color: var(--text_color); /* 确保文字颜色正常 */
        }

        /* 移除闪烁渐变动画 */
        /*
        @keyframes gradient-pulse {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        */

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

        /* 移除：浮动提示样式 */
        /*
        .ai-floating-indicator {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            pointer-events: none;
            background-color: transparent;
            padding: 8px 16px;
            margin: 0;
            width: fit-content;
            max-width: 90%;
            text-align: center;
            color: var(--text_color);
            box-shadow: none;
            display: none;
            justify-content: center;
            align-items: center;
        }
        */
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

    let typingIndicator = document.getElementById('typing_indicator');
    if (typingIndicator) {
        logger.log('showTypingIndicator: 找到现有指示器，更新内容并尝试显示。');
        typingIndicator.innerHTML = htmlContent;
        // typingIndicator.style.display = 'flex'; // 不再强制display，让系统控制
    } else {
        logger.log('showTypingIndicator: 未找到现有指示器，创建新指示器。');
        typingIndicator = document.createElement('div');
        typingIndicator.id = 'typing_indicator';
        // 恢复原始 class，移除 ai-floating-indicator
        typingIndicator.classList.add('typing_indicator');
        typingIndicator.innerHTML = htmlContent;

        // 恢复附加到 chat，而不是 body
        const chat = document.getElementById('chat');
        if (chat) {
            // 检查用户是否已滚动到底部（允许有几个像素的误差）
            const wasChatScrolledDown = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 5;

            chat.appendChild(typingIndicator);
            logger.log('showTypingIndicator: 指示器已附加到 chat。');

            // 如果用户在指示器出现前就位于底部，则自动滚动到底部以保持指示器可见
            if (wasChatScrolledDown) {
                chat.scrollTop = chat.scrollHeight;
                logger.log('showTypingIndicator: 聊天已自动滚动到底部。');
            }
        }
    }
    logger.log(`showTypingIndicator: 最终指示器 display 属性 (由CSS控制，JS不强制): ${typingIndicator.style.display}`);

    // 由于现在是固定定位，以下滚动逻辑不再需要
    // const chat = document.getElementById('chat');
    // if (chat) {
    //     // 检查用户是否已滚动到底部（允许有几个像素的误差）
    //     const wasChatScrolledDown = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 5;
    //     chat.appendChild(typingIndicator);
    //     // 如果用户在指示器出现前就位于底部，则自动滚动到底部以保持指示器可见
    //     if (wasChatScrolledDown) {
    //         chat.scrollTop = chat.scrollHeight;
    //     }
    // }
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

// (DOM-based, v4) 检查最后一条消息是否来自AI
function isLastMessageFromAI() {
    logger.log('检查最后一条消息 (last_mes 属性模式)...');
    try {
        const lastMessage = document.querySelector('#chat .last_mes');
        if (!lastMessage) {
            logger.log('未找到 .last_mes 元素，判定为非AI。');
            return false;
        }

        const isUser = lastMessage.getAttribute('is_user');
        logger.log(`找到 .last_mes 元素。is_user 属性为: "${isUser}".`);

        // The attribute value is a string "false", not a boolean.
        const isBot = isUser === 'false';
        logger.log(`结论: ${isBot ? '是' : '不是'} AI消息。`);
        return isBot;
    } catch (error) {
        logger.error('通过 .last_mes 检查最后一条消息时出错:', error);
        return false;
    }
}


// 选项生成器对象
const OptionsGenerator = {
    isGenerating: false,
    isManuallyStopped: false, // 新增标志，用于判断是否手动中止

    // (DOM-based, v2) 获取API上下文，增加详细日志
    getContextForAPI() {
        logger.log('从DOM获取API上下文 (属性模式, 增强日志)...');
        try {
            const messageElements = document.querySelectorAll('#chat .mes');
            const messages = [];
            logger.log(`发现 ${messageElements.length} 个 .mes 元素。开始遍历...`);

            messageElements.forEach((el, index) => {
                const contentEl = el.querySelector('.mes_text');
                if (contentEl) {
                    let role = 'system'; // Default role
                    const isUserAttr = el.getAttribute('is_user');
                    
                    if (isUserAttr === 'true') {
                        role = 'user';
                    } else if (isUserAttr === 'false') {
                        role = 'assistant';
                    }

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = contentEl.innerHTML.replace(/<br\s*\/?>/gi, '\n');
                    const content = (tempDiv.textContent || tempDiv.innerText || '').trim();

                    if (content) {
                        // 只包括用户和助手的消息
                        if (role === 'user' || role === 'assistant') {
                            const messageData = { role, content };
                            messages.push(messageData);
                            logger.log(`[消息 ${index}] -> 有效 (${role}):`, messageData);
                        } else {
                            logger.log(`[消息 ${index}] -> 跳过 (系统消息)`);
                        }
                    } else {
                        logger.log(`[消息 ${index}] -> 跳过 (无内容)`);
                    }
                } else {
                     logger.log(`[消息 ${index}] -> 跳过 (无 .mes_text 子元素)`);
                }
            });
            
            logger.log(`从DOM中提取了 ${messages.length} 条有效对话消息。`);
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

        // 重置手动中止标志，确保每次生成都是新的判断
        this.isManuallyStopped = false;

        const settings = getSettings();
        if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
            logger.log('选项生成功能未启用或API密钥未设置');
            return;
        }

        this.showGeneratingUI('AI助手思考中');
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
        logger.log(`showGeneratingUI: 尝试显示提示: "${message}"`);
        let container = document.getElementById('ti-loading-container');
        // 改为附加到 chat，与 showTypingIndicator 保持一致
        const chat = document.getElementById('chat');
        if (!chat) {
            logger.log('showGeneratingUI: chat 未找到，无法显示。');
            return;
        }

        if (!container) {
            logger.log('showGeneratingUI: 未找到现有容器，创建新容器。');
            container = document.createElement('div');
            container.id = 'ti-loading-container';
            // 恢复原始 class，不再添加 ai-floating-indicator
            container.classList.add('typing_indicator');
            // 改为附加到 chat，与 showTypingIndicator 保持一致
            chat.appendChild(container);
            logger.log('showGeneratingUI: 容器已附加到 chat。');
        } else {
            logger.log('showGeneratingUI: 找到现有容器，更新内容并尝试显示。');
        }

        // 统一内容结构，使其与 showTypingIndicator 完全一致 (文本 + 省略号动画)
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
            setTimeout(() => this.hideGeneratingUI(), duration);
        }
    },

    hideGeneratingUI() {
        const loadingContainer = document.getElementById('ti-loading-container');
        if (loadingContainer) {
            logger.log('hideGeneratingUI: 隐藏提示。');
            // 简单隐藏，以便重复利用
            loadingContainer.style.display = 'none'; // 保持隐藏逻辑
        }
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
    // 在手动中止时设置标志
    eventSource.on(event_types.GENERATION_STOPPED, () => {
        logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
        OptionsGenerator.isManuallyStopped = true;
    });
    hideIndicatorEvents.forEach(e => eventSource.on(e, hideTypingIndicator));

    eventSource.on(event_types.GENERATION_ENDED, () => {
        logger.log('GENERATION_ENDED event triggered.', { isManuallyStopped: OptionsGenerator.isManuallyStopped, optionsGenEnabled: getSettings().optionsGenEnabled });
        // 只有当选项生成功能启用且没有手动中止时才生成选项
        if (getSettings().optionsGenEnabled && !OptionsGenerator.isManuallyStopped) {
            logger.log('GENERATION_ENDED: 条件满足，触发选项生成。');
            OptionsGenerator.generateOptions();
        } else {
            logger.log('GENERATION_ENDED: 不满足选项生成条件，跳过。');
        }
        // 无论是否生成选项，都重置标志，为下一次生成做准备
        OptionsGenerator.isManuallyStopped = false;
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

            // 移除 !OptionsGenerator.isGenerating 条件，让 generateOptions 内部的检查来处理
            if (isLastFromAI && !optionsContainer) {
                logger.log('条件满足 (AI消息且无选项)，准备自动生成选项。');
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
