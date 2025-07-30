import {
    name2,
    eventSource,
    event_types,
    isStreamingEnabled,
    saveSettingsDebounced,
} from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { selected_group } from '../../../group-chats.js';

// Unified Module Logic
(function () {
    const MODULE = 'ai_director'; // Changed module name
    
    // --- Default Settings ---
const defaultSettings = {
        // Typing Indicator settings
        ti_enabled: false,
        ti_streaming: false,
        ti_showCharName: false,
        ti_animationEnabled: true,
        ti_fontColor: '',
        ti_customText: '正在输入',
        ti_activeTheme: '默认',
        ti_themes: {
            '默认': { css: '/* 默认主题：不应用额外样式。 */' },
            '渐变脉冲': { css: `
#typing_indicator .typing-ellipsis { display: none; }
#typing_indicator div.typing-indicator-text {
    font-weight: bold;
    background: linear-gradient(90deg, #ff00de, #00f2ff, #ff00de);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-pulse 3s ease-in-out infinite;
}
@keyframes gradient-pulse {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
            ` },
        },
        
        // AI Director settings
        ad_enabled: true, // Enabled by default now as it's the main feature
        ad_apiType: 'openai',
        ad_apiKey: '',
        ad_baseUrl: 'https://api.openai.com/v1',
        ad_model: 'gpt-4o-mini',
        ad_sendMode: 'auto',
        ad_enableDynamicDirector: false,
        ad_analysisModel: 'gpt-3.5-turbo',
        ad_choiceLog: [],
        ad_learnedStyle: '',
        ad_logTriggerCount: 20,
        ad_promptContent: `
# 角色
你是一位拥有顶级创作能力的AI叙事导演。
# 核心目标
基于完整的聊天上下文，通过一个严谨的内部思考过程，为"我"（用户角色）生成3-5个接下来可能发生的、最具戏剧性的行动或事件选项。
# ... (rest of the simple prompt)
`.trim(),
        ad_dynamicPromptTemplate: `
# 角色
你是一位拥有顶级创作能力的AI叙事导演，你必须根据我提供的实时情境分析来调整你的导演风格。
# ... (rest of the dynamic prompt)
`.trim(),
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

function applyTheme(themeName) {
    const settings = getSettings();
        const theme = settings.ti_themes[themeName];
    if (!theme) {
        console.warn(`正在输入中…：未找到主题 "${themeName}"。`);
        return;
    }
    let styleTag = document.getElementById('typing-indicator-theme-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'typing-indicator-theme-style';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = theme.css;
}

function injectGlobalStyles() {
    const css = `
        #typing_indicator.typing_indicator {
            opacity: 1 !important;
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
        .ti_color_picker_wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 10px;
            background-color: var(--background_panel);
            border-radius: 8px;
        }
        .ti_color_picker_wrapper > span {
            font-weight: bold;
        }
        .ti_color_input_container {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .ti_color_input_container input[type="color"] {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            width: 28px;
            height: 28px;
            padding: 0;
            border: 1px solid var(--border_color);
            border-radius: 6px;
            background-color: transparent;
            cursor: pointer;
        }
        .ti_color_input_container input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 0;
        }
        .ti_color_input_container input[type="color"]::-webkit-color-swatch {
            border: none;
            border-radius: 4px;
        }
        .ti_color_input_container input[type="color"]::-moz-color-swatch {
            border: none;
            border-radius: 4px;
        }
        .ti_reset_color_btn {
            background: none;
            border: none;
            color: var(--text_color_secondary);
            cursor: pointer;
            font-size: 1em;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .ti_reset_color_btn:hover {
            color: var(--text_color_attention);
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

    // --- Main Settings UI Function ---
function addExtensionSettings(settings) {
    const settingsContainer = document.getElementById('typing_indicator_container') ?? document.getElementById('extensions_settings');
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

    const refreshIndicator = () => {
        const indicator = document.getElementById('typing_indicator');
        if (indicator) {
            showTypingIndicator('refresh', null, false);
        }
    };

        // --- Tab Container ---
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'ai-director-tabs';
        
        const directorTab = document.createElement('button');
        directorTab.className = 'ai-director-tab-button active';
        directorTab.textContent = 'AI导演';
        
        const indicatorTab = document.createElement('button');
        indicatorTab.className = 'ai-director-tab-button';
        indicatorTab.textContent = '打字指示器';

        tabsContainer.append(directorTab, indicatorTab);
        inlineDrawerContent.append(tabsContainer);

        // --- Content Panes ---
        const directorContent = document.createElement('div');
        directorContent.className = 'ai-director-tab-content active';
        
        const indicatorContent = document.createElement('div');
        indicatorContent.className = 'ai-director-tab-content';
        
        inlineDrawerContent.append(directorContent, indicatorContent);

        // --- Tab Switching Logic ---
        directorTab.addEventListener('click', () => {
            directorTab.classList.add('active');
            indicatorTab.classList.remove('active');
            directorContent.classList.add('active');
            indicatorContent.classList.remove('active');
        });
        indicatorTab.addEventListener('click', () => {
            directorTab.classList.remove('active');
            indicatorTab.classList.add('active');
            directorContent.classList.remove('active');
            indicatorContent.classList.add('active');
        });

        // --- Populate AI Director Tab ---
        function createSetting(container, { id, label, type = 'text', options = [], value, placeholder = '', hint = '' }) {
            const group = document.createElement('div');
            group.className = 'form-group';

            const labelEl = document.createElement('label');
            labelEl.htmlFor = `ad_setting_${id}`;
            labelEl.textContent = label;
            group.append(labelEl);

            let inputEl;
            if (type === 'select') {
                inputEl = document.createElement('select');
                options.forEach(([val, text]) => {
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = text;
                    inputEl.append(opt);
                });
            } else if (type === 'textarea') {
                inputEl = document.createElement('textarea');
                inputEl.rows = 5;
            } else if (type === 'checkbox') {
                // Special handling for checkbox as it's a label wrapping an input
                const checkLabel = document.createElement('label');
                checkLabel.className = 'checkbox_label';
                inputEl = document.createElement('input');
                inputEl.type = 'checkbox';
                checkLabel.append(inputEl, ` ${label}`); // Use label text for checkbox span
                group.innerHTML = ''; // Clear the group
                group.append(checkLabel);
            }
            else {
                inputEl = document.createElement('input');
                inputEl.type = type;
            }
            
            if (type !== 'checkbox') {
                inputEl.id = `ad_setting_${id}`;
                inputEl.placeholder = placeholder;
                if (type === 'password') {
                    inputEl.autocomplete = 'new-password';
                }
                group.append(inputEl);
            }

            if (hint) {
                const hintEl = document.createElement('small');
                hintEl.textContent = hint;
                hintEl.style.display = 'block';
                hintEl.style.marginTop = '4px';
                group.append(hintEl);
            }
            
            container.append(group);

            // Set initial value and event listener
            if (type === 'checkbox') {
                inputEl.checked = settings[id];
                inputEl.addEventListener('change', () => {
                    settings[id] = inputEl.checked;
                    saveSettingsDebounced();
                    // Special handling for toggling advanced section
                    if (id === 'ad_enableDynamicDirector') {
                        document.getElementById('ad_advanced_settings').style.display = inputEl.checked ? 'block' : 'none';
                    }
                });
            } else {
                inputEl.value = settings[id];
                inputEl.addEventListener('input', () => {
                    settings[id] = inputEl.value;
                    saveSettingsDebounced();
                });
            }
            return inputEl;
        }

        createSetting(directorContent, { id: 'ad_apiType', label: 'API 类型:', type: 'select', options: [['openai', 'OpenAI 兼容'], ['gemini', 'Google Gemini']], value: settings.ad_apiType });
        createSetting(directorContent, { id: 'ad_model', label: '导演 (主) 模型:', value: settings.ad_model });
        createSetting(directorContent, { id: 'ad_apiKey', label: 'API Key:', type: 'password', value: settings.ad_apiKey });
        createSetting(directorContent, { id: 'ad_baseUrl', label: 'Base URL:', value: settings.ad_baseUrl });
        createSetting(directorContent, { id: 'ad_sendMode', label: '发送模式:', type: 'select', options: [['auto', '自动发送'], ['manual', '手动发送'], ['stream_auto_send', '全自动导演模式']], value: settings.ad_sendMode });

        const hr = document.createElement('hr');
        directorContent.append(hr);
        
        createSetting(directorContent, { id: 'ad_enableDynamicDirector', label: '启用动态导演 (高级)', type: 'checkbox', value: settings.ad_enableDynamicDirector });

        const advancedContainer = document.createElement('div');
        advancedContainer.id = 'ad_advanced_settings';
        advancedContainer.style.display = settings.ad_enableDynamicDirector ? 'block' : 'none';
        advancedContainer.style.paddingLeft = '15px';
        directorContent.append(advancedContainer);

        createSetting(advancedContainer, { id: 'ad_analysisModel', label: '分析模型 (快速 & 廉价):', value: settings.ad_analysisModel });
        createSetting(advancedContainer, { id: 'ad_dynamicPromptTemplate', label: '动态指令模板:', type: 'textarea', value: settings.ad_dynamicPromptTemplate });
        
        // --- Memory Section ---
        const memoryHr = document.createElement('hr');
        advancedContainer.append(memoryHr);

        const memoryLabel = document.createElement('label');
        memoryLabel.textContent = '长期记忆 (自我进化):';
        advancedContainer.append(memoryLabel);
        
        const memoryInfoBox = document.createElement('div');
        memoryInfoBox.style.fontSize = '0.85em';
        memoryInfoBox.style.background = 'rgba(0,0,0,0.2)';
        memoryInfoBox.style.padding = '10px';
        memoryInfoBox.style.borderRadius = '8px';
        
        const learnedStyleEl = document.createElement('p');
        learnedStyleEl.innerHTML = `当前习得风格: <b id="ad_learned_style">${settings.ad_learnedStyle || '无'}</b>`;
        
        const logProgressEl = document.createElement('p');
        logProgressEl.innerHTML = `学习进度: <span id="ad_log_progress">${settings.ad_choiceLog.length}/${settings.ad_logTriggerCount}</span>`;
        
        const clearMemoryLink = document.createElement('a');
        clearMemoryLink.href = '#';
        clearMemoryLink.textContent = '清空记忆';
        clearMemoryLink.style.color = '#f08080';
        clearMemoryLink.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('确定要清空所有已学习的创作风格和日志吗？')) {
                settings.ad_learnedStyle = '';
                settings.ad_choiceLog = [];
                await saveSettingsDebounced();
                document.getElementById('ad_learned_style').textContent = '无';
                document.getElementById('ad_log_progress').textContent = `0/${settings.ad_logTriggerCount}`;
            }
        });
        
        memoryInfoBox.append(learnedStyleEl, logProgressEl, clearMemoryLink);
        advancedContainer.append(memoryInfoBox);

        // --- Update Check Button ---
        const updateContainer = document.createElement('div');
        updateContainer.style.marginTop = '20px';
        updateContainer.style.textAlign = 'center';
        
        const updateButton = document.createElement('button');
        updateButton.textContent = '检查更新';
        updateButton.classList.add('primary-button');
        updateButton.addEventListener('click', checkForUpdates);
        
        updateContainer.append(updateButton);
        inlineDrawerContent.append(updateContainer); // Append to main content, not just one tab

        // --- Populate Typing Indicator Tab ---
        // (This is where all the UI for the typing indicator will be created and appended to indicatorContent)
    const enabledCheckboxLabel = document.createElement('label');
    enabledCheckboxLabel.classList.add('checkbox_label');
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
        enabledCheckbox.checked = settings.ti_enabled;
    enabledCheckbox.addEventListener('change', () => {
            settings.ti_enabled = enabledCheckbox.checked;
        saveSettingsDebounced();
    });
    const enabledCheckboxText = document.createElement('span');
        enabledCheckboxText.textContent = '启用';
    enabledCheckboxLabel.append(enabledCheckbox, enabledCheckboxText);
        indicatorContent.append(enabledCheckboxLabel);

    const showIfStreamingCheckboxLabel = document.createElement('label');
    showIfStreamingCheckboxLabel.classList.add('checkbox_label');
    const showIfStreamingCheckbox = document.createElement('input');
    showIfStreamingCheckbox.type = 'checkbox';
        showIfStreamingCheckbox.checked = settings.ti_streaming;
    showIfStreamingCheckbox.addEventListener('change', () => {
            settings.ti_streaming = showIfStreamingCheckbox.checked;
        saveSettingsDebounced();
    });
    const showIfStreamingCheckboxText = document.createElement('span');
        showIfStreamingCheckboxText.textContent = '流式传输时显示';
    showIfStreamingCheckboxLabel.append(showIfStreamingCheckbox, showIfStreamingCheckboxText);
        indicatorContent.append(showIfStreamingCheckboxLabel);

    const animationEnabledCheckboxLabel = document.createElement('label');
    animationEnabledCheckboxLabel.classList.add('checkbox_label');
    const animationEnabledCheckbox = document.createElement('input');
    animationEnabledCheckbox.type = 'checkbox';
        animationEnabledCheckbox.checked = settings.ti_animationEnabled;
    animationEnabledCheckbox.addEventListener('change', () => {
            settings.ti_animationEnabled = animationEnabledCheckbox.checked;
        saveSettingsDebounced();
        refreshIndicator();
    });
    const animationEnabledCheckboxText = document.createElement('span');
        animationEnabledCheckboxText.textContent = '启用动画';
    animationEnabledCheckboxLabel.append(animationEnabledCheckbox, animationEnabledCheckboxText);
        indicatorContent.append(animationEnabledCheckboxLabel);

    const colorPickerWrapper = document.createElement('div');
    colorPickerWrapper.className = 'ti_color_picker_wrapper';
    const colorPickerTextLabel = document.createElement('span');
        colorPickerTextLabel.textContent = '字体颜色';
    const colorInputContainer = document.createElement('div');
    colorInputContainer.className = 'ti_color_input_container';
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
        colorPicker.value = settings.ti_fontColor || '#ffffff';
    colorPicker.addEventListener('change', () => {
            settings.ti_fontColor = colorPicker.value;
        saveSettingsDebounced();
        refreshIndicator();
    });
    const resetButton = document.createElement('button');
    resetButton.className = 'ti_reset_color_btn';
        resetButton.title = '重置';
    resetButton.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i>';
    resetButton.addEventListener('click', () => {
            settings.ti_fontColor = '';
        colorPicker.value = '#ffffff';
        saveSettingsDebounced();
        refreshIndicator();
    });
    colorInputContainer.append(colorPicker, resetButton);
    colorPickerWrapper.append(colorPickerTextLabel, colorInputContainer);
        indicatorContent.append(colorPickerWrapper);

    const customContentContainer = document.createElement('div');
    customContentContainer.style.marginTop = '10px';

    const showNameCheckboxLabel = document.createElement('label');
    showNameCheckboxLabel.classList.add('checkbox_label');
    const showNameCheckbox = document.createElement('input');
    showNameCheckbox.type = 'checkbox';
        showNameCheckbox.checked = settings.ti_showCharName;
    showNameCheckbox.addEventListener('change', () => {
            settings.ti_showCharName = showNameCheckbox.checked;
        saveSettingsDebounced();
        refreshIndicator();
    });
    const showNameCheckboxText = document.createElement('span');
        showNameCheckboxText.textContent = '显示角色名称';
    showNameCheckboxLabel.append(showNameCheckbox, showNameCheckboxText);
    customContentContainer.append(showNameCheckboxLabel);

    const customTextLabel = document.createElement('label');
        customTextLabel.textContent = '自定义内容：';
    customTextLabel.style.display = 'block';
    const customTextInput = document.createElement('input');
    customTextInput.type = 'text';
        customTextInput.value = settings.ti_customText;
        customTextInput.placeholder = '输入显示的文字';
    customTextInput.style.width = '80%';
    customTextInput.addEventListener('input', () => {
            settings.ti_customText = customTextInput.value;
        saveSettingsDebounced();
        refreshIndicator();
    });

    const placeholderHint = document.createElement('small');
        placeholderHint.textContent = '使用 {char} 作为角色名称的占位符。';
    placeholderHint.style.display = 'block';
    placeholderHint.style.marginTop = '4px';
    placeholderHint.style.color = 'var(--text_color_secondary)';

    customContentContainer.append(customTextLabel, customTextInput, placeholderHint);
        indicatorContent.append(customContentContainer);

    const divider = document.createElement('hr');
        indicatorContent.append(divider);

    const themeSelectorLabel = document.createElement('label');
        themeSelectorLabel.textContent = '外观主题：';
    const themeSelector = document.createElement('select');
    const populateThemes = () => {
        themeSelector.innerHTML = '';
            Object.keys(settings.ti_themes).forEach(themeName => {
            const option = document.createElement('option');
            option.value = themeName;
            option.textContent = themeName;
            themeSelector.appendChild(option);
        });
            themeSelector.value = settings.ti_activeTheme;
    };
    populateThemes();
        themeSelector.addEventListener('change', () => {
            const selectedTheme = themeSelector.value;
            settings.ti_activeTheme = selectedTheme;
            applyTheme(selectedTheme);
            saveSettingsDebounced();
        });
        indicatorContent.append(themeSelectorLabel, themeSelector);

    const cssEditorLabel = document.createElement('label');
        cssEditorLabel.textContent = '主题 CSS (高级)：';
    cssEditorLabel.style.display = 'block';
    cssEditorLabel.style.marginTop = '10px';
    const cssEditor = document.createElement('textarea');
    cssEditor.rows = 8;
        cssEditor.placeholder = '在此处输入 CSS 代码。';
    cssEditor.style.width = '100%';
        indicatorContent.append(cssEditorLabel, cssEditor);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '5px';
    const saveButton = document.createElement('button');
        saveButton.textContent = '保存当前主题';
    saveButton.classList.add('primary-button');
    const newButton = document.createElement('button');
        newButton.textContent = '新建主题';
    newButton.classList.add('primary-button');
    const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除主题';
    deleteButton.classList.add('danger-button'); 
    buttonContainer.append(saveButton, newButton, deleteButton);
        indicatorContent.append(buttonContainer);

    const loadThemeIntoEditor = (themeName) => {
            cssEditor.value = settings.ti_themes[themeName]?.css || '';
    };
    themeSelector.addEventListener('change', () => {
        const selectedTheme = themeSelector.value;
            settings.ti_activeTheme = selectedTheme;
        applyTheme(selectedTheme);
        loadThemeIntoEditor(selectedTheme);
        saveSettingsDebounced();
    });
    saveButton.addEventListener('click', () => {
        const currentThemeName = themeSelector.value;
            settings.ti_themes[currentThemeName].css = cssEditor.value;
        applyTheme(currentThemeName);
        saveSettingsDebounced();
            alert(`主题 '${currentThemeName}' 已保存！`);
    });
    newButton.addEventListener('click', () => {
            const newThemeName = prompt('请输入新主题的名称：');
            if (newThemeName && !settings.ti_themes[newThemeName]) {
                settings.ti_themes[newThemeName] = { css: `/* ${newThemeName} 的 CSS */` };
                settings.ti_activeTheme = newThemeName;
            populateThemes();
            loadThemeIntoEditor(newThemeName);
            saveSettingsDebounced();
            } else if (settings.ti_themes[newThemeName]) {
                alert('该名称的主题已存在！');
        }
    });
    deleteButton.addEventListener('click', () => {
        const themeToDelete = themeSelector.value;
        if (themeToDelete === '默认') {
                alert('无法删除默认主题。');
            return;
        }
            if (confirm(`您确定要删除主题 '${themeToDelete}' 吗？`)) {
                delete settings.ti_themes[themeToDelete];
                settings.ti_activeTheme = '默认';
            populateThemes();
                applyTheme(settings.ti_activeTheme);
                loadThemeIntoEditor(settings.ti_activeTheme);
            saveSettingsDebounced();
        }
    });
        loadThemeIntoEditor(settings.ti_activeTheme);

    }

    // --- Update Check Function ---
    async function checkForUpdates() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/YJPM/AI/main/manifest.json');
            if (!response.ok) {
                throw new Error(`无法获取更新信息: ${response.statusText}`);
            }
            const remoteManifest = await response.json();
            const localVersion = "2.0.0"; // Should match version in manifest.json
            const remoteVersion = remoteManifest.version;

            if (remoteVersion > localVersion) {
                alert(`发现新版本！\n\n当前版本: ${localVersion}\n最新版本: ${remoteVersion}\n\n请前往项目主页手动更新。`);
            } else {
                alert(`恭喜，您的插件已是最新版本！ (v${localVersion})`);
            }
        } catch (error) {
            console.error('[AI导演] 检查更新失败:', error);
            alert('检查更新失败，请检查网络连接或稍后再试。');
        }
    }

function showTypingIndicator(type, _args, dryRun) {
    const settings = getSettings();
    const noIndicatorTypes = ['quiet', 'impersonate'];

    if (type !== 'refresh' && (noIndicatorTypes.includes(type) || dryRun)) {
        return;
    }

        if (!settings.ti_enabled || (!settings.ti_streaming && isStreamingEnabled())) {
        return;
    }
    
        if (settings.ti_showCharName && !name2 && type !== 'refresh') {
        return;
    }

    if (legacyIndicatorTemplate && selected_group && !isStreamingEnabled()) {
        return;
    }

    const placeholder = '{char}';
        let finalText = settings.ti_customText || defaultSettings.ti_customText;

        if (settings.ti_showCharName && name2) {
        if (finalText.includes(placeholder)) {
            finalText = finalText.replace(placeholder, name2);
        } else {
            finalText = `${name2}${finalText}`;
        }
    } else {
        finalText = finalText.replace(placeholder, '').replace(/  +/g, ' ').trim();
    }

        const animationHtml = settings.ti_animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
        const colorStyle = settings.ti_fontColor ? `color: ${settings.ti_fontColor};` : '';
    const htmlContent = `
    <div style="display: flex; justify-content: center; align-items: center; width: 100%; ${colorStyle}">
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
        const wasChatScrolledDown = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 5;
        
        chat.appendChild(typingIndicator);

        if (wasChatScrolledDown) {
            chat.scrollTop = chat.scrollHeight;
        }
    }
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing_indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

(function () {
    injectGlobalStyles();
    
    const settings = getSettings();
    addExtensionSettings(settings);

        applyTheme(settings.ti_activeTheme);

    const showIndicatorEvents = [ event_types.GENERATION_AFTER_COMMANDS ];
    const hideIndicatorEvents = [ event_types.GENERATION_STOPPED, event_types.GENERATION_ENDED, event_types.CHAT_CHANGED ];

    showIndicatorEvents.forEach(e => eventSource.on(e, showTypingIndicator));
    hideIndicatorEvents.forEach(e => eventSource.on(e, hideTypingIndicator));
    })();
})();

// ===============================================
// AI Director Feature - Refactored for integration
// ===============================================
(function () {
    'use-strict';

    const AIDirector = {
        // --- Constants ---
        LOG_PREFIX: '[AI导演]',
        SETTINGS_KEY: 'AIDirector_Settings',

        // --- State ---
        state: 'IDLE',
        lastMessageId: -1,
        parent$: null,
        readyStateTimeout: null,

        // --- Default Settings ---
        settings: {
            isEnabled: true,
            apiType: 'openai',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o-mini',
            sendMode: 'auto',
            enableDynamicDirector: false,
            analysisModel: 'gpt-3.5-turbo',
            choiceLog: [],
            learnedStyle: '',
            logTriggerCount: 20,
            promptContent: `
# 角色
你是一位拥有顶级创作能力的AI叙事导演。
# 核心目标
基于完整的聊天上下文，通过一个严谨的内部思考过程，为"我"（用户角色）生成3-5个接下来可能发生的、最具戏剧性的行动或事件选项。
# ... (rest of the simple prompt)
`.trim(),
            dynamicPromptTemplate: `
# 角色
你是一位拥有顶级创作能力的AI叙事导演，你必须根据我提供的实时情境分析来调整你的导演风格。
# ... (rest of the dynamic prompt)
`.trim(),
        },

        isRunning: false,
        mainLoopInterval: null,

        start() {
            if (this.isRunning) return;
            const settings = getSettings(); // Get combined settings
            if (!settings.ad_enabled) return;
            
            console.log(this.LOG_PREFIX, '启动中...');
            this.parent$ = window.parent.jQuery; // Assuming global access
            this.lastMessageId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
            
            this.mainLoopInterval = setInterval(this.mainLoop.bind(this), 500);
            this.isRunning = true;
        },

        stop() {
            if (!this.isRunning) return;
            console.log(this.LOG_PREFIX, '停止中...');
            clearInterval(this.mainLoopInterval);
            this.mainLoopInterval = null;
            this.isRunning = false;
            // Also clean up any visible UI elements
            this.cleanupSuggestions();
            this.setState('IDLE');
        },

        // --- Core Logic ---
        mainLoop() {
            if (!this.settings.isEnabled || typeof getLastMessageId !== 'function' || typeof getChatMessages !== 'function') return;
            // ... (rest of mainLoop logic)
        },
        
        setState(newState, payload = null) {
            // ... (rest of setState logic)
        },

        async runSuggestionLogic() {
            // ... (rest of runSuggestionLogic logic)
        },

        // --- API Calls ---
        async callOpenAIAPI(messages, stream, overrideModel = null, overrideTemp = 0.8) {
            // ... (rest of callOpenAIAPI logic)
        },

        async callGeminiAPI(messages) {
            // ... (rest of callGeminiAPI logic)
        },
        
        transformMessagesForGemini(messages) {
            // ... (rest of transformMessagesForGemini logic)
        },

        async callDirectorAPI(prompt, stream) {
            // ... (rest of callDirectorAPI logic)
        },

        // --- Context & Prompts ---
        async analyzeContext() {
            // ... (rest of analyzeContext logic)
        },
        
        assembleDynamicPrompt(analysisResult) {
            // ... (rest of assembleDynamicPrompt logic)
        },
        
        async getContext_Compatible(message_count_limit = 20) {
            // ... (rest of getContext_Compatible logic)
        },

        // --- UI & Interaction ---
        injectUI() {
            // ... (rest of injectUI logic, all HTML/CSS in strings)
        },

        bindEvents() {
            // ... (rest of bindEvents logic)
        },
        
        updatePanel() {
            // ... (rest of updatePanel logic)
        },
        
        // ... (all other helper and UI methods from the split files)
    };

    // --- Initial Startup ---
    function initialAIDirectorCheck() {
        // ... wait for SillyTavern to be ready ...
        const settings = getSettings();
        if (settings.ad_enabled) {
            AIDirector.start();
        }
    }

    initialAIDirectorCheck();

})();