import { logger } from '../core/logger.js';
import { getSettings, resetSettings, defaultSettings } from '../core/settings.js';
import { saveSettingsDebounced } from '../../../../script.js';

/**
 * 设置UI管理器
 */
export class SettingsUI {
    constructor() {
        this.settings = getSettings();
        this.elements = {};
    }

    /**
     * 创建设置界面
     */
    createSettingsUI() {
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

        // 创建选项生成设置
        const optionsContainer = this.createOptionsContainer();
        
        // 创建重置设置
        const resetContainer = this.createResetContainer();

        inlineDrawerContent.append(optionsContainer, resetContainer);
        
        logger.log('设置界面已创建');
    }

    /**
     * 创建选项生成设置容器
     */
    createOptionsContainer() {
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
        optionsEnabledCheckbox.checked = this.settings.optionsGenEnabled;
        optionsEnabledCheckbox.addEventListener('change', () => {
            this.settings.optionsGenEnabled = optionsEnabledCheckbox.checked;
            this.elements.optionsSettingsContainer.style.display = this.settings.optionsGenEnabled ? 'block' : 'none';
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
        debugCheckbox.checked = this.settings.debug;
        debugCheckbox.addEventListener('change', () => {
            this.settings.debug = debugCheckbox.checked;
            saveSettingsDebounced();
        });
        const debugText = document.createElement('span');
        debugText.textContent = '启用调试日志';
        debugLabel.append(debugCheckbox, debugText);
        optionsContainer.appendChild(debugLabel);

        // 选项设置容器
        const optionsSettingsContainer = this.createOptionsSettingsContainer();
        this.elements.optionsSettingsContainer = optionsSettingsContainer;
        this.elements.optionsEnabledCheckbox = optionsEnabledCheckbox;
        this.elements.debugCheckbox = debugCheckbox;

        optionsContainer.appendChild(optionsSettingsContainer);
        
        return optionsContainer;
    }

    /**
     * 创建选项设置容器
     */
    createOptionsSettingsContainer() {
        const optionsSettingsContainer = document.createElement('div');
        optionsSettingsContainer.style.marginTop = '10px';
        optionsSettingsContainer.style.display = this.settings.optionsGenEnabled ? 'block' : 'none';

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
        apiTypeSelect.value = this.settings.optionsApiType;
        optionsSettingsContainer.appendChild(apiTypeLabel);
        optionsSettingsContainer.appendChild(apiTypeSelect);

        // API Key
        const apiKeyLabel = document.createElement('label');
        apiKeyLabel.textContent = 'API密钥:';
        apiKeyLabel.style.display = 'block';
        apiKeyLabel.style.marginTop = '10px';
        const apiKeyInput = document.createElement('input');
        apiKeyInput.type = 'password';
        apiKeyInput.value = this.settings.optionsApiKey;
        apiKeyInput.placeholder = '输入API密钥';
        apiKeyInput.style.width = '100%';
        apiKeyInput.addEventListener('input', () => {
            this.settings.optionsApiKey = apiKeyInput.value;
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
        modelInput.value = this.settings.optionsApiModel;
        modelInput.placeholder = '输入模型名称';
        modelInput.style.width = '100%';
        modelInput.addEventListener('input', () => {
            this.settings.optionsApiModel = modelInput.value;
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
        baseUrlInput.value = this.settings.optionsBaseUrl;
        baseUrlInput.placeholder = '输入API基础URL';
        baseUrlInput.style.width = '100%';
        baseUrlInput.addEventListener('input', () => {
            this.settings.optionsBaseUrl = baseUrlInput.value;
            saveSettingsDebounced();
        });
        baseUrlGroup.appendChild(baseUrlLabel);
        baseUrlGroup.appendChild(baseUrlInput);
        optionsSettingsContainer.appendChild(baseUrlGroup);

        // 保存元素引用
        this.elements.apiTypeSelect = apiTypeSelect;
        this.elements.apiKeyInput = apiKeyInput;
        this.elements.modelInput = modelInput;
        this.elements.baseUrlInput = baseUrlInput;
        this.elements.baseUrlGroup = baseUrlGroup;

        // API类型变化事件
        apiTypeSelect.addEventListener('change', () => {
            this.settings.optionsApiType = apiTypeSelect.value;
            baseUrlGroup.style.display = this.settings.optionsApiType === 'openai' ? 'block' : 'none';
            saveSettingsDebounced();
        });

        // 初始状态
        baseUrlGroup.style.display = this.settings.optionsApiType === 'openai' ? 'block' : 'none';

        return optionsSettingsContainer;
    }

    /**
     * 创建重置设置容器
     */
    createResetContainer() {
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
                this.resetAllSettings();
            }
        });
        
        resetContainer.appendChild(resetButton);
        
        return resetContainer;
    }

    /**
     * 重置所有设置
     */
    resetAllSettings() {
        // 重置所有设置为默认值
        Object.assign(this.settings, structuredClone(defaultSettings));
        
        // 更新UI显示
        this.elements.optionsEnabledCheckbox.checked = this.settings.optionsGenEnabled;
        this.elements.debugCheckbox.checked = this.settings.debug;
        this.elements.apiTypeSelect.value = this.settings.optionsApiType;
        this.elements.apiKeyInput.value = this.settings.optionsApiKey;
        this.elements.modelInput.value = this.settings.optionsApiModel;
        this.elements.baseUrlInput.value = this.settings.optionsBaseUrl;
        
        // 更新UI状态
        this.elements.optionsSettingsContainer.style.display = this.settings.optionsGenEnabled ? 'block' : 'none';
        this.elements.baseUrlGroup.style.display = this.settings.optionsApiType === 'openai' ? 'block' : 'none';
        
        // 保存设置
        saveSettingsDebounced();
        
        // 显示成功消息
        console.log('设置已重置为默认值');
        alert('设置已重置为默认值');
    }
}

// 创建全局设置UI实例
export const settingsUI = new SettingsUI(); 