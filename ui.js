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
    optionsContainer.style.marginTop = '10px';
    optionsContainer.style.borderTop = '1px solid var(--border_color)';
    optionsContainer.style.paddingTop = '0px';
    
    // 发送模式设置
    const sendModeContainer = document.createElement('div');
    sendModeContainer.style.marginTop = '8px';
    
    const sendModeLabel = document.createElement('label');
    sendModeLabel.textContent = '发送模式:';
    sendModeLabel.style.display = 'block';
    sendModeLabel.style.marginBottom = '5px';
    sendModeLabel.style.fontWeight = 'bold';
    
    const sendModeSelect = document.createElement('select');
    sendModeSelect.style.width = '100%';
    sendModeSelect.style.padding = '5px';
    sendModeSelect.style.border = '1px solid #ccc';
    sendModeSelect.style.borderRadius = '3px';
    
    const sendModeOptions = [
        { value: 'auto', text: '自动' },
        { value: 'manual', text: '手动' }
    ];
    
    sendModeOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        sendModeSelect.appendChild(optionElement);
    });
    
    sendModeSelect.value = settings.sendMode || 'auto';
    sendModeSelect.addEventListener('change', (e) => {
        settings.sendMode = e.target.value;
        saveSettingsDebounced();
    });
    
    sendModeContainer.appendChild(sendModeLabel);
    sendModeContainer.appendChild(sendModeSelect);
    optionsContainer.appendChild(sendModeContainer);
    
    // 推进节奏设置
    const paceContainer = document.createElement('div');
    paceContainer.style.marginTop = '8px';
    
    const paceLabel = document.createElement('label');
    paceLabel.textContent = '推进节奏:';
    paceLabel.style.display = 'block';
    paceLabel.style.marginBottom = '5px';
    paceLabel.style.fontWeight = 'bold';
    
    const paceSelect = document.createElement('select');
    paceSelect.style.width = '100%';
    paceSelect.style.padding = '5px';
    paceSelect.style.border = '1px solid #ccc';
    paceSelect.style.borderRadius = '3px';
    
    const paceOptions = [
        { value: 'fast', text: '快速 (3-4个选项，有明显时间跨越)' },
        { value: 'balanced', text: '平衡 (3-5个选项，标准推进)' },
        { value: 'slow', text: '慢速 (3-5个选项，深度推进)' },
        { value: 'mixed', text: '混合 (4个选项，1慢速+2平衡+1快速)' }
    ];
    
    paceOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        paceSelect.appendChild(optionElement);
    });
    
    paceSelect.value = settings.paceMode || 'balanced';
    paceSelect.setAttribute('data-pace-select', 'true');
    paceSelect.addEventListener('change', (e) => {
        settings.paceMode = e.target.value;
        saveSettingsDebounced();
        
        // 同步更新快捷操作面板
        const quickPanel = document.getElementById('quick-pace-panel');
        if (quickPanel) {
            quickPanel.querySelectorAll('button').forEach((btn, index) => {
                const currentMode = paceOptions[index];
                btn.style.background = settings.paceMode === currentMode.value ? currentMode.color : 'transparent';
                btn.style.color = settings.paceMode === currentMode.value ? 'white' : currentMode.color;
            });
        }
    });
    
    paceContainer.appendChild(paceLabel);
    paceContainer.appendChild(paceSelect);
    optionsContainer.appendChild(paceContainer);
    
    // API Type
    const apiTypeLabel = document.createElement('label');
    apiTypeLabel.textContent = 'API 类型:';
    apiTypeLabel.style.display = 'block';
    apiTypeLabel.style.marginTop = '8px';
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
    
    // 基础URL
    const baseUrlGroup = document.createElement('div');
    baseUrlGroup.id = 'options-base-url-group';
    const baseUrlLabel = document.createElement('label');
    baseUrlLabel.textContent = '基础URL:';
    baseUrlLabel.style.display = 'block';
    baseUrlLabel.style.marginTop = '8px';
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

    // 模型选择
    const modelLabel = document.createElement('label');
    modelLabel.textContent = '模型:';
    modelLabel.style.display = 'block';
    modelLabel.style.marginTop = '8px';
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

    // API密钥
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'API密钥:';
    apiKeyLabel.style.display = 'block';
    apiKeyLabel.style.marginTop = '8px';
    
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
    
    // 流式选项生成
    const streamLabel = document.createElement('label');
    streamLabel.classList.add('checkbox_label');
    streamLabel.style.marginTop = '8px';
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

