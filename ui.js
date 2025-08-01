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
    inlineDrawerToggle.style.display = 'flex';
    inlineDrawerToggle.style.justifyContent = 'space-between';
    inlineDrawerToggle.style.alignItems = 'center';
    
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '10px'; // 添加间距
    
    const extensionName = document.createElement('b');
    extensionName.textContent = 'AI助手';
    
    // 创建重置按钮并放在标题紧挨着的右边
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
    
    // 添加悬停效果
    resetButton.addEventListener('mouseover', () => {
        resetButton.style.backgroundColor = 'var(--SmartThemeBlurple)';
        resetButton.style.color = 'white';
    });
    resetButton.addEventListener('mouseout', () => {
        resetButton.style.backgroundColor = 'transparent';
        resetButton.style.color = 'var(--SmartThemeBodyColor)';
    });
    
    // 使用图标而不是文本
    const resetIcon = document.createElement('i');
    resetIcon.classList.add('fa-solid', 'fa-rotate-left'); // 使用刷新/重置图标
    resetIcon.style.fontSize = '14px';
    resetButton.appendChild(resetIcon);
    
    // 展开/折叠图标放在最右边
    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');
    resetButton.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止触发折叠面板
        if (confirm('确定要将所有设置重置为默认值吗？此操作不可撤销。')) {
            Object.assign(settings, structuredClone(defaultSettings));
            
            // 更新所有UI元素
            optionsEnabledCheckbox.checked = settings.optionsGenEnabled;
            debugCheckbox.checked = settings.debug;
            apiTypeSelect.value = settings.optionsApiType;
            apiKeyInput.value = settings.optionsApiKey;
            modelInput.value = settings.optionsApiModel;
            baseUrlInput.value = settings.optionsBaseUrl;
            
            // 更新发送模式选择器
            const sendModeSelect = document.getElementById('options-send-mode');
            if (sendModeSelect) sendModeSelect.value = settings.sendMode;
            
            // 更新用户画像相关字段
            summaryInput.value = settings.userProfile.summary || '';
            sceneInput.value = settings.userProfile.favoriteScene || '';
            moodInput.value = settings.userProfile.favoriteMood || '';
            focusInput.value = settings.userProfile.preferedFocus || '';
            keywordsInput.value = (settings.userProfile.customKeywords || []).join(',');
            
            // 更新显示状态
            optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';
            baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
            
            saveSettingsDebounced();
            console.log('设置已重置为默认值');
            alert('设置已重置为默认值');
        }
    });
    
    // 标题容器只包含标题文本和重置按钮
    titleContainer.append(extensionName, resetButton);
    // 将标题容器和展开图标添加到抽屉切换器
    inlineDrawerToggle.append(titleContainer, inlineDrawerIcon);
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
    
    // 发送模式选择
    const sendModeLabel = document.createElement('label');
    sendModeLabel.textContent = '发送模式:';
    sendModeLabel.style.display = 'block';
    sendModeLabel.style.marginTop = '10px';
    const sendModeSelect = document.createElement('select');
    sendModeSelect.id = 'options-send-mode';
    sendModeSelect.dataset.setting = 'sendMode';
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
    optionsSettingsContainer.appendChild(sendModeLabel);
    optionsSettingsContainer.appendChild(sendModeSelect);
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
        
        // 切换API类型时重置模型选择界面
        modelSelect.style.display = 'none';
        modelInput.style.display = 'block';
        modelSelect.innerHTML = '';
        connectionStatusDiv.style.display = 'none';
        actualModelDiv.style.display = 'none';
        
        // 清除实际模型名称
        delete settings.actualModelName;
    });
    optionsSettingsContainer.appendChild(apiTypeLabel);
    optionsSettingsContainer.appendChild(apiTypeSelect);
    // API Key
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'API密钥:';
    apiKeyLabel.style.display = 'block';
    apiKeyLabel.style.marginTop = '10px';
    
    // 创建API密钥输入框和测试按钮的容器
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
    
    // 创建测试连接按钮
    const testConnectionButton = document.createElement('button');
    testConnectionButton.textContent = '测试连接';
    testConnectionButton.className = 'menu_button';
    testConnectionButton.style.padding = '5px 10px';
    testConnectionButton.style.fontSize = '12px';
    testConnectionButton.style.whiteSpace = 'nowrap';
    
    // 创建状态显示区域
    const connectionStatusDiv = document.createElement('div');
    connectionStatusDiv.id = 'api-connection-status';
    connectionStatusDiv.style.marginTop = '5px';
    connectionStatusDiv.style.fontSize = '12px';
    connectionStatusDiv.style.padding = '5px';
    connectionStatusDiv.style.borderRadius = '4px';
    connectionStatusDiv.style.display = 'none';
    
    // 测试连接按钮点击事件
    testConnectionButton.addEventListener('click', async () => {
        // 显示加载状态
        connectionStatusDiv.style.display = 'block';
        connectionStatusDiv.style.backgroundColor = 'var(--SmartThemeBlurpleTransparent)';
        connectionStatusDiv.textContent = '正在测试连接...';
        
        try {
            // 导入OptionsGenerator
            const { OptionsGenerator } = await import('./optionsGenerator.js');
            
            // 调用测试连接函数
            const result = await OptionsGenerator.testApiConnection();
            
            // 显示结果
            if (result.success) {
                connectionStatusDiv.style.backgroundColor = 'rgba(0, 128, 0, 0.1)';
                connectionStatusDiv.style.color = 'var(--SmartThemeBodyColor)';
                connectionStatusDiv.textContent = result.message;
                
                // 更新实际模型显示
                if (result.actualModelName) {
                    settings.actualModelName = result.actualModelName;
                    actualModelDiv.textContent = `实际使用模型: ${result.actualModelName}`;
                    actualModelDiv.style.display = 'block';
                }
                
                // 如果有可用模型列表，更新下拉菜单
                if (result.models && result.models.length > 0) {
                    // 清空现有选项
                    modelSelect.innerHTML = '';
                    
                    // 添加模型选项
                    if (settings.optionsApiType === 'gemini') {
                        // Gemini API 模型格式
                        result.models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model.name;
                            option.textContent = model.displayName || model.name;
                            modelSelect.appendChild(option);
                        });
                    } else {
                        // OpenAI 兼容API模型格式
                        result.models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model.id;
                            option.textContent = model.id;
                            modelSelect.appendChild(option);
                        });
                    }
                    
                    // 设置当前选中的模型
                    if (result.currentModel) {
                        modelSelect.value = result.currentModel;
                        settings.optionsApiModel = result.currentModel;
                        modelInput.value = result.currentModel;
                        
                        // 保存实际使用的模型名称，用于显示
                        if (result.actualModelName) {
                            settings.actualModelName = result.actualModelName;
                        }
                        
                        saveSettingsDebounced();
                    } else {
                        modelSelect.value = settings.optionsApiModel;
                    }
                    
                    // 显示下拉菜单，隐藏输入框
                    modelSelect.style.display = 'block';
                    modelInput.style.display = 'none';
                    
                    // 如果当前选择行容器中没有下拉菜单，添加它
                    if (!modelSelectRow.contains(modelSelect)) {
                        modelSelectRow.insertBefore(modelSelect, modelInput);
                    }
                    
                    // 添加下拉菜单变更事件
                    modelSelect.addEventListener('change', () => {
                        settings.optionsApiModel = modelSelect.value;
                        modelInput.value = modelSelect.value; // 同步更新输入框
                        saveSettingsDebounced();
                    });
                }
            } else {
                connectionStatusDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                connectionStatusDiv.style.color = 'var(--SmartThemeBodyColor)';
                connectionStatusDiv.textContent = result.message;
                
                // 连接失败时显示输入框
                modelSelect.style.display = 'none';
                modelInput.style.display = 'block';
            }
        } catch (error) {
            connectionStatusDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            connectionStatusDiv.style.color = 'var(--SmartThemeBodyColor)';
            connectionStatusDiv.textContent = `测试失败: ${error.message}`;
            console.error('测试API连接时出错:', error);
            
            // 错误时显示输入框
            modelSelect.style.display = 'none';
            modelInput.style.display = 'block';
        }
    });
    
    // 将元素添加到容器中
    apiKeyContainer.appendChild(apiKeyInput);
    apiKeyContainer.appendChild(testConnectionButton);
    
    optionsSettingsContainer.appendChild(apiKeyLabel);
    optionsSettingsContainer.appendChild(apiKeyContainer);
    optionsSettingsContainer.appendChild(connectionStatusDiv);
    // 模型选择
    const modelLabel = document.createElement('label');
    modelLabel.textContent = '模型:';
    modelLabel.style.display = 'block';
    modelLabel.style.marginTop = '10px';
    
    // 创建模型选择容器
    const modelContainer = document.createElement('div');
    modelContainer.style.display = 'flex';
    modelContainer.style.flexDirection = 'column';
    modelContainer.style.gap = '5px';
    
    // 创建模型选择行容器
    const modelSelectRow = document.createElement('div');
    modelSelectRow.style.display = 'flex';
    modelSelectRow.style.gap = '10px';
    modelSelectRow.style.alignItems = 'center';
    modelSelectRow.style.width = '100%';
    modelContainer.appendChild(modelSelectRow);
    
    // 创建实际模型显示区域
    const actualModelDiv = document.createElement('div');
    actualModelDiv.id = 'actual-model-display';
    actualModelDiv.style.fontSize = '12px';
    actualModelDiv.style.color = 'var(--SmartThemeBodyColor)';
    actualModelDiv.style.marginTop = '2px';
    actualModelDiv.style.display = 'none';
    modelContainer.appendChild(actualModelDiv);
    
    // 如果已经有实际模型名称，显示它
    if (settings.actualModelName) {
        actualModelDiv.textContent = `实际使用模型: ${settings.actualModelName}`;
        actualModelDiv.style.display = 'block';
    }
    
    // 创建模型下拉选择框
    const modelSelect = document.createElement('select');
    modelSelect.id = 'options-api-model-select';
    modelSelect.style.flex = '1';
    modelSelect.style.display = 'none'; // 默认隐藏，只有在有可用模型时显示
    
    // 创建模型输入框
    const modelInput = document.createElement('input');
    modelInput.id = 'options-api-model-input';
    modelInput.type = 'text';
    modelInput.value = settings.optionsApiModel;
    modelInput.placeholder = '输入模型名称';
    modelInput.style.flex = '1';
    modelInput.addEventListener('input', () => {
        settings.optionsApiModel = modelInput.value;
        saveSettingsDebounced();
    });
    
    // 将模型输入元素添加到选择行容器
    modelSelectRow.appendChild(modelInput);
    
    // 更新测试连接按钮点击事件，添加模型列表处理
    testConnectionButton.addEventListener('click', async () => {
        // 显示加载状态
        connectionStatusDiv.style.display = 'block';
        connectionStatusDiv.style.backgroundColor = 'var(--SmartThemeBlurpleTransparent)';
        connectionStatusDiv.textContent = '正在测试连接...';
        
        try {
            // 导入OptionsGenerator
            const { OptionsGenerator } = await import('./optionsGenerator.js');
            
            // 调用测试连接函数
            const result = await OptionsGenerator.testApiConnection();
            
            // 显示结果
            if (result.success) {
                connectionStatusDiv.style.backgroundColor = 'rgba(0, 128, 0, 0.1)';
                connectionStatusDiv.style.color = 'var(--SmartThemeBodyColor)';
                connectionStatusDiv.textContent = result.message;
                
                // 如果有可用模型列表，更新下拉菜单
                if (result.models && result.models.length > 0) {
                    // 清空现有选项
                    modelSelect.innerHTML = '';
                    
                    // 添加模型选项
                    if (settings.optionsApiType === 'gemini') {
                        // Gemini API 模型格式
                        result.models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model.name;
                            option.textContent = model.displayName || model.name;
                            modelSelect.appendChild(option);
                        });
                    } else {
                        // OpenAI 兼容API模型格式
                        result.models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model.id;
                            option.textContent = model.id;
                            modelSelect.appendChild(option);
                        });
                    }
                    
                    // 设置当前选中的模型
                    modelSelect.value = settings.optionsApiModel;
                    
                    // 显示下拉菜单，隐藏输入框
                    modelSelect.style.display = 'block';
                    modelInput.style.display = 'none';
                    
                    // 如果当前容器中没有下拉菜单，添加它
                    if (!modelContainer.contains(modelSelect)) {
                        modelContainer.insertBefore(modelSelect, modelInput);
                    }
                    
                    // 添加下拉菜单变更事件
                    modelSelect.addEventListener('change', () => {
                        settings.optionsApiModel = modelSelect.value;
                        modelInput.value = modelSelect.value; // 同步更新输入框
                        saveSettingsDebounced();
                    });
                }
            } else {
                connectionStatusDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                connectionStatusDiv.style.color = 'var(--SmartThemeBodyColor)';
                connectionStatusDiv.textContent = result.message;
                
                // 连接失败时显示输入框
                modelSelect.style.display = 'none';
                modelInput.style.display = 'block';
            }
        } catch (error) {
            connectionStatusDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            connectionStatusDiv.style.color = 'var(--SmartThemeBodyColor)';
            connectionStatusDiv.textContent = `测试失败: ${error.message}`;
            console.error('测试API连接时出错:', error);
            
            // 错误时显示输入框
            modelSelect.style.display = 'none';
            modelInput.style.display = 'block';
        }
    });
    
    optionsSettingsContainer.appendChild(modelLabel);
    optionsSettingsContainer.appendChild(modelContainer);
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

    inlineDrawerContent.append(optionsContainer);

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