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
    // 回复选项生成标题和重置按钮
    const optionsHeader = document.createElement('div');
    optionsHeader.style.display = 'flex';
    optionsHeader.style.alignItems = 'center';
    optionsHeader.style.margin = '0 0 10px 0';
    // 标题
    const optionsTitle = document.createElement('h4');
    optionsTitle.textContent = '回复选项生成';
    optionsTitle.style.margin = '0';
    optionsTitle.style.flex = '1';
    optionsHeader.appendChild(optionsTitle);
    // 重置按钮
    const resetButton = document.createElement('button');
    resetButton.textContent = '重置';
    resetButton.className = 'menu_button';
    resetButton.style.marginLeft = '10px';
    resetButton.style.padding = '4px 10px';
    resetButton.style.fontSize = '0.95em';
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
            sendModeSelect.value = settings.sendMode;
            optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';
            baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
            saveSettingsDebounced();
            console.log('设置已重置为默认值');
            alert('设置已重置为默认值');
        }
    });
    optionsHeader.appendChild(resetButton);
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
    // 发送模式选项
    const sendModeLabel = document.createElement('label');
    sendModeLabel.textContent = '发送模式:';
    sendModeLabel.style.display = 'block';
    sendModeLabel.style.marginTop = '10px';
    const sendModeSelect = document.createElement('select');
    sendModeSelect.style.width = '100%';
    sendModeSelect.innerHTML = `
        <option value="auto">自动发送</option>
        <option value="manual">手动发送</option>
        <option value="stream_auto_send">全自动导演模式</option>
    `;
    sendModeSelect.value = settings.sendMode;
    sendModeSelect.addEventListener('change', () => {
        settings.sendMode = sendModeSelect.value;
        saveSettingsDebounced();
    });
    optionsSettingsContainer.appendChild(sendModeLabel);
    optionsSettingsContainer.appendChild(sendModeSelect);
    optionsContainer.appendChild(optionsSettingsContainer);

    // ========== 用户画像查看与编辑 ========== //
    const profileContainer = document.createElement('div');
    profileContainer.style.marginTop = '20px';
    profileContainer.style.borderTop = '1px solid var(--border_color)';
    profileContainer.style.paddingTop = '15px';
    const profileHeader = document.createElement('h4');
    profileHeader.textContent = '用户画像（可手动编辑）';
    profileHeader.style.margin = '0 0 10px 0';
    profileContainer.appendChild(profileHeader);
    // summary
    const summaryLabel = document.createElement('label');
    summaryLabel.textContent = '画像总结：';
    summaryLabel.style.display = 'block';
    const summaryInput = document.createElement('textarea');
    summaryInput.value = settings.userProfile.summary || '';
    summaryInput.style.width = '100%';
    summaryInput.style.minHeight = '40px';
    summaryInput.addEventListener('input', () => {
        settings.userProfile.summary = summaryInput.value;
        saveSettingsDebounced();
    });
    profileContainer.appendChild(summaryLabel);
    profileContainer.appendChild(summaryInput);
    // favoriteScene
    const sceneLabel = document.createElement('label');
    sceneLabel.textContent = '偏好场景类型：';
    sceneLabel.style.display = 'block';
    const sceneInput = document.createElement('input');
    sceneInput.type = 'text';
    sceneInput.value = settings.userProfile.favoriteScene || '';
    sceneInput.style.width = '100%';
    sceneInput.addEventListener('input', () => {
        settings.userProfile.favoriteScene = sceneInput.value;
        saveSettingsDebounced();
    });
    profileContainer.appendChild(sceneLabel);
    profileContainer.appendChild(sceneInput);
    // favoriteMood
    const moodLabel = document.createElement('label');
    moodLabel.textContent = '偏好情绪：';
    moodLabel.style.display = 'block';
    const moodInput = document.createElement('input');
    moodInput.type = 'text';
    moodInput.value = settings.userProfile.favoriteMood || '';
    moodInput.style.width = '100%';
    moodInput.addEventListener('input', () => {
        settings.userProfile.favoriteMood = moodInput.value;
        saveSettingsDebounced();
    });
    profileContainer.appendChild(moodLabel);
    profileContainer.appendChild(moodInput);
    // preferedFocus
    const focusLabel = document.createElement('label');
    focusLabel.textContent = '偏好叙事焦点：';
    focusLabel.style.display = 'block';
    const focusInput = document.createElement('input');
    focusInput.type = 'text';
    focusInput.value = settings.userProfile.preferedFocus || '';
    focusInput.style.width = '100%';
    focusInput.addEventListener('input', () => {
        settings.userProfile.preferedFocus = focusInput.value;
        saveSettingsDebounced();
    });
    profileContainer.appendChild(focusLabel);
    profileContainer.appendChild(focusInput);
    // customKeywords
    const keywordsLabel = document.createElement('label');
    keywordsLabel.textContent = '关键词（逗号分隔）：';
    keywordsLabel.style.display = 'block';
    const keywordsInput = document.createElement('input');
    keywordsInput.type = 'text';
    keywordsInput.value = (settings.userProfile.customKeywords || []).join(',');
    keywordsInput.style.width = '100%';
    keywordsInput.addEventListener('input', () => {
        settings.userProfile.customKeywords = keywordsInput.value.split(',').map(s => s.trim()).filter(Boolean);
        saveSettingsDebounced();
    });
    profileContainer.appendChild(keywordsLabel);
    profileContainer.appendChild(keywordsInput);
    // 添加到面板
    inlineDrawerContent.appendChild(profileContainer);
}