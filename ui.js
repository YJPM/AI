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
    // ===== 美化样式增强 =====
    applyBasicStyle();
    injectGlobalStyles();
    // ===== 标题与重置按钮 =====
    const optionsHeaderRow = document.createElement('div');
    optionsHeaderRow.style.display = 'flex';
    optionsHeaderRow.style.alignItems = 'center';
    optionsHeaderRow.style.justifyContent = 'space-between';
    optionsHeaderRow.style.marginBottom = '12px';
    const optionsHeader = document.createElement('h4');
    optionsHeader.textContent = '回复选项生成';
    optionsHeader.style.margin = '0';
    optionsHeader.style.fontWeight = 'bold';
    optionsHeader.style.fontSize = '1.15em';
    optionsHeader.style.letterSpacing = '1px';
    const resetButton = document.createElement('button');
    resetButton.textContent = '重置';
    resetButton.className = 'menu_button';
    resetButton.style.padding = '2px 14px';
    resetButton.style.fontSize = '0.95em';
    resetButton.style.marginLeft = '10px';
    resetButton.style.background = 'linear-gradient(90deg, #4a9eff 60%, #6ec6ff 100%)';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '16px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.transition = 'background 0.2s, box-shadow 0.2s';
    resetButton.onmouseover = () => { resetButton.style.boxShadow = '0 2px 8px #4a9eff44'; };
    resetButton.onmouseout = () => { resetButton.style.boxShadow = 'none'; };
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
    optionsHeaderRow.appendChild(optionsHeader);
    optionsHeaderRow.appendChild(resetButton);
    optionsContainer.appendChild(optionsHeaderRow);
    // ===== 分组卡片 =====
    const groupCard = document.createElement('div');
    groupCard.style.background = 'rgba(255,255,255,0.04)';
    groupCard.style.border = '1px solid var(--border_color,#e0e0e0)';
    groupCard.style.borderRadius = '12px';
    groupCard.style.padding = '18px 16px 10px 16px';
    groupCard.style.marginBottom = '18px';
    groupCard.style.boxShadow = '0 2px 8px #0001';
    // ===== 发送模式 =====
    const sendModeRow = document.createElement('div');
    sendModeRow.style.display = 'flex';
    sendModeRow.style.alignItems = 'center';
    sendModeRow.style.marginBottom = '12px';
    const sendModeLabel = document.createElement('label');
    sendModeLabel.textContent = '发送模式:';
    sendModeLabel.style.width = '90px';
    sendModeLabel.style.fontWeight = '500';
    sendModeLabel.style.marginRight = '10px';
    const sendModeSelect = document.createElement('select');
    sendModeSelect.style.flex = '1';
    sendModeSelect.style.padding = '6px 10px';
    sendModeSelect.style.borderRadius = '8px';
    sendModeSelect.style.border = '1px solid #b0c4de';
    sendModeSelect.style.background = '#f8fbff';
    sendModeSelect.style.transition = 'box-shadow 0.2s';
    sendModeSelect.onfocus = () => { sendModeSelect.style.boxShadow = '0 0 0 2px #4a9eff55'; };
    sendModeSelect.onblur = () => { sendModeSelect.style.boxShadow = 'none'; };
    [
        { value: 'auto', text: '自动发送' },
        { value: 'manual', text: '手动发送' },
        { value: 'stream_auto_send', text: '全自动导演模式' }
    ].forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        sendModeSelect.appendChild(option);
    });
    sendModeSelect.value = settings.sendMode;
    sendModeSelect.addEventListener('change', () => {
        settings.sendMode = sendModeSelect.value;
        saveSettingsDebounced();
    });
    sendModeRow.appendChild(sendModeLabel);
    sendModeRow.appendChild(sendModeSelect);
    groupCard.appendChild(sendModeRow);
    // ===== API类型 =====
    const apiTypeRow = document.createElement('div');
    apiTypeRow.style.display = 'flex';
    apiTypeRow.style.alignItems = 'center';
    apiTypeRow.style.marginBottom = '12px';
    const apiTypeLabel = document.createElement('label');
    apiTypeLabel.textContent = 'API 类型:';
    apiTypeLabel.style.width = '90px';
    apiTypeLabel.style.fontWeight = '500';
    apiTypeLabel.style.marginRight = '10px';
    const apiTypeSelect = document.createElement('select');
    apiTypeSelect.style.flex = '1';
    apiTypeSelect.style.padding = '6px 10px';
    apiTypeSelect.style.borderRadius = '8px';
    apiTypeSelect.style.border = '1px solid #b0c4de';
    apiTypeSelect.style.background = '#f8fbff';
    apiTypeSelect.style.transition = 'box-shadow 0.2s';
    apiTypeSelect.onfocus = () => { apiTypeSelect.style.boxShadow = '0 0 0 2px #4a9eff55'; };
    apiTypeSelect.onblur = () => { apiTypeSelect.style.boxShadow = 'none'; };
    apiTypeSelect.innerHTML = `
        <option value="openai">OpenAI-兼容</option>
        <option value="gemini">Google Gemini</option>
    `;
    apiTypeSelect.value = settings.optionsApiType;
    apiTypeSelect.addEventListener('change', () => {
        settings.optionsApiType = apiTypeSelect.value;
        baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
        saveSettingsDebounced();
    });
    apiTypeRow.appendChild(apiTypeLabel);
    apiTypeRow.appendChild(apiTypeSelect);
    groupCard.appendChild(apiTypeRow);
    // ===== 模型 =====
    const modelRow = document.createElement('div');
    modelRow.style.display = 'flex';
    modelRow.style.alignItems = 'center';
    modelRow.style.marginBottom = '12px';
    const modelLabel = document.createElement('label');
    modelLabel.textContent = '模型:';
    modelLabel.style.width = '90px';
    modelLabel.style.fontWeight = '500';
    modelLabel.style.marginRight = '10px';
    const modelInput = document.createElement('input');
    modelInput.type = 'text';
    modelInput.value = settings.optionsApiModel;
    modelInput.style.flex = '1';
    modelInput.style.padding = '6px 10px';
    modelInput.style.borderRadius = '8px';
    modelInput.style.border = '1px solid #b0c4de';
    modelInput.style.background = '#f8fbff';
    modelInput.style.transition = 'box-shadow 0.2s';
    modelInput.onfocus = () => { modelInput.style.boxShadow = '0 0 0 2px #4a9eff55'; };
    modelInput.onblur = () => { modelInput.style.boxShadow = 'none'; };
    modelInput.addEventListener('input', () => {
        settings.optionsApiModel = modelInput.value;
        saveSettingsDebounced();
    });
    modelRow.appendChild(modelLabel);
    modelRow.appendChild(modelInput);
    groupCard.appendChild(modelRow);
    // ===== API Key =====
    const apiKeyRow = document.createElement('div');
    apiKeyRow.style.display = 'flex';
    apiKeyRow.style.alignItems = 'center';
    apiKeyRow.style.marginBottom = '12px';
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'API密钥:';
    apiKeyLabel.style.width = '90px';
    apiKeyLabel.style.fontWeight = '500';
    apiKeyLabel.style.marginRight = '10px';
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.value = settings.optionsApiKey;
    apiKeyInput.style.flex = '1';
    apiKeyInput.style.padding = '6px 10px';
    apiKeyInput.style.borderRadius = '8px';
    apiKeyInput.style.border = '1px solid #b0c4de';
    apiKeyInput.style.background = '#f8fbff';
    apiKeyInput.style.transition = 'box-shadow 0.2s';
    apiKeyInput.onfocus = () => { apiKeyInput.style.boxShadow = '0 0 0 2px #4a9eff55'; };
    apiKeyInput.onblur = () => { apiKeyInput.style.boxShadow = 'none'; };
    apiKeyInput.placeholder = '输入API密钥';
    apiKeyInput.addEventListener('input', () => {
        settings.optionsApiKey = apiKeyInput.value;
        saveSettingsDebounced();
    });
    apiKeyRow.appendChild(apiKeyLabel);
    apiKeyRow.appendChild(apiKeyInput);
    groupCard.appendChild(apiKeyRow);
    // ===== Base URL =====
    const baseUrlRow = document.createElement('div');
    baseUrlRow.style.display = 'flex';
    baseUrlRow.style.alignItems = 'center';
    baseUrlRow.style.marginBottom = '12px';
    const baseUrlLabel = document.createElement('label');
    baseUrlLabel.textContent = '基础URL:';
    baseUrlLabel.style.width = '90px';
    baseUrlLabel.style.fontWeight = '500';
    baseUrlLabel.style.marginRight = '10px';
    const baseUrlInput = document.createElement('input');
    baseUrlInput.type = 'text';
    baseUrlInput.value = settings.optionsBaseUrl;
    baseUrlInput.style.flex = '1';
    baseUrlInput.style.padding = '6px 10px';
    baseUrlInput.style.borderRadius = '8px';
    baseUrlInput.style.border = '1px solid #b0c4de';
    baseUrlInput.style.background = '#f8fbff';
    baseUrlInput.style.transition = 'box-shadow 0.2s';
    baseUrlInput.onfocus = () => { baseUrlInput.style.boxShadow = '0 0 0 2px #4a9eff55'; };
    baseUrlInput.onblur = () => { baseUrlInput.style.boxShadow = 'none'; };
    baseUrlInput.placeholder = '输入API基础URL';
    baseUrlInput.addEventListener('input', () => {
        settings.optionsBaseUrl = baseUrlInput.value;
        saveSettingsDebounced();
    });
    baseUrlRow.appendChild(baseUrlLabel);
    baseUrlRow.appendChild(baseUrlInput);
    groupCard.appendChild(baseUrlRow);
    // ===== 选项生成开关与调试模式 =====
    const switchesRow = document.createElement('div');
    switchesRow.style.display = 'flex';
    switchesRow.style.alignItems = 'center';
    switchesRow.style.gap = '18px';
    switchesRow.style.margin = '10px 0 0 0';
    // 启用选项生成
    const optionsEnabledLabel = document.createElement('label');
    optionsEnabledLabel.classList.add('checkbox_label');
    optionsEnabledLabel.style.display = 'flex';
    optionsEnabledLabel.style.alignItems = 'center';
    const optionsEnabledCheckbox = document.createElement('input');
    optionsEnabledCheckbox.type = 'checkbox';
    optionsEnabledCheckbox.checked = settings.optionsGenEnabled;
    optionsEnabledCheckbox.style.marginRight = '6px';
    optionsEnabledCheckbox.addEventListener('change', () => {
        settings.optionsGenEnabled = optionsEnabledCheckbox.checked;
        groupCard.style.opacity = settings.optionsGenEnabled ? '1' : '0.5';
        saveSettingsDebounced();
    });
    const optionsEnabledText = document.createElement('span');
    optionsEnabledText.textContent = '启用回复选项生成';
    optionsEnabledLabel.append(optionsEnabledCheckbox, optionsEnabledText);
    // 调试模式
    const debugLabel = document.createElement('label');
    debugLabel.classList.add('checkbox_label');
    debugLabel.style.display = 'flex';
    debugLabel.style.alignItems = 'center';
    debugLabel.style.marginLeft = '10px';
    const debugCheckbox = document.createElement('input');
    debugCheckbox.type = 'checkbox';
    debugCheckbox.checked = settings.debug;
    debugCheckbox.style.marginRight = '6px';
    debugCheckbox.addEventListener('change', () => {
        settings.debug = debugCheckbox.checked;
        saveSettingsDebounced();
    });
    const debugText = document.createElement('span');
    debugText.textContent = '启用调试日志';
    debugLabel.append(debugCheckbox, debugText);
    switchesRow.appendChild(optionsEnabledLabel);
    switchesRow.appendChild(debugLabel);
    groupCard.appendChild(switchesRow);
    optionsContainer.appendChild(groupCard);

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