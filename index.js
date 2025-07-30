// SillyTavern an-issue-with-the-ai-director-extension-preventing-it-from-loading/core imports
import {
    name2,
    eventSource,
    event_types,
    isStreamingEnabled,
    saveSettingsDebounced,
    getContext,
    getCharacters,
    getLorebooks,
    sendSystemMessage,
} from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { selected_group } from '../../../group-chats.js';

const MODULE = 'ai_director';

/**
 * @typedef {Object} AIDirectorSettings
 * @property {boolean} typingIndicatorEnabled - 启用打字指示器
 * @property {boolean} showCharName - 显示角色名称
 * @property {boolean} animationEnabled - 启用省略号动画
 * @property {string} customText - 自定义文本
 * @property {boolean} optionsGenEnabled - 启用回复选项生成
 * @property {string} optionsApiKey - 回复选项API密钥
 * @property {string} optionsApiModel - 回复选项模型
 * @property {string} optionsBaseUrl - 回复选项API基础URL
 * @property {number} optionsCount - 生成选项数量
 * @property {string} optionsTemplate - 回复选项提示模板
 * @property {boolean} logEnabled - 启用日志记录
 */

/**
 * @type {AIDirectorSettings}
 */
const defaultSettings = {
    // 打字指示器设置
    typingIndicatorEnabled: true,
    showCharName: true,
    animationEnabled: true,
    customText: '正在输入',

    // 回复选项生成设置
    optionsGenEnabled: false,
    optionsApiKey: '',
    optionsApiModel: 'gemini-1.5-pro-latest',
    optionsBaseUrl: 'https://newapi.sisuo.de/v1',
    optionsCount: 3,
    optionsTemplate: `你是用户的AI助手。分析以下对话，生成{{count}}个用户可能想问的后续问题或回应选项，每个选项应简洁、多样化，并根据上下文高度相关。不要解释你的选择，只需提供选项列表，每个选项用"-"开头，格式如下：
- 第一个选项
- 第二个选项
- 第三个选项

对话历史:
{{context}}

角色卡:
{{char_card}}

世界设定:
{{world_info}}

注意：生成的选项应考虑角色、世界观和上下文。不要表现得像一个AI，应该扮演用户的角色。`,

    // 日志设置
    logEnabled: true,
};

function getSettings() {
    if (extension_settings[MODULE] === undefined) {
        extension_settings[MODULE] = structuredClone(defaultSettings);
    }
    // 迁移旧设置或补充新设置
    for (const key in defaultSettings) {
        if (extension_settings[MODULE][key] === undefined) {
            extension_settings[MODULE][key] = defaultSettings[key];
        }
    }
    return extension_settings[MODULE];
}

const Logger = {
    logBox: null,
    init(logContainer) {
        this.logBox = document.createElement('textarea');
        this.logBox.id = 'ai-director-log-box';
        this.logBox.readOnly = true;
        Object.assign(this.logBox.style, {
            width: '100%',
            height: '200px',
            marginTop: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: 'var(--text_color)',
            backgroundColor: 'var(--bg_color_2)',
            border: '1px solid var(--border_color)',
            resize: 'vertical',
        });
        logContainer.appendChild(this.logBox);
    },
    log(message) {
    const settings = getSettings();
        if (!settings.logEnabled) return;

        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = `[${timestamp}] ${message}\n`;

        console.log(`[${MODULE}] ${message}`);
        if (this.logBox) {
            this.logBox.value += formattedMessage;
            this.logBox.scrollTop = this.logBox.scrollHeight;
        }
    },
    clear() {
        if (this.logBox) {
            this.logBox.value = '';
        }
        this.log('日志已清除。');
    }
};

