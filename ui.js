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
            padding: 12px 20px !important;
            margin: 12px auto !important;
            max-width: 90% !important;
            text-align: center !important;
            color: #333 !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
            opacity: 1 !important;
            z-index: 1000 !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            border: 1px solid #e0e0e0 !important;
            font-weight: 500 !important;
        }
        #ti-options-container {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            padding: 16px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid #e0e0e0;
        }
        .ti-options-capsule {
            flex: 1;
            white-space: normal;
            text-align: center;
            margin: 0 !important;
            height: auto;
            min-width: 140px;
            padding: 12px 16px !important;
            border-radius: 10px !important;
            border: 1px solid #e0e0e0 !important;
            background: rgba(255, 255, 255, 0.9) !important;
            color: #333 !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08) !important;
            backdrop-filter: blur(5px) !important;
            -webkit-backdrop-filter: blur(5px) !important;
        }
        .ti-options-capsule:hover {
            background: #f8f9fa !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
            transform: translateY(-1px) !important;
        }
        .ti-options-capsule:active {
            transform: translateY(0) !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08) !important;
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
            paceSelect.value = settings.paceMode;
            autoGenSelect.value = settings.autoGenMode;
            quickPanelCheckbox.checked = settings.showQuickPanel;
            
            // 更新快捷面板
            updateQuickPanelFromSettings();
            
            // 更新显示状态
            baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
            
            // 更新底部快捷面板显示状态
            const panel = document.getElementById('quick-pace-panel');
            if (panel) {
                panel.style.display = settings.showQuickPanel ? 'flex' : 'none';
            }
            
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
    applyUnifiedLabelStyle(sendModeLabel);
    
    const sendModeSelect = document.createElement('select');
    
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

    // 自动生成模式设置
    const autoGenContainer = document.createElement('div');
    autoGenContainer.style.marginTop = '8px';
    
    const autoGenLabel = document.createElement('label');
    autoGenLabel.textContent = '生成模式:';
    applyUnifiedLabelStyle(autoGenLabel);
    
    const autoGenSelect = document.createElement('select');
    
    const autoGenOptions = [
        { value: 'auto', text: 'AI回复后自动生成' },
        { value: 'manual', text: '手动点击生成' }
    ];
    
    autoGenOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        autoGenSelect.appendChild(optionElement);
    });
    
    autoGenSelect.value = settings.autoGenMode || 'auto';
    autoGenSelect.addEventListener('change', (e) => {
        settings.autoGenMode = e.target.value;
        saveSettingsDebounced();
    });
    
    autoGenContainer.appendChild(autoGenLabel);
    autoGenContainer.appendChild(autoGenSelect);
    optionsContainer.appendChild(autoGenContainer);
    
    // 底部快捷面板显示设置
    const quickPanelContainer = document.createElement('div');
    quickPanelContainer.style.marginTop = '8px';
    
    const quickPanelLabel = document.createElement('label');
    quickPanelLabel.textContent = '底部快捷面板:';
    applyUnifiedLabelStyle(quickPanelLabel);
    
    const quickPanelCheckbox = document.createElement('input');
    quickPanelCheckbox.type = 'checkbox';
    quickPanelCheckbox.checked = settings.showQuickPanel !== false;
    quickPanelCheckbox.addEventListener('change', (e) => {
        settings.showQuickPanel = e.target.checked;
        saveSettingsDebounced();
        
        // 立即更新面板显示状态
        const panel = document.getElementById('quick-pace-panel');
        if (panel) {
            panel.style.display = settings.showQuickPanel ? 'flex' : 'none';
        }
    });
    
    const quickPanelText = document.createElement('span');
    quickPanelText.textContent = '显示底部快捷操作面板';
    quickPanelText.style.fontSize = '16px';
    quickPanelText.style.color = 'var(--SmartThemeBodyColor, #222)';
    quickPanelText.style.marginLeft = '8px';
    
    quickPanelContainer.appendChild(quickPanelCheckbox);
    quickPanelContainer.appendChild(quickPanelText);
    optionsContainer.appendChild(quickPanelContainer);
    
    // 推进节奏设置
    const paceContainer = document.createElement('div');
    paceContainer.style.marginTop = '8px';
    
    const paceLabel = document.createElement('label');
    paceLabel.textContent = '推进节奏:';
    applyUnifiedLabelStyle(paceLabel);
    
    const paceSelect = document.createElement('select');
    
    const paceOptions = [
        { value: 'normal', text: '正常 (3-5个选项，标准推进)' },
        { value: 'fast', text: '快速 (3-4个选项，有明显时间跨越)' },
        { value: 'jump', text: '跳跃 (3-4个选项，场景直接跳转)' }
    ];
    
    paceOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        paceSelect.appendChild(optionElement);
    });
    
    paceSelect.value = settings.paceMode || 'normal';
    paceSelect.setAttribute('data-pace-select', 'true');
    paceSelect.addEventListener('change', (e) => {
        settings.paceMode = e.target.value;
        saveSettingsDebounced();
        
        // 同步更新快捷面板
        updateQuickPanelFromSettings();
    });
    
    paceContainer.appendChild(paceLabel);
    paceContainer.appendChild(paceSelect);
    optionsContainer.appendChild(paceContainer);
    
    // API Type
    const apiTypeLabel = document.createElement('label');
    apiTypeLabel.textContent = 'API 类型:';
    apiTypeLabel.style.marginTop = '8px';
    applyUnifiedLabelStyle(apiTypeLabel);
    const apiTypeSelect = document.createElement('select');
    apiTypeSelect.id = 'options-api-type';
    
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
    
    // 统一UI元素样式
    function applyUnifiedInputStyle(input) {
        input.style.width = '100%';
        input.style.padding = '8px 12px';
        input.style.border = '1px solid var(--SmartThemeBorderColor, #ccc)';
        input.style.borderRadius = '6px';
        input.style.fontSize = '16px';
        input.style.background = 'var(--SmartThemeBackgroundColor, #fff)';
        input.style.color = 'var(--SmartThemeBodyColor, #222)';
        input.style.boxSizing = 'border-box';
        input.style.transition = 'all 0.2s ease';
        input.style.outline = 'none';
        input.style.borderStyle = 'solid';
        input.style.borderWidth = '1px';
        
        // 添加聚焦效果
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--SmartThemeBlurple, #007bff)';
            input.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.1)';
        });
        
        input.addEventListener('blur', () => {
            input.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
            input.style.boxShadow = 'none';
        });
    }
    
    function applyUnifiedSelectStyle(select) {
        select.style.width = '100%';
        select.style.padding = '8px 12px';
        select.style.border = '1px solid var(--SmartThemeBorderColor, #ccc)';
        select.style.borderRadius = '6px';
        select.style.fontSize = '16px';
        select.style.background = 'var(--SmartThemeBackgroundColor, #fff)';
        select.style.color = 'var(--SmartThemeBodyColor, #222)';
        select.style.boxSizing = 'border-box';
        select.style.transition = 'all 0.2s ease';
        select.style.outline = 'none';
        select.style.cursor = 'pointer';
        
        // 添加聚焦效果
        select.addEventListener('focus', () => {
            select.style.borderColor = 'var(--SmartThemeBlurple, #007bff)';
            select.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.1)';
        });
        
        select.addEventListener('blur', () => {
            select.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
            select.style.boxShadow = 'none';
        });
    }
    
    function applyUnifiedLabelStyle(label) {
        label.style.display = 'block';
        label.style.marginBottom = '6px';
        label.style.fontWeight = 'normal';
        label.style.fontSize = '16px';
        label.style.color = 'var(--SmartThemeBodyColor, #222)';
    }
    
    // 应用统一样式
    applyUnifiedSelectStyle(sendModeSelect);
    applyUnifiedSelectStyle(paceSelect);
    applyUnifiedSelectStyle(apiTypeSelect);
    
    // 基础URL
    const baseUrlGroup = document.createElement('div');
    baseUrlGroup.id = 'options-base-url-group';
    const baseUrlLabel = document.createElement('label');
    baseUrlLabel.textContent = '基础URL:';
    baseUrlLabel.style.marginTop = '8px';
    applyUnifiedLabelStyle(baseUrlLabel);
    const baseUrlInput = document.createElement('input');
    baseUrlInput.type = 'text';
    baseUrlInput.value = settings.optionsBaseUrl;
    baseUrlInput.placeholder = '输入API基础URL';
    applyUnifiedInputStyle(baseUrlInput);
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
    modelLabel.style.marginTop = '8px';
    applyUnifiedLabelStyle(modelLabel);
    const modelInput = document.createElement('input');
    modelInput.type = 'text';
    modelInput.value = settings.optionsApiModel;
    modelInput.placeholder = '输入模型名称';
    applyUnifiedInputStyle(modelInput);
    modelInput.addEventListener('input', () => {
        settings.optionsApiModel = modelInput.value;
        saveSettingsDebounced();
    });
    optionsContainer.appendChild(modelLabel);
    optionsContainer.appendChild(modelInput);

    // API密钥
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'API密钥:';
    apiKeyLabel.style.marginTop = '8px';
    applyUnifiedLabelStyle(apiKeyLabel);
    
    const apiKeyContainer = document.createElement('div');
    apiKeyContainer.style.display = 'flex';
    apiKeyContainer.style.gap = '10px';
    apiKeyContainer.style.alignItems = 'center';
    
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.value = settings.optionsApiKey;
    apiKeyInput.placeholder = '输入API密钥';
    applyUnifiedInputStyle(apiKeyInput);
    apiKeyInput.style.flex = '1';
    apiKeyInput.addEventListener('input', () => {
        settings.optionsApiKey = apiKeyInput.value;
        saveSettingsDebounced();
    });
    
    const testConnectionButton = document.createElement('button');
    testConnectionButton.textContent = '测试连接';
    testConnectionButton.className = 'menu_button';
    testConnectionButton.style.padding = '8px 16px';
    testConnectionButton.style.fontSize = '14px';
    testConnectionButton.style.whiteSpace = 'nowrap';
    testConnectionButton.style.borderRadius = '6px';
    testConnectionButton.style.border = '1px solid var(--SmartThemeBorderColor, #ccc)';
    testConnectionButton.style.background = 'var(--SmartThemeBackgroundColor, #fff)';
    testConnectionButton.style.color = 'var(--SmartThemeBodyColor, #222)';
    testConnectionButton.style.cursor = 'pointer';
    
    const connectionStatusDiv = document.createElement('div');
    connectionStatusDiv.id = 'api-connection-status';
    connectionStatusDiv.style.marginTop = '8px';
    connectionStatusDiv.style.fontSize = '14px';
    connectionStatusDiv.style.padding = '8px 12px';
    connectionStatusDiv.style.borderRadius = '6px';
    connectionStatusDiv.style.display = 'none';
    connectionStatusDiv.style.border = '1px solid var(--SmartThemeBorderColor, #ccc)';
    connectionStatusDiv.style.transition = 'all 0.2s ease';
    
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
    streamText.style.fontSize = '16px';
    streamText.style.color = 'var(--SmartThemeBodyColor, #222)';
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

