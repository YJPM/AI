import {
    name2,
    eventSource,
    event_types,
    isStreamingEnabled,
    saveSettingsDebounced,
    getContext,
} from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { selected_group } from '../../../group-chats.js';

const MODULE = 'typing_indicator';
const legacyIndicatorTemplate = document.getElementById('typing_indicator_template');

// 日志记录器
const logger = {
    logBox: null,
    log(message) {
        console.log(`[AI-Director] ${message}`);
        if (this.logBox) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.textContent = `[${timestamp}] ${message}`;
            this.logBox.appendChild(logEntry);
            this.logBox.scrollTop = this.logBox.scrollHeight;
        }
    },
    init(logBoxElement) {
        this.logBox = logBoxElement;
        this.log('日志系统已初始化。');
    }
};

/**
 * @typedef {Object} TypingIndicatorSettings
 * @property {boolean} enabled
 * @property {boolean} showCharName
 * @property {boolean} animationEnabled - 是否启用末尾的...动画。
 * @property {string} customText
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
    // 选项生成相关设置
    optionsGenEnabled: false,
    optionsApiKey: '',
    optionsApiModel: 'gemini-2.5-pro-free',
    optionsBaseUrl: 'https://newapi.sisuo.de/v1',
    optionsCount: 3,
    optionsTemplate: `你是用户的AI助手。分析以下对话，生成3-5个用户可能想问的后续问题或回应选项，每个选项应简洁、多样化，并根据上下文高度相关。不要解释你的选择，只需提供选项列表，每个选项用"-"开头，格式如下：
- 第一个选项
- 第二个选项
- 第三个选项

对话历史：
{{context}}

角色卡：
{{char_card}}

世界设定：
{{world_info}}

注意：生成的选项应考虑角色、世界观和上下文。不要表现得像一个AI，应该扮演用户的角色。`
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

        /* 日志区域样式 */
        .ai-director-log-container {
            margin-top: 15px;
            border-top: 1px solid var(--border_color);
            padding-top: 15px;
        }
        .ai-director-log-header {
            cursor: pointer;
            font-weight: bold;
            user-select: none;
        }
        .ai-director-log-box {
            display: none;
            margin-top: 10px;
            height: 150px;
            background-color: var(--background_panel);
            border: 1px solid var(--border_color);
            border-radius: 5px;
            padding: 8px;
            overflow-y: scroll;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.5;
            color: var(--text_color_secondary);
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
    templateHint.textContent = '使用 {{context}} 表示对话历史, {{char_card}} 表示角色卡, {{world_info}} 表示世界设定。';
    templateHint.style.display = 'block';
    templateHint.style.marginTop = '4px';
    templateHint.style.color = 'var(--text_color_secondary)';

    optionsSettingsContainer.appendChild(templateLabel);
    optionsSettingsContainer.appendChild(templateInput);
    optionsSettingsContainer.appendChild(templateHint);

    optionsContainer.appendChild(optionsSettingsContainer);
    inlineDrawerContent.append(optionsContainer);
    
    // 日志区域
    const logContainer = document.createElement('div');
    logContainer.className = 'ai-director-log-container';
    
    const logHeader = document.createElement('div');
    logHeader.className = 'ai-director-log-header';
    logHeader.textContent = '调试日志 ▼';
    logHeader.onclick = () => {
        const logBox = document.querySelector('.ai-director-log-box');
        const isHidden = logBox.style.display === 'none';
        logBox.style.display = isHidden ? 'block' : 'none';
        logHeader.textContent = isHidden ? '调试日志 ▲' : '调试日志 ▼';
    };

    const logBox = document.createElement('div');
    logBox.className = 'ai-director-log-box';

    logContainer.append(logHeader, logBox);
    inlineDrawerContent.append(logContainer);

    // 初始化日志系统
    logger.init(logBox);
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

// 选项生成器对象
const OptionsGenerator = {
    isGenerating: false,

    // 获取上下文信息
    async getContextData() {
        logger.log('开始获取上下文数据...');
        try {
            const context = await getContext();
            if (!context || !context.characters) {
                throw new Error('获取的上下文数据无效。');
            }
            logger.log(`成功获取上下文。包含 ${context.characters.length} 个角色。`);
            return {
                context: context.text,
                char: context.characters[0], // 假设只有一个角色
                lorebooks: context.lorebooks || [],
            };
        } catch (error) {
            logger.log(`获取上下文数据失败: ${error.message}`);
            throw error;
        }
    },

    // 使用API生成回复选项
    async generateOptions() {
        logger.log('检查是否开始生成选项...');
        if (this.isGenerating) {
            logger.log('正在生成中，取消本次请求。');
            return;
        }

        const settings = getSettings();
        if (!settings.optionsGenEnabled) {
            logger.log('选项生成功能未启用，跳过。');
            return;
        }
        if (!settings.optionsApiKey) {
            logger.log('API密钥未设置，跳过。');
            this.showGeneratingUI('API密钥未设置', 5000);
            return;
        }
        
        this.isGenerating = true;
        this.showGeneratingUI('正在生成回复选项...');
        logger.log('开始生成选项...');

        try {
            // 准备API请求数据
            const { context, char, lorebooks } = await this.getContextData();
            const charCard = char ? `${char.name}:\n${char.description}` : '无角色信息';
            const worldInfo = lorebooks.map(book => `${book.name}:\n${book.content}`).join('\n\n') || '无世界信息';

            // 处理模板
            let prompt = settings.optionsTemplate;
            prompt = prompt.replace('{{context}}', context);
            prompt = prompt.replace('{{char_card}}', charCard);
            prompt = prompt.replace('{{world_info}}', worldInfo);
            
            logger.log(`最终发送的Prompt: \n${prompt.substring(0, 300)}...`);

            // 调用API
            logger.log(`向 ${settings.optionsBaseUrl} 发起API请求...`);
            const response = await fetch(settings.optionsBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.optionsApiKey}`
                },
                body: JSON.stringify({
                    model: settings.optionsApiModel,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                    stream: false,
                })
            });
            
            logger.log(`收到API响应，状态码: ${response.status}`);
            // 处理响应
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: '无法解析错误响应' } }));
                logger.log(`API错误: ${JSON.stringify(errorData)}`);
                throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`);
            }

            const data = await response.json();
            logger.log('成功解析API响应JSON。');
            const content = data.choices && data.choices[0] && data.choices[0].message
                ? data.choices[0].message.content
                : '';
            
            logger.log(`从API获取到的原始回复内容:\n${content}`);

            // 解析选项
            const options = this.parseOptions(content);
            logger.log(`解析出 ${options.length} 个选项: ${options.join('; ')}`);

            // 显示选项
            this.displayOptions(options);

        } catch (error) {
            logger.log(`生成选项失败: ${error.message}`);
            this.showGeneratingUI(`生成失败: ${error.message}`, 5000);
        } finally {
             this.isGenerating = false;
             logger.log('生成流程结束。');
        }
    },

    // 解析选项内容
    parseOptions(content) {
        const options = [];
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            // 匹配以"-"、"*"或数字加点开头的行
            if (/^[-*]\s+|^\d+\.\s+/.test(trimmedLine)) {
                const option = trimmedLine.replace(/^[-*]\s+|^\d+\.\s+/, '').trim();
                if (option) {
                    options.push(option);
                }
            }
        }

        return options;
    },

    // 显示或更新提示UI
    showGeneratingUI(message, duration = null) {
        let container = document.getElementById('options-loading-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'options-loading-container';
            container.style.position = 'fixed';
            container.style.bottom = '10px';
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            container.style.padding = '10px 20px';
            container.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            container.style.borderRadius = '8px';
            container.style.color = 'white';
            container.style.zIndex = '1000';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.gap = '10px';
            document.body.appendChild(container);
        }
        
        container.textContent = message;

        if (duration) {
            setTimeout(() => {
                this.hideGeneratingUI();
            }, duration);
        } else {
            // 如果没有设置持续时间，则不自动隐藏
        }
    },

    // 隐藏生成中提示
    hideGeneratingUI() {
        const loadingContainer = document.getElementById('options-loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
    },

    // 显示生成的选项
    displayOptions(options) {
        // 移除提示和旧选项
        this.hideGeneratingUI();
        const oldContainer = document.getElementById('options-container');
        if (oldContainer) {
            oldContainer.remove();
        }

        if (!options || options.length === 0) {
            logger.log('没有生成有效选项，不显示UI。');
            this.showGeneratingUI('未能生成有效选项', 3000);
            return;
        }

        logger.log('开始渲染选项UI。');
        // 创建选项容器
        const container = document.createElement('div');
        container.id = 'options-container';
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.padding = '15px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.borderRadius = '8px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        container.style.maxWidth = '80%';
        container.style.zIndex = '1000';

        // 创建标题
        const title = document.createElement('div');
        title.textContent = '推荐回复选项:';
        title.style.color = 'white';
        title.style.fontSize = '14px';
        title.style.marginBottom = '5px';
        title.style.textAlign = 'center';
        container.appendChild(title);

        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '5px';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => container.remove();
        container.appendChild(closeBtn);

        // 创建选项按钮
        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.flexDirection = 'column';
        optionsContainer.style.gap = '8px';

        // 添加每个选项
        options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.textContent = option;
            btn.style.backgroundColor = 'rgba(60, 60, 60, 0.8)';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '5px';
            btn.style.padding = '8px 15px';
            btn.style.cursor = 'pointer';
            btn.style.textAlign = 'left';
            btn.style.transition = 'background-color 0.2s';

            btn.onmouseover = () => { btn.style.backgroundColor = 'rgba(90, 90, 90, 0.8)'; };
            btn.onmouseout = () => { btn.style.backgroundColor = 'rgba(60, 60, 60, 0.8)'; };

            // 点击选项时执行操作
            btn.onclick = () => {
                // 将选中的文本填入发送框
                const textareaElement = document.querySelector('#send_textarea, .send_textarea');
                if (textareaElement) {
                    textareaElement.value = option;
                    textareaElement.dispatchEvent(new Event('input', { bubbles: true }));

                    // 聚焦输入框
                    textareaElement.focus();
                }

                // 移除选项容器
                container.remove();
            };

            optionsContainer.appendChild(btn);
        });

        container.appendChild(optionsContainer);
        document.body.appendChild(container);
    }
};

