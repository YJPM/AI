import { defaultSettings, getSettings } from './settings.js';
import { saveSettingsDebounced } from '../../../../script.js';

export function applyBasicStyle() {
    let styleTag = document.getElementById('typing-indicator-theme-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'typing-indicator-theme-style';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = `
        .typing_indicator {
            background-color: transparent;
            padding: 8px 16px;
            margin: 8px auto;
            width: fit-content;
            max-width: 90%;
            text-align: center;
            color: var(--text_color);
        }
    `;
}

export function injectGlobalStyles() {
    const css = `
        #typing_indicator.typing_indicator {
            opacity: 1 !important;
            background-color: transparent !important;
        }
        .typing_indicator {
            background-color: transparent !important;
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
        .typing-indicator-text {
            font-weight: normal;
            background: none;
            -webkit-background-clip: unset;
            background-clip: unset;
            -webkit-text-fill-color: unset;
            display: inline;
            animation: none;
            color: var(--text_color);
        }
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

export function addExtensionSettings(settings) {
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
    baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
    optionsContainer.appendChild(optionsSettingsContainer);

    // 高级设置分组
    const advancedHeader = document.createElement('h4');
    advancedHeader.textContent = '高级导演功能';
    advancedHeader.style.margin = '30px 0 10px 0';
    optionsContainer.appendChild(advancedHeader);
    // 启用动态导演
    const dynamicToggleLabel = document.createElement('label');
    dynamicToggleLabel.classList.add('checkbox_label');
    const dynamicToggle = document.createElement('input');
    dynamicToggle.type = 'checkbox';
    dynamicToggle.checked = settings.enableDynamicDirector;
    dynamicToggle.addEventListener('change', () => {
        settings.enableDynamicDirector = dynamicToggle.checked;
        advancedSettingsContainer.style.display = settings.enableDynamicDirector ? 'block' : 'none';
        saveSettingsDebounced();
    });
    const dynamicToggleText = document.createElement('span');
    dynamicToggleText.textContent = '启用动态导演 (高级)';
    dynamicToggleLabel.append(dynamicToggle, dynamicToggleText);
    optionsContainer.appendChild(dynamicToggleLabel);
    // 高级设置容器
    const advancedSettingsContainer = document.createElement('div');
    advancedSettingsContainer.style.marginTop = '10px';
    advancedSettingsContainer.style.display = settings.enableDynamicDirector ? 'block' : 'none';
    // 分析模型
    const analysisModelLabel = document.createElement('label');
    analysisModelLabel.textContent = '分析模型 (快速&廉价):';
    analysisModelLabel.style.display = 'block';
    const analysisModelInput = document.createElement('input');
    analysisModelInput.type = 'text';
    analysisModelInput.value = settings.analysisModel;
    analysisModelInput.placeholder = '如 gpt-3.5-turbo';
    analysisModelInput.style.width = '100%';
    analysisModelInput.addEventListener('input', () => {
        settings.analysisModel = analysisModelInput.value;
        saveSettingsDebounced();
    });
    advancedSettingsContainer.appendChild(analysisModelLabel);
    advancedSettingsContainer.appendChild(analysisModelInput);
    // 动态导演模板
    const dynamicPromptLabel = document.createElement('label');
    dynamicPromptLabel.textContent = '动态导演模板:';
    dynamicPromptLabel.style.display = 'block';
    const dynamicPromptInput = document.createElement('textarea');
    dynamicPromptInput.value = settings.dynamicPromptTemplate;
    dynamicPromptInput.placeholder = '可编辑高级prompt模板';
    dynamicPromptInput.style.width = '100%';
    dynamicPromptInput.style.minHeight = '80px';
    dynamicPromptInput.addEventListener('input', () => {
        settings.dynamicPromptTemplate = dynamicPromptInput.value;
        saveSettingsDebounced();
    });
    advancedSettingsContainer.appendChild(dynamicPromptLabel);
    advancedSettingsContainer.appendChild(dynamicPromptInput);
    // 发送模式
    const sendModeLabel = document.createElement('label');
    sendModeLabel.textContent = '发送模式:';
    sendModeLabel.style.display = 'block';
    const sendModeSelect = document.createElement('select');
    sendModeSelect.innerHTML = '<option value="auto">自动</option><option value="manual">手动</option><option value="stream_auto_send">全自动导演</option>';
    sendModeSelect.value = settings.sendMode;
    sendModeSelect.style.width = '100%';
    sendModeSelect.addEventListener('change', () => {
        settings.sendMode = sendModeSelect.value;
        saveSettingsDebounced();
    });
    advancedSettingsContainer.appendChild(sendModeLabel);
    advancedSettingsContainer.appendChild(sendModeSelect);
    // 长期记忆展示与清空
    const memoryBox = document.createElement('div');
    memoryBox.style.margin = '15px 0';
    memoryBox.style.background = 'rgba(0,0,0,0.05)';
    memoryBox.style.padding = '10px';
    memoryBox.style.borderRadius = '8px';
    const learnedStyleText = document.createElement('div');
    learnedStyleText.innerHTML = `<b>当前习得风格:</b> ${settings.learnedStyle || '无'}`;
    const logProgressText = document.createElement('div');
    logProgressText.innerHTML = `<b>学习进度:</b> ${settings.choiceLog.length}/${settings.logTriggerCount}`;
    const clearMemoryBtn = document.createElement('button');
    clearMemoryBtn.textContent = '清空记忆';
    clearMemoryBtn.style.marginTop = '8px';
    clearMemoryBtn.onclick = () => {
        if (confirm('确定要清空所有已学习的创作风格和日志吗？')) {
            settings.learnedStyle = '';
            settings.choiceLog = [];
            saveSettingsDebounced();
            learnedStyleText.innerHTML = `<b>当前习得风格:</b> 无`;
            logProgressText.innerHTML = `<b>学习进度:</b> 0/${settings.logTriggerCount}`;
        }
    };
    memoryBox.appendChild(learnedStyleText);
    memoryBox.appendChild(logProgressText);
    memoryBox.appendChild(clearMemoryBtn);
    advancedSettingsContainer.appendChild(memoryBox);
    optionsContainer.appendChild(advancedSettingsContainer);

    // 添加重置按钮
    const resetContainer = document.createElement('div');
    resetContainer.style.marginTop = '20px';
    resetContainer.style.borderTop = '1px solid var(--border_color)';
    resetContainer.style.paddingTop = '15px';
    const resetHeader = document.createElement('h4');
    resetHeader.textContent = '重置设置';
    resetHeader.style.margin = '0 0 10px 0';
    resetContainer.appendChild(resetHeader);
    const resetButton = document.createElement('button');
    resetButton.textContent = '重置所有设置为默认值';
    resetButton.className = 'menu_button';
    resetButton.style.width = '100%';
    resetButton.style.padding = '8px 12px';
    resetButton.style.backgroundColor = 'var(--SmartThemeBlurple)';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.cursor = 'pointer';
    resetButton.addEventListener('click', () => {
        if (confirm('确定要将所有设置重置为默认值吗？此操作不可撤销。')) {
            Object.assign(settings, structuredClone(defaultSettings));
            optionsEnabledCheckbox.checked = settings.optionsGenEnabled;
            debugCheckbox.checked = settings.debug;
            apiTypeSelect.value = settings.optionsApiType;
            apiKeyInput.value = settings.optionsApiKey;
            modelInput.value = settings.optionsApiModel;
            baseUrlInput.value = settings.optionsBaseUrl;
            optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';
            baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
            saveSettingsDebounced();
            console.log('设置已重置为默认值');
            alert('设置已重置为默认值');
        }
    });
    resetContainer.appendChild(resetButton);
    inlineDrawerContent.append(optionsContainer, resetContainer);
}