// 更新快捷面板状态
function updateQuickPanelFromSettings() {
    const settings = getSettings();
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) return;
    
    // 定义推进节奏模式
    const paceModes = [
        { value: 'normal', color: '#2196F3' },
        { value: 'fast', color: '#4CAF50' },
        { value: 'jump', color: '#9C27B0' }
    ];
    
    // 更新所有按钮状态
    panel.querySelectorAll('button').forEach((btn) => {
        const btnPaceMode = btn.getAttribute('data-pace-mode');
        const btnMode = paceModes.find(m => m.value === btnPaceMode);
        
        if (btnMode) {
            const isBtnActive = settings.paceMode === btnMode.value;
            btn.style.background = isBtnActive ? btnMode.color : 'transparent';
            btn.style.color = isBtnActive ? 'white' : btnMode.color;
        }
    });
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
        top: -25px;
        right: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 8px 12px;
        display: flex;
        gap: 6px;
        z-index: 1000;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05);
        cursor: move;
        transition: all 0.3s ease;
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;
    
    // 添加拖动功能
    let isDragging = false;
    let startX, startY, startRight, startTop;
    let isCollapsed = false;
    
    // 记录面板状态到localStorage
    const savePanelState = () => {
        const rect = panel.getBoundingClientRect();
        const state = {
            right: parseInt(panel.style.right),
            top: parseInt(panel.style.top),
            isCollapsed: isCollapsed
        };
        localStorage.setItem('quickPacePanelState', JSON.stringify(state));
    };
    
    // 从localStorage加载面板状态
    const loadPanelState = () => {
        try {
            const stateStr = localStorage.getItem('quickPacePanelState');
            if (stateStr) {
                const state = JSON.parse(stateStr);
                if (state.right) panel.style.right = `${state.right}px`;
                if (state.top) panel.style.top = `${state.top}px`;
                if (state.isCollapsed) {
                    isCollapsed = true;
                    collapsePanel();
                }
            }
        } catch (e) {
            console.error('加载面板状态失败:', e);
        }
    };
    
    // 折叠面板函数
    const collapsePanel = () => {
        const modeButtons = panel.querySelectorAll('button[data-pace-mode]');
        const separator = panel.querySelector('div[style*="background: #e0e0e0"]');
        
        modeButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        if (separator) separator.style.display = 'none';
        
        panel.style.background = 'rgba(255, 255, 255, 0.8)';
        panel.style.opacity = '0.7';
        isCollapsed = true;
        savePanelState();
    };
    
    // 展开面板函数
    const expandPanel = () => {
        const modeButtons = panel.querySelectorAll('button[data-pace-mode]');
        const separator = panel.querySelector('div[style*="background: #e0e0e0"]');
        
        modeButtons.forEach(btn => {
            btn.style.display = 'block';
        });
        
        if (separator) separator.style.display = 'block';
        
        panel.style.background = 'rgba(255, 255, 255, 0.95)';
        panel.style.opacity = '1';
        isCollapsed = false;
        savePanelState();
    };
    
    // 鼠标按下事件
    panel.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startRight = parseInt(panel.style.right) || 10;
        startTop = parseInt(panel.style.top) || -25;
        panel.style.transition = 'none';
        e.preventDefault();
    });
    
    // 鼠标移动事件
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = startX - e.clientX;
        const deltaY = startY - e.clientY;
        
        panel.style.right = `${startRight + deltaX}px`;
        panel.style.top = `${startTop - deltaY}px`;
    });
    
    // 鼠标释放事件
    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        panel.style.transition = 'all 0.3s ease';
        
        // 检测是否应该吸附到右侧
        const rect = panel.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        
        if (windowWidth - rect.right < 50) { // 距离右侧小于50px时吸附
            panel.style.right = '0px';
            collapsePanel();
        } else if (isCollapsed) {
            expandPanel();
        }
        
        savePanelState();
    });
    
    // 鼠标悬浮事件
    panel.addEventListener('mouseenter', () => {
        if (isCollapsed) {
            expandPanel();
        }
    });
    
    // 鼠标离开事件
    panel.addEventListener('mouseleave', () => {
        const rect = panel.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        
        if (windowWidth - rect.right < 50) { // 如果在右侧，则折叠
            collapsePanel();
        }
    });
    
    // 加载保存的状态
    setTimeout(loadPanelState, 100);
    
    // 创建推进节奏按钮
    const paceModes = [
        { value: 'normal', text: '正常', color: '#2196F3' },
        { value: 'fast', text: '快速', color: '#4CAF50' },
        { value: 'jump', text: '跳跃', color: '#9C27B0' }
    ];
    
    // 创建推进节奏按钮
    paceModes.forEach((mode) => {
        const button = document.createElement('button');
        button.textContent = mode.text;
        button.setAttribute('data-pace-mode', mode.value);
        
        // 检查当前设置是否匹配这个模式
        const isActive = settings.paceMode === mode.value;
        
        button.style.cssText = `
            padding: 6px 10px;
            border: 1px solid ${mode.color};
            border-radius: 8px;
            background: ${isActive ? mode.color : 'rgba(255, 255, 255, 0.9)'};
            color: ${isActive ? 'white' : mode.color};
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.2s ease;
            min-width: 55px;
            text-align: center;
            line-height: 1.2;
            margin: 1px;
            box-shadow: ${isActive ? `0 2px 8px ${mode.color}40` : '0 1px 3px rgba(0,0,0,0.1)'};
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        `;
        
        button.addEventListener('click', () => {
            settings.paceMode = mode.value;
            saveSettingsDebounced();
            
            // 更新所有按钮状态
            panel.querySelectorAll('button').forEach((btn) => {
                const btnPaceMode = btn.getAttribute('data-pace-mode');
                const btnMode = paceModes.find(m => m.value === btnPaceMode);
                
                if (btnMode) {
                    const isBtnActive = settings.paceMode === btnMode.value;
                    btn.style.background = isBtnActive ? btnMode.color : 'rgba(255, 255, 255, 0.9)';
                    btn.style.color = isBtnActive ? 'white' : btnMode.color;
                    btn.style.boxShadow = isBtnActive ? `0 2px 8px ${btnMode.color}40` : '0 1px 3px rgba(0,0,0,0.1)';
                }
            });
            
            // 同步更新设置面板
            const paceSelect = document.querySelector('[data-pace-select]');
            if (paceSelect) {
                paceSelect.value = settings.paceMode;
            }
            
            console.log('[paceMode] 已切换到:', mode.text, '(', mode.value, ')');
        });
        
        panel.appendChild(button);
    });
    
    // 添加分隔符
    const separator = document.createElement('div');
    separator.style.cssText = `
        width: 1px;
        background: #e0e0e0;
        margin: 0 6px;
        height: 24px;
        align-self: center;
    `;
    panel.appendChild(separator);
    
    // 添加重新获取选项按钮
    const refreshButton = document.createElement('button');
    refreshButton.textContent = '🔄';
    refreshButton.title = '重新获取选项';
    refreshButton.style.cssText = `
        padding: 6px 8px;
        border: 1px solid #666;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        color: #666;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        min-width: 40px;
        margin: 1px;
        text-align: center;
        line-height: 1.2;
        margin-left: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    `;
    
    refreshButton.addEventListener('click', async () => {
        console.log('[refreshButton] 点击，准备重新获取选项...');
        // 清除页面已有选项
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) {
            oldContainer.remove();
            console.log('[refreshButton] 已清除旧选项容器');
        }
        // 直接使用当前文件中的函数显示加载状态
        showPacePanelLoading();
        const { OptionsGenerator } = await import('./optionsGenerator.js');
        if (OptionsGenerator && typeof OptionsGenerator.generateOptions === 'function') {
            console.log('[refreshButton] 调用 OptionsGenerator.generateOptions');
            await OptionsGenerator.generateOptions();
            // 完成后隐藏加载状态
            hidePacePanelLoading();
        } else {
            console.warn('[refreshButton] OptionsGenerator.generateOptions 不可用', OptionsGenerator);
            hidePacePanelLoading();
        }
    });
    
    refreshButton.addEventListener('mouseenter', () => {
        refreshButton.style.background = '#f5f5f5';
        refreshButton.style.color = '#333';
        refreshButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        refreshButton.style.transform = 'scale(1.05)';
    });
    
    refreshButton.addEventListener('mouseleave', () => {
        refreshButton.style.background = 'rgba(255, 255, 255, 0.9)';
        refreshButton.style.color = '#666';
        refreshButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        refreshButton.style.transform = 'scale(1)';
    });
    
    panel.appendChild(refreshButton);

    // loading相关日志
    window.__pacePanelDebug = window.__pacePanelDebug || {};
    window.__pacePanelDebug.showPacePanelLoading = (...args) => { console.log('[showPacePanelLoading]', ...args); };
    window.__pacePanelDebug.hidePacePanelLoading = (...args) => { console.log('[hidePacePanelLoading]', ...args); };
    
    return panel;
}