function injectGlobalStyles() {
    const css = `
        /* 指示器修复与动画 */
        #typing_indicator.typing_indicator {
            opacity: 1 !important;
            background-color: transparent;
            padding: 8px 16px;
            margin: 8px auto;
            width: fit-content;
            max-width: 90%;
            text-align: center;
            color: var(--text_color);
        }
        .typing-ellipsis::after {
            display: inline-block;
            animation: ellipsis-animation 1.4s infinite;
            content: '.';
            width: 1.2em;
            text-align: left;
            vertical-align: bottom;
        }
        @keyframes ellipsis-animation {
            0% { content: '.'; }
            33% { content: '..'; }
            66%, 100% { content: '...'; }
        }

        /* 设置UI */
        .ai-director-tabs {
            display: flex;
            border-bottom: 1px solid var(--border_color);
            margin-bottom: 10px;
        }
        .ai-director-tab-button {
            background: var(--bg_color_2);
            border: 1px solid var(--border_color);
            border-bottom: none;
            padding: 8px 15px;
            cursor: pointer;
            border-radius: 5px 5px 0 0;
            margin-right: 5px;
            position: relative;
            bottom: -1px;
        }
        .ai-director-tab-button.active {
            background: var(--bg_color);
            border-bottom: 1px solid var(--bg_color);
        }
        .ai-director-tab-content {
            display: none;
        }
        .ai-director-tab-content.active {
            display: block;
        }
        .ai-director-settings-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px 15px;
            align-items: center;
        }
        .ai-director-settings-grid > label {
            justify-self: end;
        }
    `;
    let styleTag = document.getElementById('ai-director-global-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'ai-director-global-style';
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
    }
}

function addExtensionSettings(settings) {
    const settingsContainer = document.getElementById('extensions_settings');
    if (!settingsContainer) return;

    const inlineDrawer = document.createElement('div');
    inlineDrawer.classList.add('inline-drawer');
    settingsContainer.append(inlineDrawer);

    const inlineDrawerToggle = document.createElement('div');
    inlineDrawerToggle.classList.add('inline-drawer-toggle', 'inline-drawer-header');
    const extensionName = document.createElement('b');
    extensionName.textContent = 'AI导演';
    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');
    inlineDrawerToggle.append(extensionName, inlineDrawerIcon);

    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');
    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

    // Tab buttons
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'ai-director-tabs';
    inlineDrawerContent.appendChild(tabsContainer);

    // Content containers
    const contentsContainer = document.createElement('div');
    inlineDrawerContent.appendChild(contentsContainer);

    const tabs = {
        '打字指示器': createTypingIndicatorSettings,
        '回复选项': createOptionsGeneratorSettings,
        '日志': createLogSettings,
    };

    Object.keys(tabs).forEach(tabName => {
        const button = document.createElement('button');
        button.className = 'ai-director-tab-button';
        button.textContent = tabName;
        tabsContainer.appendChild(button);

        const content = document.createElement('div');
        content.className = 'ai-director-tab-content';
        contentsContainer.appendChild(content);

        tabs[tabName](content, settings);

        button.addEventListener('click', () => {
            tabsContainer.querySelectorAll('.ai-director-tab-button').forEach(btn => btn.classList.remove('active'));
            contentsContainer.querySelectorAll('.ai-director-tab-content').forEach(c => c.classList.remove('active'));
            button.classList.add('active');
            content.classList.add('active');
        });
    });

    // Activate the first tab by default
    tabsContainer.querySelector('.ai-director-tab-button').classList.add('active');
    contentsContainer.querySelector('.ai-director-tab-content').classList.add('active');
}

