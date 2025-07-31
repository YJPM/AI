import { getSettings, resetSettings } from '@core/settings.js';
import { logger } from '@core/logger.js';
import { createElement } from '@utils/dom-helpers.js';
import { API_TYPES } from '@core/constants.js';

/**
 * 设置面板类
 */
export class SettingsPanel {
    constructor() {
        this.settings = getSettings();
    }

    /**
     * 创建设置界面
     */
    createSettingsPanel() {
        // 尝试多个可能的容器ID
        let settingsContainer = document.getElementById('typing_indicator_container');
        if (!settingsContainer) {
            settingsContainer = document.getElementById('extensions_settings');
        }
        if (!settingsContainer) {
            settingsContainer = document.getElementById('extensions_settings_container');
        }
        if (!settingsContainer) {
            // 如果都找不到，尝试查找包含"extensions"的容器
            const containers = document.querySelectorAll('[id*="extension"], [id*="settings"]');
            for (const container of containers) {
                if (container.id.includes('extension') || container.id.includes('settings')) {
                    settingsContainer = container;
                    break;
                }
            }
        }

        if (!settingsContainer) {
            console.error('AI助手扩展：无法找到设置容器');
            return;
        }

        console.log('AI助手扩展：找到设置容器', settingsContainer.id);

        const inlineDrawer = createElement('div', { className: 'inline-drawer' });
        settingsContainer.append(inlineDrawer);

        const inlineDrawerToggle = createElement('div', { className: 'inline-drawer-toggle inline-drawer-header' });
        const extensionName = createElement('b', {}, 'AI助手');
        const inlineDrawerIcon = createElement('div', { className: 'inline-drawer-icon fa-solid fa-circle-chevron-down down' });
        inlineDrawerToggle.append(extensionName, inlineDrawerIcon);

        const inlineDrawerContent = createElement('div', { className: 'inline-drawer-content' });
        inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

        // 创建选项生成设置
        const optionsContainer = this.createOptionsSettings();
        inlineDrawerContent.append(optionsContainer);

        // 创建重置设置
        const resetContainer = this.createResetSettings();
        inlineDrawerContent.append(resetContainer);

        console.log('AI助手扩展：设置面板创建完成');

        return inlineDrawer;
    }

    /**
     * 创建选项生成设置
     * @returns {HTMLElement}
     */
    createOptionsSettings() {
        const optionsContainer = createElement('div', {
            style: {
                marginTop: '20px',
                borderTop: '1px solid var(--border_color)',
                paddingTop: '15px'
            }
        });

        const optionsHeader = createElement('h4', {
            style: { margin: '0 0 10px 0' }
        }, '回复选项生成');

        optionsContainer.appendChild(optionsHeader);

        // 启用选项生成
        const optionsEnabledLabel = createElement('label', { className: 'checkbox_label' });
        const optionsEnabledCheckbox = createElement('input', { type: 'checkbox' });
        optionsEnabledCheckbox.checked = this.settings.optionsGenEnabled;
        optionsEnabledCheckbox.addEventListener('change', () => {
            this.settings.optionsGenEnabled = optionsEnabledCheckbox.checked;
            this.optionsSettingsContainer.style.display = this.settings.optionsGenEnabled ? 'block' : 'none';
            (window.saveSettingsDebounced || window.saveSettings)();
        });
        const optionsEnabledText = createElement('span', {}, '启用回复选项生成');
        optionsEnabledLabel.append(optionsEnabledCheckbox, optionsEnabledText);
        optionsContainer.appendChild(optionsEnabledLabel);

        // 调试模式
        const debugLabel = createElement('label', {
            className: 'checkbox_label',
            style: { marginLeft: '10px' }
        });
        const debugCheckbox = createElement('input', { type: 'checkbox' });
        debugCheckbox.checked = this.settings.debug;
        debugCheckbox.addEventListener('change', () => {
            this.settings.debug = debugCheckbox.checked;
            (window.saveSettingsDebounced || window.saveSettings)();
        });
        const debugText = createElement('span', {}, '启用调试日志');
        debugLabel.append(debugCheckbox, debugText);
        optionsContainer.appendChild(debugLabel);

        // 选项设置容器
        this.optionsSettingsContainer = createElement('div', {
            style: {
                marginTop: '10px',
                display: this.settings.optionsGenEnabled ? 'block' : 'none'
            }
        });

        // API Type
        const apiTypeLabel = createElement('label', {
            style: { display: 'block', marginTop: '10px' }
        }, 'API 类型:');
        const apiTypeSelect = createElement('select', {
            id: 'options-api-type',
            style: { width: '100%' }
        });
        apiTypeSelect.innerHTML = `
            <option value="${API_TYPES.OPENAI}">OpenAI-兼容</option>
            <option value="${API_TYPES.GEMINI}">Google Gemini</option>
        `;
        apiTypeSelect.value = this.settings.optionsApiType;
        this.optionsSettingsContainer.appendChild(apiTypeLabel);
        this.optionsSettingsContainer.appendChild(apiTypeSelect);

        // API Key
        const apiKeyLabel = createElement('label', {
            style: { display: 'block', marginTop: '10px' }
        }, 'API密钥:');
        const apiKeyInput = createElement('input', {
            type: 'password',
            placeholder: '输入API密钥',
            style: { width: '100%' }
        });
        apiKeyInput.value = this.settings.optionsApiKey;
        apiKeyInput.addEventListener('input', () => {
            this.settings.optionsApiKey = apiKeyInput.value;
            (window.saveSettingsDebounced || window.saveSettings)();
        });
        this.optionsSettingsContainer.appendChild(apiKeyLabel);
        this.optionsSettingsContainer.appendChild(apiKeyInput);

        // 模型选择
        const modelLabel = createElement('label', {
            style: { display: 'block', marginTop: '10px' }
        }, '模型:');
        const modelInput = createElement('input', {
            type: 'text',
            placeholder: '输入模型名称',
            style: { width: '100%' }
        });
        modelInput.value = this.settings.optionsApiModel;
        modelInput.addEventListener('input', () => {
            this.settings.optionsApiModel = modelInput.value;
            (window.saveSettingsDebounced || window.saveSettings)();
        });
        this.optionsSettingsContainer.appendChild(modelLabel);
        this.optionsSettingsContainer.appendChild(modelInput);

        // 基础URL
        this.baseUrlGroup = createElement('div', { id: 'options-base-url-group' });
        const baseUrlLabel = createElement('label', {
            style: { display: 'block', marginTop: '10px' }
        }, '基础URL:');
        const baseUrlInput = createElement('input', {
            type: 'text',
            placeholder: '输入API基础URL',
            style: { width: '100%' }
        });
        baseUrlInput.value = this.settings.optionsBaseUrl;
        baseUrlInput.addEventListener('input', () => {
            this.settings.optionsBaseUrl = baseUrlInput.value;
            (window.saveSettingsDebounced || window.saveSettings)();
        });
        this.baseUrlGroup.appendChild(baseUrlLabel);
        this.baseUrlGroup.appendChild(baseUrlInput);
        this.optionsSettingsContainer.appendChild(this.baseUrlGroup);

        // API类型切换事件
        apiTypeSelect.addEventListener('change', () => {
            this.settings.optionsApiType = apiTypeSelect.value;
            this.baseUrlGroup.style.display = this.settings.optionsApiType === API_TYPES.OPENAI ? 'block' : 'none';
            (window.saveSettingsDebounced || window.saveSettings)();
        });

        // 初始状态
        this.baseUrlGroup.style.display = this.settings.optionsApiType === API_TYPES.OPENAI ? 'block' : 'none';

        optionsContainer.appendChild(this.optionsSettingsContainer);
        return optionsContainer;
    }