// 显示loading状态
export function showPacePanelLoading() {
    console.log('[showPacePanelLoading] called');
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) return;
    const refreshButton = panel.querySelector('button[title="重新获取选项"]');
    if (!refreshButton) return;
    // 保存原始内容
    refreshButton.setAttribute('data-original-html', refreshButton.innerHTML);
    // 替换为loading图标
    refreshButton.innerHTML = '<div style="display:inline-block;animation:spin 1s linear infinite;font-size:14px;font-weight:bold;color:#fff;">⟳</div>';
    refreshButton.disabled = true;
    refreshButton.style.opacity = '0.8';
    refreshButton.style.background = '#2d2d2d';
    refreshButton.style.boxShadow = '0 0 5px rgba(255,255,255,0.2)';
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
}

// 隐藏loading状态
export function hidePacePanelLoading() {
    console.log('[hidePacePanelLoading] called');
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) return;
    const refreshButton = panel.querySelector('button[title="重新获取选项"]');
    if (!refreshButton) return;
    // 恢复原始内容
    const originalHtml = refreshButton.getAttribute('data-original-html');
    if (originalHtml) {
        refreshButton.innerHTML = originalHtml;
        refreshButton.removeAttribute('data-original-html');
    }
    refreshButton.disabled = false;
    refreshButton.style.opacity = '1';
    refreshButton.style.background = '#2d2d2d';
    refreshButton.style.color = '#fff';
    refreshButton.style.boxShadow = 'none';
}

// 初始化快捷操作面板
export function initQuickPacePanel() {
    const settings = getSettings();
    
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
                    
                    // 根据设置控制面板显示状态
                    if (!settings.showQuickPanel) {
                        panel.style.display = 'none';
                    }
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
            
            // 根据设置控制面板显示状态
            if (!settings.showQuickPanel) {
                panel.style.display = 'none';
            }
        }
    }
}