// Helper to create a setting row
function createSetting(container, type, label, settingKey, options = {}) {
    const { placeholder, width = '100%', onInput } = options;
    const settings = getSettings();

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    container.appendChild(labelElement);

    let inputElement;
    if (type === 'checkbox') {
        const checkboxLabel = document.createElement('label');
        checkboxLabel.classList.add('checkbox_label');
        inputElement = document.createElement('input');
        inputElement.type = 'checkbox';
        inputElement.checked = settings[settingKey];
        inputElement.addEventListener('change', () => {
            settings[settingKey] = inputElement.checked;
        saveSettingsDebounced();
            if (onInput) onInput(inputElement.checked);
        });
        const checkboxText = document.createElement('span'); // Dummy span for alignment
        checkboxLabel.append(inputElement, checkboxText);
        container.appendChild(checkboxLabel);
        // We moved the label to the grid, so we remove the original one.
        labelElement.remove();
        return;
    }
    else if (type === 'textarea') {
        inputElement = document.createElement('textarea');
        inputElement.style.height = '150px';
    } else {
        inputElement = document.createElement('input');
        inputElement.type = type;
    }

    inputElement.value = settings[settingKey];
    if (placeholder) inputElement.placeholder = placeholder;
    inputElement.style.width = width;
    inputElement.addEventListener('input', () => {
        const value = type === 'number' ? parseInt(inputElement.value) : inputElement.value;
        settings[settingKey] = value;
        saveSettingsDebounced();
        if (onInput) onInput(value);
    });

    container.appendChild(inputElement);
}

function createTypingIndicatorSettings(container, settings) {
    const grid = document.createElement('div');
    grid.className = 'ai-director-settings-grid';
    container.appendChild(grid);

    const refreshIndicator = () => {
        const indicator = document.getElementById('typing_indicator');
        if (indicator) showTypingIndicator('refresh');
    };
    
    // Create settings using helper
    createSetting(grid, 'checkbox', '', 'typingIndicatorEnabled', { onInput: refreshIndicator });
    const enabledLabel = document.createElement('label');
    enabledLabel.textContent = "启用打字指示器";
    grid.insertBefore(enabledLabel, grid.lastChild.previousSibling);


    createSetting(grid, 'checkbox', '', 'showCharName', { onInput: refreshIndicator });
     const showNameLabel = document.createElement('label');
    showNameLabel.textContent = "显示角色名称";
    grid.insertBefore(showNameLabel, grid.lastChild.previousSibling);


    createSetting(grid, 'checkbox', '', 'animationEnabled', { onInput: refreshIndicator });
    const animationLabel = document.createElement('label');
    animationLabel.textContent = "启用动画";
    grid.insertBefore(animationLabel, grid.lastChild.previousSibling);

    createSetting(grid, 'text', '自定义内容:', 'customText', {
        placeholder: '使用 {char} 作为占位符',
        onInput: refreshIndicator
    });
}

function createOptionsGeneratorSettings(container, settings) {
    const grid = document.createElement('div');
    grid.className = 'ai-director-settings-grid';
    container.appendChild(grid);
    
    const optionsSettingsContainer = document.createElement('div');
    optionsSettingsContainer.style.gridColumn = '1 / -1'; // Span across all columns
    optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';

    createSetting(grid, 'checkbox', '', 'optionsGenEnabled', {
        onInput: (value) => {
            optionsSettingsContainer.style.display = value ? 'block' : 'none';
        }
    });
     const optionsEnabledLabel = document.createElement('label');
    optionsEnabledLabel.textContent = "启用回复选项";
    grid.insertBefore(optionsEnabledLabel, grid.lastChild.previousSibling);

    grid.appendChild(optionsSettingsContainer);

    const innerGrid = document.createElement('div');
    innerGrid.className = 'ai-director-settings-grid';
    optionsSettingsContainer.appendChild(innerGrid);

    createSetting(innerGrid, 'password', 'API密钥:', 'optionsApiKey', { placeholder: '输入API密钥' });
    createSetting(innerGrid, 'text', '模型:', 'optionsApiModel', { placeholder: '输入模型名称' });
    createSetting(innerGrid, 'text', '基础URL:', 'optionsBaseUrl', { placeholder: '输入API基础URL' });
    createSetting(innerGrid, 'number', '选项数量:', 'optionsCount');
    createSetting(innerGrid, 'textarea', '提示模板:', 'optionsTemplate');
}