    /**
     * 创建重置设置
     * @returns {HTMLElement}
     */
    createResetSettings() {
        const resetContainer = createElement('div', {
            style: {
                marginTop: '20px',
                borderTop: '1px solid var(--border_color)',
                paddingTop: '15px'
            }
        });

        const resetHeader = createElement('h4', {
            style: { margin: '0 0 10px 0' }
        }, '重置设置');

        const resetButton = createElement('button', {
            className: 'menu_button',
            style: {
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--SmartThemeBlurple)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            }
        }, '重置所有设置为默认值');

        resetButton.addEventListener('click', () => {
            if (confirm('确定要将所有设置重置为默认值吗？此操作不可撤销。')) {
                // 重置所有设置为默认值
                resetSettings();
                this.settings = getSettings();

                // 更新UI显示
                this.updateUIFromSettings();

                // 保存设置
                (window.saveSettingsDebounced || window.saveSettings)();

                // 显示成功消息
                console.log('设置已重置为默认值');
                alert('设置已重置为默认值');
            }
        });

        resetContainer.appendChild(resetHeader);
        resetContainer.appendChild(resetButton);

        return resetContainer;
    }

    /**
     * 从设置更新UI
     */
    updateUIFromSettings() {
        // 更新复选框
        const optionsEnabledCheckbox = document.querySelector('#options-api-type')?.parentElement?.querySelector('input[type="checkbox"]');
        if (optionsEnabledCheckbox) {
            optionsEnabledCheckbox.checked = this.settings.optionsGenEnabled;
        }

        const debugCheckbox = document.querySelector('#options-api-type')?.parentElement?.querySelectorAll('input[type="checkbox"]')[1];
        if (debugCheckbox) {
            debugCheckbox.checked = this.settings.debug;
        }

        // 更新输入框
        const apiTypeSelect = document.getElementById('options-api-type');
        if (apiTypeSelect) {
            apiTypeSelect.value = this.settings.optionsApiType;
        }

        const apiKeyInput = apiTypeSelect?.parentElement?.querySelector('input[type="password"]');
        if (apiKeyInput) {
            apiKeyInput.value = this.settings.optionsApiKey;
        }

        const modelInput = apiTypeSelect?.parentElement?.querySelectorAll('input[type="text"]')[0];
        if (modelInput) {
            modelInput.value = this.settings.optionsApiModel;
        }

        const baseUrlInput = apiTypeSelect?.parentElement?.querySelectorAll('input[type="text"]')[1];
        if (baseUrlInput) {
            baseUrlInput.value = this.settings.optionsBaseUrl;
        }

        // 更新UI状态
        if (this.optionsSettingsContainer) {
            this.optionsSettingsContainer.style.display = this.settings.optionsGenEnabled ? 'block' : 'none';
        }
        if (this.baseUrlGroup) {
            this.baseUrlGroup.style.display = this.settings.optionsApiType === API_TYPES.OPENAI ? 'block' : 'none';
        }
    }
} 