(function () {
    injectGlobalStyles();

    const settings = getSettings();
    addExtensionSettings(settings);

    applyBasicStyle();

    const showIndicatorEvents = [ event_types.GENERATION_AFTER_COMMANDS ];
    const hideIndicatorEvents = [ event_types.GENERATION_STOPPED, event_types.GENERATION_ENDED, event_types.CHAT_CHANGED ];

    // 注册打字指示器事件
    showIndicatorEvents.forEach(e => eventSource.on(e, showTypingIndicator));
    hideIndicatorEvents.forEach(e => eventSource.on(e, hideTypingIndicator));

    // 在AI回复结束时生成选项
    eventSource.on(event_types.GENERATION_ENDED, async () => {
        logger.log(`捕获到 ${event_types.GENERATION_ENDED} 事件。`);
        if (getSettings().optionsGenEnabled) {
            await OptionsGenerator.generateOptions();
        }
    });

    // 在聊天切换时清除选项
    eventSource.on(event_types.CHAT_CHANGED, () => {
        logger.log(`捕获到 ${event_types.CHAT_CHANGED} 事件，清除UI。`);
        OptionsGenerator.hideGeneratingUI();
        const oldContainer = document.getElementById('options-container');
        if (oldContainer) {
            oldContainer.remove();
        }
    });
})();