function createLogSettings(container, settings) {
    createSetting(container, 'checkbox', '启用日志:', 'logEnabled');
    
    const clearButton = document.createElement('button');
    clearButton.textContent = '清除日志';
    clearButton.classList.add('menu_button');
    clearButton.style.marginTop = '10px';
    clearButton.addEventListener('click', () => Logger.clear());
    container.appendChild(clearButton);

    Logger.init(container);
}


function showTypingIndicator(type, _args, dryRun) {
    const settings = getSettings();
    const noIndicatorTypes = ['quiet', 'impersonate'];

    if (type !== 'refresh' && (noIndicatorTypes.includes(type) || dryRun)) {
        return;
    }

    if (!settings.typingIndicatorEnabled) {
        return;
    }
    
    if (settings.showCharName && !name2 && type !== 'refresh') {
        return;
    }

    if (legacyIndicatorTemplate && selected_group && !isStreamingEnabled()) {
        return;
    }

    Logger.log(`显示打字指示器 (类型: ${type})`);

    const placeholder = '{char}';
    let finalText = settings.customText || defaultSettings.customText;

    if (settings.showCharName && name2) {
        finalText = finalText.includes(placeholder) ? finalText.replace(placeholder, name2) : `${name2} ${finalText}`;
        } else {
        finalText = finalText.replace(placeholder, '').trim();
    }

    const animationHtml = settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
    const htmlContent = `<div class="typing-indicator-text">${finalText}</div>${animationHtml}`;

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
        const wasChatScrolledDown = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 5;
        chat.appendChild(typingIndicator);
        if (wasChatScrolledDown) {
            chat.scrollTop = chat.scrollHeight;
        }
    }
}

