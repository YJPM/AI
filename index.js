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
 * @property {string} optionsApiKey - API密钥
 * @property {string} optionsApiModel - 使用的模型
 * @property {string} optionsBaseUrl - API基础URL
 * @property {number} optionsCount - 生成选项数量
 * @property {string} optionsTemplate - 选项生成提示模板
 */

/**
 * @type {TypingIndicatorSettings}
 */
const defaultSettings = {
    enabled: false,
    showCharName: false,
    animationEnabled: true,
    customText: '正在输入',
    debug: false,
    // 选项生成相关设置
    optionsGenEnabled: false,
    optionsApiKey: '',
    optionsApiModel: 'gemini-2.5-falsh-free',
    optionsBaseUrl: 'https://newapi.sisuo.de/v1',
    optionsCount: 3,
    optionsTemplate: `你是用户的AI助手。分析以下对话和用户当前输入，生成3-5个用户可能想问的后续问题或回应选项，每个选项应简洁、多样化，并根据上下文高度相关。不要解释你的选择，只需提供选项列表，每个选项用"-"开头，格式如下：
- 第一个选项
- 第二个选项
- 第三个选项

对话历史：
{{context}}

用户当前输入：
{{user_input}}

角色卡：
{{char_card}}

世界设定：
{{world_info}}

注意：生成的选项应考虑角色、世界观和上下文。不要表现得像一个AI，应该扮演用户的角色。`,
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
    extensionName.textContent = '正在输入中…';
    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');
    inlineDrawerToggle.append(extensionName, inlineDrawerIcon);

    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');
    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

    // 刷新指示器（如果可见）的辅助函数
    const refreshIndicator = () => {
        const indicator = document.getElementById('typing_indicator');
        if (indicator) {
            showTypingIndicator('refresh', null, false);
        }
    };

    // 启用
    const enabledCheckboxLabel = document.createElement('label');
    enabledCheckboxLabel.classList.add('checkbox_label');
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = settings.enabled;
    enabledCheckbox.addEventListener('change', () => {
        settings.enabled = enabledCheckbox.checked;
        saveSettingsDebounced();
    });
    const enabledCheckboxText = document.createElement('span');
    enabledCheckboxText.textContent = '启用';
    enabledCheckboxLabel.append(enabledCheckbox, enabledCheckboxText);
    inlineDrawerContent.append(enabledCheckboxLabel);

    // 启用动画
    const animationEnabledCheckboxLabel = document.createElement('label');
    animationEnabledCheckboxLabel.classList.add('checkbox_label');
    const animationEnabledCheckbox = document.createElement('input');
    animationEnabledCheckbox.type = 'checkbox';
    animationEnabledCheckbox.checked = settings.animationEnabled;
    animationEnabledCheckbox.addEventListener('change', () => {
        settings.animationEnabled = animationEnabledCheckbox.checked;
        saveSettingsDebounced();
        refreshIndicator();
    });
    const animationEnabledCheckboxText = document.createElement('span');
    animationEnabledCheckboxText.textContent = '启用动画';
    animationEnabledCheckboxLabel.append(animationEnabledCheckbox, animationEnabledCheckboxText);
    inlineDrawerContent.append(animationEnabledCheckboxLabel);

    // 自定义内容区域
    const customContentContainer = document.createElement('div');
    customContentContainer.style.marginTop = '10px';

    // 显示角色名称复选框
    const showNameCheckboxLabel = document.createElement('label');
    showNameCheckboxLabel.classList.add('checkbox_label');
    const showNameCheckbox = document.createElement('input');
    showNameCheckbox.type = 'checkbox';
    showNameCheckbox.checked = settings.showCharName;
    showNameCheckbox.addEventListener('change', () => {
        settings.showCharName = showNameCheckbox.checked;
        saveSettingsDebounced();
        refreshIndicator();
    });
    const showNameCheckboxText = document.createElement('span');
    showNameCheckboxText.textContent = '显示角色名称';
    showNameCheckboxLabel.append(showNameCheckbox, showNameCheckboxText);
    customContentContainer.append(showNameCheckboxLabel);

    // 文字内容
    const customTextLabel = document.createElement('label');
    customTextLabel.textContent = '自定义内容：';
    customTextLabel.style.display = 'block';
    const customTextInput = document.createElement('input');
    customTextInput.type = 'text';
    customTextInput.value = settings.customText;
    customTextInput.placeholder = '输入显示的文字';
    customTextInput.style.width = '80%';
    customTextInput.addEventListener('input', () => {
        settings.customText = customTextInput.value;
        saveSettingsDebounced();
        refreshIndicator();
    });

    const placeholderHint = document.createElement('small');
    placeholderHint.textContent = '使用 {char} 作为角色名称的占位符。';
    placeholderHint.style.display = 'block';
    placeholderHint.style.marginTop = '4px';
    placeholderHint.style.color = 'var(--text_color_secondary)';

    customContentContainer.append(customTextLabel, customTextInput, placeholderHint);
    inlineDrawerContent.append(customContentContainer);

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
    optionsSettingsContainer.appendChild(baseUrlLabel);
    optionsSettingsContainer.appendChild(baseUrlInput);

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

// 检查最后一条消息是否来自AI
function isLastMessageFromAI() {
    const messages = document.querySelectorAll('#chat .mes');
    if (messages.length === 0) return false;

    const lastMessage = messages[messages.length - 1];
    return lastMessage.classList.contains('bot_mes');
}

// 选项生成器对象
const OptionsGenerator = {
    isGenerating: false,

    getCharacterCard() {
        try {
            if (typeof getCharacters === 'function' && typeof characterId !== 'undefined') {
                const char = getCharacters().find(c => c.id === characterId);
                return char ? `${char.name}:\n${char.description}` : '';
            }
        } catch (error) {
            logger.error('获取角色卡信息失败:', error);
        }
        return '';
    },

    getWorldInfo() {
        try {
            if (typeof getLorebooks === 'function') {
                const activeLorebooks = getLorebooks().filter(book => book.enabled);
                return activeLorebooks.map(book => `${book.name}:\n${book.content}`).join('\n\n');
            }
        } catch (error) {
            logger.error('获取世界设定信息失败:', error);
        }
        return '';
    },

    getChatContext() {
        try {
            if (typeof getContext === 'function') {
                return getContext().text;
            }
        } catch (error) {
            logger.error('获取聊天上下文失败:', error);
        }
        return '';
    },

    getUserInput() {
        try {
            const textarea = document.querySelector('#send_textarea, .send_textarea');
            return textarea ? textarea.value : '';
        } catch (error) {
            logger.error('获取用户输入失败:', error);
            return '';
        }
    },

    async generateOptions() {
        if (this.isGenerating) return;

        const settings = getSettings();
        if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
            logger.log('选项生成功能未启用或API密钥未设置');
            return;
        }

        this.showGeneratingUI('正在生成回复选项...');
        this.isGenerating = true;
        logger.log('开始生成选项...');

        try {
            const characterCard = this.getCharacterCard();
            const worldInfo = this.getWorldInfo();
            const context = this.getChatContext();
            const userInput = this.getUserInput();

            let prompt = settings.optionsTemplate;
            prompt = prompt.replace('{{context}}', context);
            prompt = prompt.replace('{{user_input}}', userInput);
            prompt = prompt.replace('{{char_card}}', characterCard);
            prompt = prompt.replace('{{world_info}}', worldInfo);

            logger.log('生成选项的最终提示:', prompt);

            const baseUrl = settings.optionsBaseUrl.endsWith('/') ? settings.optionsBaseUrl.slice(0, -1) : settings.optionsBaseUrl;
            const apiUrl = `${baseUrl}/chat/completions`;

            logger.log('Requesting options from:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.optionsApiKey}`
                },
                body: JSON.stringify({
                    model: settings.optionsApiModel,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 1024,
                    stream: false,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                logger.error('API 响应错误:', errorData);
                throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`);
            }

            const data = await response.json();
            logger.log('API 响应数据:', data);
            const content = data.choices[0]?.message?.content || '';
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
        return content.split('\n')
            .map(line => line.trim())
            .filter(line => /^[-*]\s*|^\d+\.\s*/.test(line))
            .map(line => line.replace(/^[-*]\s*|^\d+\.\s*/, '').trim())
            .filter(option => option);
    },

    showGeneratingUI(message, duration = null) {
        let container = document.getElementById('options-loading-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'options-loading-container';
            Object.assign(container.style, {
                position: 'fixed',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '10px 20px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '8px',
                color: 'white',
                zIndex: '1000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
            });
            document.body.appendChild(container);
        }
        container.textContent = message;

        if (duration) {
            setTimeout(() => this.hideGeneratingUI(), duration);
        }
    },

    hideGeneratingUI() {
        const loadingContainer = document.getElementById('options-loading-container');
        if (loadingContainer) loadingContainer.remove();
    },

    displayOptions(options) {
        this.hideGeneratingUI();
        const oldContainer = document.getElementById('options-container');
        if (oldContainer) oldContainer.remove();

        if (!options || options.length === 0) {
            this.showGeneratingUI('未能生成有效选项', 3000);
            return;
        }

        const container = document.createElement('div');
        container.id = 'options-container';
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '15px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '80%',
            zIndex: '1000'
        });

        const title = document.createElement('div');
        title.textContent = '推荐回复选项:';
        Object.assign(title.style, {
            color: 'white',
            fontSize: '14px',
            marginBottom: '5px',
            textAlign: 'center'
        });
        container.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer'
        });
        closeBtn.onclick = () => container.remove();
        container.appendChild(closeBtn);

        const optionsContainer = document.createElement('div');
        Object.assign(optionsContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        });

        options.forEach(option => {
            const btn = document.createElement('button');
            btn.textContent = option;
            Object.assign(btn.style, {
                backgroundColor: 'rgba(60, 60, 60, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 15px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.2s'
            });

            btn.onmouseover = () => { btn.style.backgroundColor = 'rgba(90, 90, 90, 0.8)'; };
            btn.onmouseout = () => { btn.style.backgroundColor = 'rgba(60, 60, 60, 0.8)'; };

            btn.onclick = () => {
                const textarea = document.querySelector('#send_textarea, .send_textarea');
                if (textarea) {
                    textarea.value = option;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.focus();
                }
                container.remove();
            };
            optionsContainer.appendChild(btn);
        });

        container.appendChild(optionsContainer);
        document.body.appendChild(container);
    }
};

(function () {
    // 确保从 script.js 正确导入
    const requiredImports = {
        name2,
        eventSource,
        event_types,
        isStreamingEnabled,
        saveSettingsDebounced,
    };

    // 检查核心函数是否都已加载
    for (const [name, imported] of Object.entries(requiredImports)) {
        if (typeof imported === 'undefined') {
            logger.error(`Typing Indicator Extension: Critical import "${name}" is missing.`);
            return; // 提前退出，防止插件崩溃
        }
    }

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
        // 首先，像往常一样隐藏所有UI
        OptionsGenerator.hideGeneratingUI();
        const oldContainer = document.getElementById('options-container');
        if (oldContainer) oldContainer.remove();

        // 然后，在新聊天加载后，检查是否需要自动生成选项
        // 使用setTimeout确保DOM更新完毕
        setTimeout(() => {
            if (getSettings().optionsGenEnabled && isLastMessageFromAI()) {
                const optionsContainer = document.getElementById('options-container');
                if (!optionsContainer && !OptionsGenerator.isGenerating) {
                    logger.log('检测到最后一条消息来自AI，且无选项，自动生成。');
                    OptionsGenerator.generateOptions();
                }
            }
        }, 100); // 延迟100毫秒以确保新聊天渲染完成
    });
})();
