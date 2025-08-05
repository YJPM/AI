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
    
    const container = document.createElement('div');
    container.id = 'typing_indicator_container';
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px;
        border: 1px solid var(--SmartThemeBorderColor, #ccc);
        border-radius: 8px;
        margin: 10px 0;
        background: var(--SmartThemeBackgroundColor, #fff);
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'AI智能助手设置';
    title.style.cssText = `
        margin: 0 0 10px 0;
        color: var(--SmartThemeBodyColor, #222);
        font-size: 16px;
        font-weight: 600;
    `;
    container.appendChild(title);
    
    // API密钥设置
    const apiKeyContainer = document.createElement('div');
    apiKeyContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;
    
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'API密钥:';
    apiKeyLabel.style.cssText = `
        font-weight: 500;
        color: var(--SmartThemeBodyColor, #222);
    `;
    
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.value = settings.optionsApiKey || '';
    apiKeyInput.placeholder = '请输入API密钥';
    apiKeyInput.style.cssText = `
        padding: 8px 12px;
        border: 1px solid var(--SmartThemeBorderColor, #ccc);
        border-radius: 4px;
        background: var(--SmartThemeBackgroundColor, #fff);
        color: var(--SmartThemeBodyColor, #222);
        font-size: 14px;
    `;
    
    apiKeyInput.addEventListener('input', (e) => {
        settings.optionsApiKey = e.target.value;
        saveSettingsDebounced();
    });
    
    apiKeyContainer.appendChild(apiKeyLabel);
    apiKeyContainer.appendChild(apiKeyInput);
    container.appendChild(apiKeyContainer);
    
    // API类型设置
    const apiTypeContainer = document.createElement('div');
    apiTypeContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;
    
    const apiTypeLabel = document.createElement('label');
    apiTypeLabel.textContent = 'API类型:';
    apiTypeLabel.style.cssText = `
        font-weight: 500;
        color: var(--SmartThemeBodyColor, #222);
    `;
    
    const apiTypeSelect = document.createElement('select');
    apiTypeSelect.style.cssText = `
        padding: 8px 12px;
        border: 1px solid var(--SmartThemeBorderColor, #ccc);
        border-radius: 4px;
        background: var(--SmartThemeBackgroundColor, #fff);
        color: var(--SmartThemeBodyColor, #222);
        font-size: 14px;
    `;
    
    const openaiOption = document.createElement('option');
    openaiOption.value = 'openai';
    openaiOption.textContent = 'OpenAI兼容';
    openaiOption.selected = settings.optionsApiType === 'openai';
    
    const geminiOption = document.createElement('option');
    geminiOption.value = 'gemini';
    geminiOption.textContent = 'Google Gemini';
    geminiOption.selected = settings.optionsApiType === 'gemini';
    
    apiTypeSelect.appendChild(openaiOption);
    apiTypeSelect.appendChild(geminiOption);
    
    apiTypeSelect.addEventListener('change', (e) => {
        settings.optionsApiType = e.target.value;
        saveSettingsDebounced();
    });
    
    apiTypeContainer.appendChild(apiTypeLabel);
    apiTypeContainer.appendChild(apiTypeSelect);
    container.appendChild(apiTypeContainer);
    
    // 模型设置
    const modelContainer = document.createElement('div');
    modelContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;
    
    const modelLabel = document.createElement('label');
    modelLabel.textContent = '模型:';
    modelLabel.style.cssText = `
        font-weight: 500;
        color: var(--SmartThemeBodyColor, #222);
    `;
    
    const modelInput = document.createElement('input');
    modelInput.type = 'text';
    modelInput.value = settings.optionsApiModel || '';
    modelInput.placeholder = '请输入模型名称';
    modelInput.style.cssText = `
        padding: 8px 12px;
        border: 1px solid var(--SmartThemeBorderColor, #ccc);
        border-radius: 4px;
        background: var(--SmartThemeBackgroundColor, #fff);
        color: var(--SmartThemeBodyColor, #222);
        font-size: 14px;
    `;
    
    modelInput.addEventListener('input', (e) => {
        settings.optionsApiModel = e.target.value;
        saveSettingsDebounced();
    });
    
    modelContainer.appendChild(modelLabel);
    modelContainer.appendChild(modelInput);
    container.appendChild(modelContainer);
    
    // 基础URL设置
    const baseUrlContainer = document.createElement('div');
    baseUrlContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;
    
    const baseUrlLabel = document.createElement('label');
    baseUrlLabel.textContent = '基础URL:';
    baseUrlLabel.style.cssText = `
        font-weight: 500;
        color: var(--SmartThemeBodyColor, #222);
    `;
    
    const baseUrlInput = document.createElement('input');
    baseUrlInput.type = 'text';
    baseUrlInput.value = settings.optionsBaseUrl || '';
    baseUrlInput.placeholder = '请输入API基础URL';
    baseUrlInput.style.cssText = `
        padding: 8px 12px;
        border: 1px solid var(--SmartThemeBorderColor, #ccc);
        border-radius: 4px;
        background: var(--SmartThemeBackgroundColor, #fff);
        color: var(--SmartThemeBodyColor, #222);
        font-size: 14px;
    `;
    
    baseUrlInput.addEventListener('input', (e) => {
        settings.optionsBaseUrl = e.target.value;
        saveSettingsDebounced();
    });
    
    baseUrlContainer.appendChild(baseUrlLabel);
    baseUrlContainer.appendChild(baseUrlInput);
    container.appendChild(baseUrlContainer);
    
    // 功能开关
    const enabledContainer = document.createElement('div');
    enabledContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = settings.optionsGenEnabled;
    enabledCheckbox.style.cssText = `
        width: 16px;
        height: 16px;
    `;
    
    const enabledLabel = document.createElement('label');
    enabledLabel.textContent = '启用选项生成';
    enabledLabel.style.cssText = `
        font-weight: 500;
        color: var(--SmartThemeBodyColor, #222);
    `;
    
    enabledCheckbox.addEventListener('change', (e) => {
        settings.optionsGenEnabled = e.target.checked;
        saveSettingsDebounced();
    });
    
    enabledContainer.appendChild(enabledCheckbox);
    enabledContainer.appendChild(enabledLabel);
    container.appendChild(enabledContainer);
    
    // 发送模式设置
    const sendModeContainer = document.createElement('div');
    sendModeContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;
    
    const sendModeLabel = document.createElement('label');
    sendModeLabel.textContent = '发送模式:';
    sendModeLabel.style.cssText = `
        font-weight: 500;
        color: var(--SmartThemeBodyColor, #222);
    `;
    
    const sendModeSelect = document.createElement('select');
    sendModeSelect.style.cssText = `
        padding: 8px 12px;
        border: 1px solid var(--SmartThemeBorderColor, #ccc);
        border-radius: 4px;
        background: var(--SmartThemeBackgroundColor, #fff);
        color: var(--SmartThemeBodyColor, #222);
        font-size: 14px;
    `;
    
    const manualOption = document.createElement('option');
    manualOption.value = 'manual';
    manualOption.textContent = '手动选择';
    manualOption.selected = settings.sendMode === 'manual';
    
    const autoOption = document.createElement('option');
    autoOption.value = 'auto';
    autoOption.textContent = '自动发送';
    autoOption.selected = settings.sendMode === 'auto';
    
    sendModeSelect.appendChild(manualOption);
    sendModeSelect.appendChild(autoOption);
    
    sendModeSelect.addEventListener('change', (e) => {
        settings.sendMode = e.target.value;
        saveSettingsDebounced();
    });
    
    sendModeContainer.appendChild(sendModeLabel);
    sendModeContainer.appendChild(sendModeSelect);
    container.appendChild(sendModeContainer);
    
    // 推进节奏设置
    const paceModeContainer = document.createElement('div');
    paceModeContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;
    
    const paceModeLabel = document.createElement('label');
    paceModeLabel.textContent = '推进节奏:';
    paceModeLabel.style.cssText = `
        font-weight: 500;
        color: var(--SmartThemeBodyColor, #222);
    `;
    
    const paceModeSelect = document.createElement('select');
    paceModeSelect.style.cssText = `
        padding: 8px 12px;
        border: 1px solid var(--SmartThemeBorderColor, #ccc);
        border-radius: 4px;
        background: var(--SmartThemeBackgroundColor, #fff);
        color: var(--SmartThemeBodyColor, #222);
        font-size: 14px;
    `;
    
    const normalOption = document.createElement('option');
    normalOption.value = 'normal';
    normalOption.textContent = '正常';
    normalOption.selected = settings.paceMode === 'normal';
    
    const fastOption = document.createElement('option');
    fastOption.value = 'fast';
    fastOption.textContent = '快速';
    fastOption.selected = settings.paceMode === 'fast';
    
    paceModeSelect.appendChild(normalOption);
    paceModeSelect.appendChild(fastOption);
    
    paceModeSelect.addEventListener('change', (e) => {
        settings.paceMode = e.target.value;
        saveSettingsDebounced();
    });
    
    paceModeContainer.appendChild(paceModeLabel);
    paceModeContainer.appendChild(paceModeSelect);
    container.appendChild(paceModeContainer);
    
    // 自动生成模式设置
    const autoGenModeContainer = document.createElement('div');
    autoGenModeContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;
    
    const autoGenModeLabel = document.createElement('label');
    autoGenModeLabel.textContent = '生成模式:';
    autoGenModeLabel.style.cssText = `
        font-weight: 500;
        color: var(--SmartThemeBodyColor, #222);
    `;
    
    const autoGenModeSelect = document.createElement('select');
    autoGenModeSelect.style.cssText = `
        padding: 8px 12px;
        border: 1px solid var(--SmartThemeBorderColor, #ccc);
        border-radius: 4px;
        background: var(--SmartThemeBackgroundColor, #fff);
        color: var(--SmartThemeBodyColor, #222);
        font-size: 14px;
    `;
    
    const autoOption2 = document.createElement('option');
    autoOption2.value = 'auto';
    autoOption2.textContent = '自动生成';
    autoOption2.selected = settings.autoGenMode === 'auto';
    
    const manualOption2 = document.createElement('option');
    manualOption2.value = 'manual';
    manualOption2.textContent = '手动生成';
    manualOption2.selected = settings.autoGenMode === 'manual';
    
    autoGenModeSelect.appendChild(autoOption2);
    autoGenModeSelect.appendChild(manualOption2);
    
    autoGenModeSelect.addEventListener('change', (e) => {
        settings.autoGenMode = e.target.value;
        saveSettingsDebounced();
    });
    
    autoGenModeContainer.appendChild(autoGenModeLabel);
    autoGenModeContainer.appendChild(autoGenModeSelect);
    container.appendChild(autoGenModeContainer);
    
    settingsContainer.appendChild(container);
}

export function showPacePanelLoading() {
    const chat = document.querySelector('#chat');
    if (!chat) return;
    
    let container = document.getElementById('ti-loading-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ti-loading-container';
        container.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            padding: 12px 20px;
            margin: 12px auto;
            max-width: 90%;
            text-align: center;
            color: #333;
            background-color: rgba(255, 255, 255, 0.95);
            opacity: 1;
            z-index: 1000;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid #e0e0e0;
            font-weight: 500;
        `;
        chat.appendChild(container);
    }
    
    container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; border: 2px solid #f3f3f3; border-top: 2px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>正在生成选项...</span>
        </div>
    `;
    container.style.display = 'flex';
}

export function hidePacePanelLoading() {
    const container = document.getElementById('ti-loading-container');
    if (container) {
        container.remove();
    }
}

export function initQuickPacePanel() {
    // 简化版本，不创建复杂的面板
}