function hideTypingIndicator() {
    Logger.log('隐藏打字指示器。');
    const typingIndicator = document.getElementById('typing_indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

const OptionsGenerator = {
    isGenerating: false,
    
    getCharacterCard() {
        try {
            if (typeof getCharacters !== 'function' || typeof window.characterId === 'undefined') return '';
            const char = getCharacters().find(c => c.id === window.characterId);
            return char ? `${char.name}:\n${char.description}` : '';
        } catch (error) {
            Logger.log(`获取角色卡失败: ${error}`);
            return '';
        }
    },

    getWorldInfo() {
        try {
            if (typeof getLorebooks !== 'function') return '';
            const activeLorebooks = getLorebooks().filter(book => book.enabled);
            return activeLorebooks.map(book => `${book.name}:\n${book.content}`).join('\n\n');
        } catch (error) {
            Logger.log(`获取世界设定失败: ${error}`);
            return '';
        }
    },

    getChatContext() {
        try {
            if (typeof getContext !== 'function') return '';
            return getContext().text;
        } catch (error) {
            Logger.log(`获取聊天上下文失败: ${error}`);
            return '';
        }
    },

    async generateOptions() {
        const settings = getSettings();
        if (!settings.optionsGenEnabled) return;

        if (this.isGenerating) {
            Logger.log('已在生成选项，跳过新请求。');
            return;
        }
        if (!settings.optionsApiKey) {
            Logger.log('回复选项API密钥未设置，跳过生成。');
            return;
        }

        this.isGenerating = true;
        this.showGeneratingUI('正在生成回复选项...');
        Logger.log('开始生成回复选项...');

        try {
            const context = this.getChatContext();
            const characterCard = this.getCharacterCard();
            const worldInfo = this.getWorldInfo();

            let prompt = settings.optionsTemplate;
            prompt = prompt.replace('{{context}}', context)
                           .replace('{{char_card}}', characterCard)
                           .replace('{{world_info}}', worldInfo)
                           .replace('{{count}}', settings.optionsCount);

            Logger.log(`使用的模型: ${settings.optionsApiModel}`);
            
            const response = await fetch(settings.optionsBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.optionsApiKey}`
                },
                body: JSON.stringify({
                    model: settings.optionsApiModel,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 500,
                    stream: false,
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API请求失败: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content || '';
            Logger.log(`API原始响应: ${content}`);
            const options = this.parseOptions(content);
            Logger.log(`解析出 ${options.length} 个选项。`);

            if (options.length > 0) {
                this.displayOptions(options);
            } else {
                this.showGeneratingUI('未能生成有效选项', 3000);
            }

        } catch (error) {
            Logger.log(`生成选项时出错: ${error.message}`);
            this.showGeneratingUI(`生成失败: ${error.message}`, 5000);
        } finally {
            this.isGenerating = false;
            this.hideGeneratingUI(0); // Hide the main "generating" message
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
                position: 'fixed', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                padding: '10px 20px', backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '8px', color: 'white', zIndex: '1000',
            });
            document.body.appendChild(container);
        }
        container.textContent = message;

        if (duration) {
            setTimeout(() => { if (container.textContent === message) this.hideGeneratingUI(); }, duration);
        }
    },

    hideGeneratingUI(delay = 0) {
        setTimeout(() => {
            const loadingContainer = document.getElementById('options-loading-container');
            if (loadingContainer) loadingContainer.remove();
        }, delay);
    },

    displayOptions(options) {
        this.hideOptions();
        const container = document.createElement('div');
        container.id = 'options-container';
        Object.assign(container.style, {
            position: 'fixed', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
            padding: '15px', backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '8px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            maxWidth: '80%', zIndex: '999'
        });

        const title = document.createElement('div');
        title.textContent = '推荐回复选项:';
        Object.assign(title.style, { color: 'white', marginBottom: '5px', textAlign: 'center' });
        container.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        Object.assign(closeBtn.style, {
            position: 'absolute', top: '5px', right: '5px', background: 'none',
            border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer'
        });
        closeBtn.onclick = () => this.hideOptions();
        container.appendChild(closeBtn);

        options.forEach(option => {
            const btn = document.createElement('button');
            btn.textContent = option;
            Object.assign(btn.style, {
                backgroundColor: 'rgba(60, 60, 60, 0.8)', color: 'white', border: 'none',
                borderRadius: '5px', padding: '8px 15px', cursor: 'pointer', textAlign: 'left',
            });
            btn.onclick = () => {
                const textarea = document.querySelector('#send_textarea, .send_textarea');
                if (textarea) {
                    textarea.value = option;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.focus();
                }
                this.hideOptions();
            };
            container.appendChild(btn);
        });

        document.body.appendChild(container);
    },

    hideOptions() {
        const container = document.getElementById('options-container');
        if (container) container.remove();
    }
};

// Main execution block
(function () {
    const requiredGlobals = {
        getContext, getCharacters, getLorebooks, eventSource, saveSettingsDebounced, sendSystemMessage,
    };

    for (const [name, imported] of Object.entries(requiredGlobals)) {
        if (typeof imported === 'undefined') {
            console.error(`[${MODULE}] Critical global function "${name}" is missing. Extension will not run.`);
            // Maybe notify the user in the UI as well
            if (typeof sendSystemMessage === 'function') {
                sendSystemMessage('error', `AI导演扩展未能加载，因为缺少核心函数: ${name}`);
            }
            return;
        }
    }
    
    const settings = getSettings();
    injectGlobalStyles();
    addExtensionSettings(settings);

    // Event listeners
    const showIndicatorEvents = [event_types.GENERATION_STARTED, event_types.GENERATION_AFTER_COMMANDS];
    const hideIndicatorEvents = [event_types.GENERATION_STOPPED, event_types.GENERATION_ENDED, event_types.CHAT_CHANGED];

    showIndicatorEvents.forEach(e => eventSource.on(e, showTypingIndicator));
    hideIndicatorEvents.forEach(e => eventSource.on(e, hideTypingIndicator));

    eventSource.on(event_types.GENERATION_ENDED, () => OptionsGenerator.generateOptions());
    eventSource.on(event_types.CHAT_CHANGED, () => OptionsGenerator.hideOptions());

    Logger.log('AI导演扩展已成功加载。');
})();
