import {
    name2,
    eventSource,
    event_types,
    isStreamingEnabled,
    saveSettingsDebounced,
    getContext,
    getCharacters,
    getLorebooks,
} from '../../../../script.js';

import { extension_settings } from '../../../extensions.js';
import { selected_group } from '../../../group-chats.js';

const MODULE = 'typing_indicator';
const logger = (level, ...args) => console[level](`[TypingIndicator]`, ...args);

/**
 * @typedef {Object} TypingIndicatorSettings
 * @property {boolean} enabled
 * @property {boolean} showCharName
 * @property {boolean} animationEnabled
 * @property {string} customText
 * @property {boolean} optionsGenEnabled
 * @property {string} optionsApiKey
 * @property {string} optionsApiModel
 * @property {string} optionsBaseUrl
 * @property {number} optionsCount
 * @property {string} optionsTemplate
 * @property {boolean} debugMode
 */

const defaultSettings = {
    enabled: false,
    showCharName: false,
    animationEnabled: true,
    customText: '正在输入',
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

注意：生成的选项应考虑角色、世界观和上下文。不要表现得像一个AI，应该扮演用户的角色。`,
    debugMode: false,
};

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

function injectGlobalStyles() {
    const css = `
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
    `;
    let styleTag = document.getElementById('typing-indicator-global-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'typing-indicator-global-style';
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
    }
}

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

    const refreshIndicator = () => {
        const indicator = document.getElementById('typing_indicator');
        if (indicator) {
            showTypingIndicator('refresh', null, false);
        }
    };

    const createCheckbox = (id, labelText, checked, onChange) => {
        const label = document.createElement('label');
        label.classList.add('checkbox_label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = checked;
        checkbox.addEventListener('change', onChange);
        const text = document.createElement('span');
        text.textContent = labelText;
        label.append(checkbox, text);
        return label;
    };

    const createTextInput = (id, value, placeholder, onInput) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = id;
        input.value = value;
        input.placeholder = placeholder;
        input.style.width = '80%';
        input.addEventListener('input', onInput);
        return input;
    };

    const createTextarea = (id, value, placeholder, onInput) => {
        const textarea = document.createElement('textarea');
        textarea.id = id;
        textarea.value = value;
        textarea.placeholder = placeholder;
        textarea.style.width = '100%';
        textarea.style.height = '150px';
        textarea.style.fontFamily = 'monospace';
        textarea.addEventListener('input', onInput);
        return textarea;
    };

    const createNumberInput = (id, value, min, max, onInput) => {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = id;
        input.value = value;
        input.min = min;
        input.max = max;
        input.style.width = '100%';
        input.addEventListener('input', onInput);
        return input;
    };

    const createPasswordInput = (id, value, placeholder, onInput) => {
        const input = document.createElement('input');
        input.type = 'password';
        input.id = id;
        input.value = value;
        input.placeholder = placeholder;
        input.style.width = '100%';
        input.addEventListener('input', onInput);
        return input;
    };


    const createSettingGroup = (title) => {
        const group = document.createElement('div');
        group.style.marginTop = '20px';
        group.style.borderTop = '1px solid var(--border_color)';
        group.style.paddingTop = '15px';

        if (title) {
            const header = document.createElement('h4');
            header.textContent = title;
            header.style.margin = '0 0 10px 0';
            group.appendChild(header);
        }
        return group;
    };

    const createLabel = (text, forId) => {
        const label = document.createElement('label');
        label.textContent = text;
        label.htmlFor = forId;
        label.style.display = 'block';
        label.style.marginTop = '10px';
        return label;
    };

    // General Settings
    inlineDrawerContent.append(createCheckbox('ti-enabled', '启用', settings.enabled, (e) => {
        settings.enabled = e.target.checked;
        saveSettingsDebounced();
    }));
    inlineDrawerContent.append(createCheckbox('ti-animation', '启用动画', settings.animationEnabled, (e) => {
        settings.animationEnabled = e.target.checked;
        saveSettingsDebounced();
        refreshIndicator();
    }));
    inlineDrawerContent.append(createCheckbox('ti-debug', '调试模式', settings.debugMode, (e) => {
        settings.debugMode = e.target.checked;
        saveSettingsDebounced();
    }));

    const customContentContainer = createSettingGroup();
    customContentContainer.append(createCheckbox('ti-showName', '显示角色名称', settings.showCharName, (e) => {
        settings.showCharName = e.target.checked;
        saveSettingsDebounced();
        refreshIndicator();
    }));
    customContentContainer.append(createLabel('自定义内容：', 'ti-customText'));
    customContentContainer.append(createTextInput('ti-customText', settings.customText, '输入显示的文字', (e) => {
        settings.customText = e.target.value;
        saveSettingsDebounced();
        refreshIndicator();
    }));
    const placeholderHint = document.createElement('small');
    placeholderHint.textContent = '使用 {char} 作为角色名称的占位符。';
    placeholderHint.style.cssText = 'display: block; margin-top: 4px; color: var(--text_color_secondary);';
    customContentContainer.append(placeholderHint);
    inlineDrawerContent.append(customContentContainer);


    // Options Generation Settings
    const optionsContainer = createSettingGroup('回复选项生成');
    const optionsEnabledCheckbox = createCheckbox('ti-options-enabled', '启用回复选项生成', settings.optionsGenEnabled, (e) => {
        settings.optionsGenEnabled = e.target.checked;
        optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';
        saveSettingsDebounced();
    });
    optionsContainer.append(optionsEnabledCheckbox);

    const optionsSettingsContainer = document.createElement('div');
    optionsSettingsContainer.style.marginTop = '10px';
    optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';

    optionsSettingsContainer.append(createLabel('API密钥:', 'ti-apiKey'));
    optionsSettingsContainer.append(createPasswordInput('ti-apiKey', settings.optionsApiKey, '输入API密钥', (e) => {
        settings.optionsApiKey = e.target.value;
        saveSettingsDebounced();
    }));

    optionsSettingsContainer.append(createLabel('模型:', 'ti-model'));
    optionsSettingsContainer.append(createTextInput('ti-model', settings.optionsApiModel, '输入模型名称', (e) => {
        settings.optionsApiModel = e.target.value;
        saveSettingsDebounced();
    }));
    optionsSettingsContainer.children[optionsSettingsContainer.children.length - 1].style.width = '100%';

    optionsSettingsContainer.append(createLabel('基础URL:', 'ti-baseUrl'));
    optionsSettingsContainer.append(createTextInput('ti-baseUrl', settings.optionsBaseUrl, '输入API基础URL', (e) => {
        settings.optionsBaseUrl = e.target.value;
        saveSettingsDebounced();
    }));
    optionsSettingsContainer.children[optionsSettingsContainer.children.length - 1].style.width = '100%';

    optionsSettingsContainer.append(createLabel('选项数量:', 'ti-count'));
    optionsSettingsContainer.append(createNumberInput('ti-count', settings.optionsCount, 1, 10, (e) => {
        settings.optionsCount = parseInt(e.target.value, 10) || 3;
        saveSettingsDebounced();
    }));

    optionsSettingsContainer.append(createLabel('提示模板:', 'ti-template'));
    optionsSettingsContainer.append(createTextarea('ti-template', settings.optionsTemplate, '输入提示模板', (e) => {
        settings.optionsTemplate = e.target.value;
        saveSettingsDebounced();
    }));

    const templateHint = document.createElement('small');
    templateHint.textContent = '使用 {{context}} 表示对话历史, {{char_card}} 表示角色卡, {{world_info}} 表示世界设定。';
    templateHint.style.cssText = 'display: block; margin-top: 4px; color: var(--text_color_secondary);';
    optionsSettingsContainer.append(templateHint);

    optionsContainer.append(optionsSettingsContainer);
    inlineDrawerContent.append(optionsContainer);
}

function showTypingIndicator(type, _args, dryRun) {
    const settings = getSettings();
    const noIndicatorTypes = ['quiet', 'impersonate'];

    if (settings.debugMode) {
        logger('log', 'showTypingIndicator called', { type, dryRun });
    }

    if (type !== 'refresh' && (noIndicatorTypes.includes(type) || dryRun)) {
        return;
    }

    if (!settings.enabled) {
        return;
    }

    if (settings.showCharName && !name2 && type !== 'refresh') {
        return;
    }

    if (selected_group && !isStreamingEnabled()) {
        if (settings.debugMode) logger('log', 'Group chat without streaming, hiding indicator.');
        return;
    }

    const placeholder = '{char}';
    let finalText = settings.customText || defaultSettings.customText;

    if (settings.showCharName && name2) {
        finalText = finalText.includes(placeholder) ? finalText.replace(placeholder, name2) : `${name2}${finalText}`;
    } else {
        finalText = finalText.replace(placeholder, '').replace(/  +/g, ' ').trim();
    }

    const animationHtml = settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
    const htmlContent = `
    <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
        <div class="typing-indicator-text">${finalText}</div>
        ${animationHtml}
    </div>`;

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
    const settings = getSettings();
    if (settings.debugMode) {
        logger('log', 'hideTypingIndicator called');
    }
    const typingIndicator = document.getElementById('typing_indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

const OptionsGenerator = {
    isGenerating: false,

    getContextData(settings) {
        const data = {};
        try {
            if (typeof getContext !== 'function') {
                 if (settings.debugMode) logger('warn', 'getContext is not available.');
                 data.context = '';
            } else {
                data.context = getContext().text;
            }

            if (typeof getCharacters !== 'function' || typeof window.characterId === 'undefined') {
                if (settings.debugMode) logger('warn', 'Character context is not available.');
                data.char_card = '';
            } else {
                const char = getCharacters().find(c => c.id === window.characterId);
                data.char_card = char ? `${char.name}:\n${char.description}` : '';
            }

            if (typeof getLorebooks !== 'function') {
                if (settings.debugMode) logger('warn', 'Lorebook context is not available.');
                data.world_info = '';
            } else {
                 const activeLorebooks = getLorebooks().filter(book => book.enabled);
                 data.world_info = activeLorebooks.map(book => `${book.name}:\n${book.content}`).join('\n\n');
            }
        } catch (error) {
            if (settings.debugMode) logger('error', 'Failed to get context data:', error);
        }
        if (settings.debugMode) logger('log', 'Context data fetched:', data);
        return data;
    },

    async generateOptions() {
        if (this.isGenerating) return;

        const settings = getSettings();
        if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
            if (settings.debugMode) logger('log', 'Options generation skipped: disabled or no API key.');
            return;
        }

        this.isGenerating = true;
        this.showGeneratingUI('正在生成回复选项...');
        if (settings.debugMode) logger('log', 'Starting options generation.');

        try {
            const { context, char_card, world_info } = this.getContextData(settings);
            let prompt = settings.optionsTemplate
                .replace('{{context}}', context)
                .replace('{{char_card}}', char_card)
                .replace('{{world_info}}', world_info);

            if (settings.debugMode) {
                logger('log', 'Generated prompt:', prompt);
            }

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
                    n: settings.optionsCount,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            if (settings.debugMode) logger('log', 'API Response:', data);

            const content = data.choices[0]?.message?.content || '';
            const options = this.parseOptions(content);
            this.displayOptions(options);

        } catch (error) {
            logger('error', 'Options generation failed:', error);
            this.showGeneratingUI(`生成失败: ${error.message}`, 5000);
        } finally {
            this.isGenerating = false;
            if (settings.debugMode) logger('log', 'Options generation finished.');
        }
    },

    parseOptions(content) {
        return content.split('\n')
            .map(line => line.trim())
            .filter(line => /^[-*]\s*|^\d+\.\s*/.test(line))
            .map(line => line.replace(/^[-*]\s*|^\d+\.\s*/, '').trim())
            .filter(option => option);
    },

    createStyledElement(tag, id, styles) {
        const el = document.createElement(tag);
        if (id) el.id = id;
        Object.assign(el.style, styles);
        return el;
    },

    showGeneratingUI(message, duration = null) {
        let container = document.getElementById('options-loading-container');
        if (!container) {
            container = this.createStyledElement('div', 'options-loading-container', {
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

        const container = this.createStyledElement('div', 'options-container', {
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

        const title = this.createStyledElement('div', null, {
            color: 'white',
            fontSize: '14px',
            marginBottom: '5px',
            textAlign: 'center'
        });
        title.textContent = '推荐回复选项:';
        container.appendChild(title);

        const closeBtn = this.createStyledElement('button', null, {
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer'
        });
        closeBtn.textContent = '×';
        closeBtn.onclick = () => container.remove();
        container.appendChild(closeBtn);

        const optionsContainer = this.createStyledElement('div', null, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        });

        options.forEach(option => {
            const btn = this.createStyledElement('button', null, {
                backgroundColor: 'rgba(60, 60, 60, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 15px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.2s'
            });
            btn.textContent = option;
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
    const requiredImports = { name2, eventSource, event_types, isStreamingEnabled, saveSettingsDebounced };
    for (const [name, imported] of Object.entries(requiredImports)) {
        if (typeof imported === 'undefined') {
            logger('error', `Critical import "${name}" is missing. Extension will not run.`);
            return;
        }
    }

    injectGlobalStyles();
    const settings = getSettings();
    addExtensionSettings(settings);

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
        OptionsGenerator.hideGeneratingUI();
        const oldContainer = document.getElementById('options-container');
        if (oldContainer) oldContainer.remove();
    });

    logger('info', 'Extension loaded successfully.');
})();
