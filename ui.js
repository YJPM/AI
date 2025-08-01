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
        #ti-loading-container {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            padding: 8px 16px !important;
            margin: 8px auto !important;
            max-width: 90% !important;
            text-align: center !important;
            color: var(--text_color) !important;
            background-color: transparent !important;
            opacity: 1 !important;
            z-index: 1000 !important;
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
    inlineDrawerToggle.style.display = 'flex';
    inlineDrawerToggle.style.justifyContent = 'space-between';
    inlineDrawerToggle.style.alignItems = 'center';
    
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '10px';
    
    const extensionName = document.createElement('b');
    extensionName.textContent = 'AI智能助手';
    
    // 创建重置按钮
    const resetButton = document.createElement('button');
    resetButton.className = 'menu_button';
    resetButton.style.padding = '2px';
    resetButton.style.width = '24px';
    resetButton.style.height = '24px';
    resetButton.style.display = 'flex';
    resetButton.style.justifyContent = 'center';
    resetButton.style.alignItems = 'center';
    resetButton.style.backgroundColor = 'transparent';
    resetButton.style.color = 'var(--SmartThemeBodyColor)';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.transition = 'all 0.2s ease';
    resetButton.title = '重置设置';
    
    resetButton.addEventListener('mouseover', () => {
        resetButton.style.backgroundColor = 'var(--SmartThemeBlurple)';
        resetButton.style.color = 'white';
    });
    resetButton.addEventListener('mouseout', () => {
        resetButton.style.backgroundColor = 'transparent';
        resetButton.style.color = 'var(--SmartThemeBodyColor)';
    });
    
    const resetIcon = document.createElement('i');
    resetIcon.classList.add('fa-solid', 'fa-rotate-left');
    resetIcon.style.fontSize = '14px';
    resetButton.appendChild(resetIcon);
    
    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');
    
    resetButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('确定要将所有设置重置为默认值吗？此操作不可撤销。')) {
            Object.assign(settings, structuredClone(defaultSettings));
            
            // 更新所有UI元素
            apiTypeSelect.value = settings.optionsApiType;
            apiKeyInput.value = settings.optionsApiKey;
            modelInput.value = settings.optionsApiModel;
            baseUrlInput.value = settings.optionsBaseUrl;
            sendModeSelect.value = settings.sendMode;
            streamCheckbox.checked = settings.streamOptions;
            
            // 更新显示状态
            baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
            
            saveSettingsDebounced();
            console.log('设置已重置为默认值');
            alert('设置已重置为默认值');
        }
    });
    
    titleContainer.append(extensionName, resetButton);
    inlineDrawerToggle.append(titleContainer, inlineDrawerIcon);
    
    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');
    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);
    
    // 选项生成设置
    const optionsContainer = document.createElement('div');
    optionsContainer.style.marginTop = '20px';
    optionsContainer.style.borderTop = '1px solid var(--border_color)';
    optionsContainer.style.paddingTop = '15px';
    
    // 发送模式选择
    const sendModeLabel = document.createElement('label');
    sendModeLabel.textContent = '发送模式:';
    sendModeLabel.style.display = 'block';
    sendModeLabel.style.marginTop = '10px';
    const sendModeSelect = document.createElement('select');
    sendModeSelect.id = 'options-send-mode';
    sendModeSelect.style.width = '100%';
    sendModeSelect.innerHTML = `
        <option value="manual">手动模式 - 点击选项后需手动发送</option>
        <option value="auto">自动模式 - 点击选项后自动发送</option>
    `;
    sendModeSelect.value = settings.sendMode;
    sendModeSelect.addEventListener('change', () => {
        settings.sendMode = sendModeSelect.value;
        saveSettingsDebounced();
    });
    optionsContainer.appendChild(sendModeLabel);
    optionsContainer.appendChild(sendModeSelect);
    
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
    apiTypeSelect.addEventListener('change', () => {
        settings.optionsApiType = apiTypeSelect.value;
        saveSettingsDebounced();
        baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
    });
    optionsContainer.appendChild(apiTypeLabel);
    optionsContainer.appendChild(apiTypeSelect);
    
    // API Key
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'API密钥:';
    apiKeyLabel.style.display = 'block';
    apiKeyLabel.style.marginTop = '10px';
    
    const apiKeyContainer = document.createElement('div');
    apiKeyContainer.style.display = 'flex';
    apiKeyContainer.style.gap = '10px';
    apiKeyContainer.style.alignItems = 'center';
    
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.value = settings.optionsApiKey;
    apiKeyInput.placeholder = '输入API密钥';
    apiKeyInput.style.flex = '1';
    apiKeyInput.addEventListener('input', () => {
        settings.optionsApiKey = apiKeyInput.value;
        saveSettingsDebounced();
    });
    
    const testConnectionButton = document.createElement('button');
    testConnectionButton.textContent = '测试连接';
    testConnectionButton.className = 'menu_button';
    testConnectionButton.style.padding = '5px 10px';
    testConnectionButton.style.fontSize = '12px';
    testConnectionButton.style.whiteSpace = 'nowrap';
    
    const connectionStatusDiv = document.createElement('div');
    connectionStatusDiv.id = 'api-connection-status';
    connectionStatusDiv.style.marginTop = '5px';
    connectionStatusDiv.style.fontSize = '12px';
    connectionStatusDiv.style.padding = '5px';
    connectionStatusDiv.style.borderRadius = '4px';
    connectionStatusDiv.style.display = 'none';
    
    testConnectionButton.addEventListener('click', async () => {
        connectionStatusDiv.style.display = 'block';
        connectionStatusDiv.style.backgroundColor = 'var(--SmartThemeBlurpleTransparent)';
        connectionStatusDiv.textContent = '正在测试连接...';
        
        try {
            const { OptionsGenerator } = await import('./optionsGenerator.js');
            const result = await OptionsGenerator.testApiConnection();
            
            if (result.success) {
                connectionStatusDiv.style.backgroundColor = 'rgba(0, 128, 0, 0.1)';
                connectionStatusDiv.style.color = 'var(--SmartThemeBodyColor)';
                connectionStatusDiv.textContent = result.message;
            } else {
                connectionStatusDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                connectionStatusDiv.style.color = 'var(--SmartThemeBodyColor)';
                connectionStatusDiv.textContent = result.message;
            }
        } catch (error) {
            connectionStatusDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            connectionStatusDiv.style.color = 'var(--SmartThemeBodyColor)';
            connectionStatusDiv.textContent = `测试失败: ${error.message}`;
            console.error('测试API连接时出错:', error);
        }
    });
    
    apiKeyContainer.appendChild(apiKeyInput);
    apiKeyContainer.appendChild(testConnectionButton);
    
    optionsContainer.appendChild(apiKeyLabel);
    optionsContainer.appendChild(apiKeyContainer);
    optionsContainer.appendChild(connectionStatusDiv);
    
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
    
    optionsContainer.appendChild(modelLabel);
    optionsContainer.appendChild(modelInput);
    
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
    optionsContainer.appendChild(baseUrlGroup);
    
    // 流式选项生成
    const streamLabel = document.createElement('label');
    streamLabel.classList.add('checkbox_label');
    streamLabel.style.marginTop = '10px';
    const streamCheckbox = document.createElement('input');
    streamCheckbox.type = 'checkbox';
    streamCheckbox.checked = settings.streamOptions;
    streamCheckbox.addEventListener('change', () => {
        settings.streamOptions = streamCheckbox.checked;
        saveSettingsDebounced();
    });
    const streamText = document.createElement('span');
    streamText.textContent = '启用流式选项生成（实时显示生成过程）';
    streamLabel.append(streamCheckbox, streamText);
    optionsContainer.appendChild(streamLabel);
    
    apiTypeSelect.addEventListener('change', () => {
        settings.optionsApiType = apiTypeSelect.value;
        baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
        saveSettingsDebounced();
    });
    baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
    
    inlineDrawerContent.append(optionsContainer);
}