// 创建快捷操作面板
export function createQuickPacePanel() {
    const settings = getSettings();
    
    // 检查是否已存在面板
    let panel = document.getElementById('quick-pace-panel');
    if (panel) {
        panel.remove();
    }
    
    // 创建面板容器
    panel = document.createElement('div');
    panel.id = 'quick-pace-panel';
    panel.style.cssText = `
        position: absolute;
        top: -50px;
        right: 10px;
        background: var(--SmartThemeBlurColor, rgba(255, 255, 255, 0.9));
        border: 1px solid var(--SmartThemeBorderColor, #ddd);
        border-radius: 8px;
        padding: 6px;
        display: flex;
        gap: 3px;
        z-index: 1000;
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        font-family: inherit;
    `;
    
    // 创建模式按钮
    const paceModes = [
        { value: 'fast', text: '快速', color: '#4CAF50' },
        { value: 'balanced', text: '平衡', color: '#2196F3' },
        { value: 'slow', text: '慢速', color: '#FF9800' },
        { value: 'mixed', text: '混合', color: '#9C27B0' }
    ];
    
    paceModes.forEach(mode => {
        const button = document.createElement('button');
        button.textContent = mode.text;
        button.setAttribute('data-pace-mode', mode.value);
        button.style.cssText = `
            padding: 3px 6px;
            border: 1px solid ${mode.color};
            border-radius: 4px;
            background: ${settings.paceMode === mode.value ? mode.color : 'transparent'};
            color: ${settings.paceMode === mode.value ? 'white' : mode.color};
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s;
            min-width: 36px;
            text-align: center;
            line-height: 1.2;
        `;
        
        button.addEventListener('click', () => {
            settings.paceMode = mode.value;
            saveSettingsDebounced();
            
            // 更新所有按钮状态
            panel.querySelectorAll('button').forEach((btn, index) => {
                const currentMode = paceModes[index];
                btn.style.background = settings.paceMode === currentMode.value ? currentMode.color : 'transparent';
                btn.style.color = settings.paceMode === currentMode.value ? 'white' : currentMode.color;
            });
            
            // 同步更新扩展设置面板中的选择器
            const paceSelect = document.querySelector('select[data-pace-select]');
            if (paceSelect) {
                paceSelect.value = mode.value;
            }
        });
        
        button.addEventListener('mouseenter', () => {
            if (settings.paceMode !== mode.value) {
                button.style.background = mode.color + '20';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            if (settings.paceMode !== mode.value) {
                button.style.background = 'transparent';
            }
        });
        
        panel.appendChild(button);
    });
    
    // 添加重新获取选项按钮
    const refreshButton = document.createElement('button');
    refreshButton.textContent = '🔄';
    refreshButton.title = '重新获取选项';
    refreshButton.style.cssText = `
        padding: 3px 6px;
        border: 1px solid #666;
        border-radius: 4px;
        background: transparent;
        color: #666;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
        min-width: 36px;
        text-align: center;
        line-height: 1.2;
        margin-left: 3px;
    `;
    
    refreshButton.addEventListener('click', async () => {
        // 导入并调用重新获取选项功能
        const { OptionsGenerator } = await import('./optionsGenerator.js');
        if (OptionsGenerator && typeof OptionsGenerator.generateOptions === 'function') {
            OptionsGenerator.generateOptions();
        }
    });
    
    refreshButton.addEventListener('mouseenter', () => {
        refreshButton.style.background = '#66620';
        refreshButton.style.color = '#333';
    });
    
    refreshButton.addEventListener('mouseleave', () => {
        refreshButton.style.background = 'transparent';
        refreshButton.style.color = '#666';
    });
    
    panel.appendChild(refreshButton);
    
    return panel;
}

// 显示loading状态
export function showPacePanelLoading() {
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) return;
    
    const settings = getSettings();
    const currentButton = panel.querySelector(`[data-pace-mode="${settings.paceMode}"]`);
    if (!currentButton) return;
    
    // 保存原始文本
    currentButton.setAttribute('data-original-text', currentButton.textContent);
    
    // 创建loading图标
    const loadingIcon = document.createElement('div');
    loadingIcon.innerHTML = '⟳';
    loadingIcon.style.cssText = `
        display: inline-block;
        animation: spin 1s linear infinite;
        font-size: 12px;
        font-weight: bold;
    `;
    
    // 添加旋转动画样式
    if (!document.getElementById('pace-loading-style')) {
        const style = document.createElement('style');
        style.id = 'pace-loading-style';
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 替换文本为loading图标
    currentButton.textContent = '';
    currentButton.appendChild(loadingIcon);
}

// 隐藏loading状态
export function hidePacePanelLoading() {
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) return;
    
    const settings = getSettings();
    const currentButton = panel.querySelector(`[data-pace-mode="${settings.paceMode}"]`);
    if (!currentButton) return;
    
    // 恢复原始文本
    const originalText = currentButton.getAttribute('data-original-text');
    if (originalText) {
        currentButton.textContent = originalText;
        currentButton.removeAttribute('data-original-text');
    }
}

// 初始化快捷操作面板
export function initQuickPacePanel() {
    // 监听输入框变化
    const observer = new MutationObserver(() => {
        const textarea = document.querySelector('#send_textarea, .send_textarea');
        if (textarea) {
            const textareaContainer = textarea.closest('.chat-input-container') || textarea.parentElement;
            if (textareaContainer) {
                // 检查是否已有面板
                let existingPanel = textareaContainer.querySelector('#quick-pace-panel');
                if (!existingPanel) {
                    // 设置容器为相对定位
                    textareaContainer.style.position = 'relative';
                    
                    // 创建并添加面板
                    const panel = createQuickPacePanel();
                    textareaContainer.appendChild(panel);
                }
            }
        }
    });
    
    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // 立即检查一次
    const textarea = document.querySelector('#send_textarea, .send_textarea');
    if (textarea) {
        const textareaContainer = textarea.closest('.chat-input-container') || textarea.parentElement;
        if (textareaContainer) {
            textareaContainer.style.position = 'relative';
            const panel = createQuickPacePanel();
            textareaContainer.appendChild(panel);
        }
    }
}