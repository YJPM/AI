import {
    name2,
    eventSource,
    event_types,
    isStreamingEnabled,
    saveSettingsDebounced,
} from '../../../../script.js';
import { selected_group } from '../../../group-chats.js';
import { defaultSettings, getSettings } from './settings.js';
import { logger } from './logger.js';
import { OptionsGenerator } from './optionsGenerator.js';

const MODULE = 'typing_indicator';
const legacyIndicatorTemplate = document.getElementById('typing_indicator_template');

/**
 * @typedef {Object} TypingIndicatorSettings
 * @property {boolean} enabled
 * @property {boolean} showCharName
 * @property {boolean} animationEnabled - 是否启用末尾的...动画。
 * @property {string} customText
 * @property {boolean} debug - 是否启用调试日志
 * @property {boolean} optionsGenEnabled - 是否启用选项生成功能
 * @property {string} optionsApiType - API类型 ('openai' 或 'gemini')
 * @property {string} optionsApiKey - API密钥
 * @property {string} optionsApiModel - 使用的模型
 * @property {string} optionsBaseUrl - API基础URL (仅限OpenAI)
 * @property {string} optionsTemplate - 选项生成提示模板
 */

/**
 * 应用固定样式
 */
function applyBasicStyle() {
    let styleTag = document.getElementById('typing-indicator-theme-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'typing-indicator-theme-style';
        document.head.appendChild(styleTag);
    }

    // 恢复为原始透明背景样式，移除所有渐变、圆角和阴影
    styleTag.textContent = `
        .typing_indicator {
            background-color: transparent; /* 恢复透明背景 */
            padding: 8px 16px;
            margin: 8px auto;
            width: fit-content;
            max-width: 90%;
            text-align: center;
            color: var(--text_color); /* 使用主题的默认文字颜色 */
        }
    `;
}

/**
 * 将扩展所需的全局 CSS 注入到文档头部。
 */
function injectGlobalStyles() {
    const css = `
        /* 核心指示器样式修复 */
        #typing_indicator.typing_indicator {
            opacity: 1 !important; /* 强制覆盖主机应用可能存在的透明度样式，以修复不透明CSS仍然半透明的问题。 */
            background-color: transparent !important; /* 强制透明背景 */
        }

        /* 确保所有提示容器都是透明背景 */
        .typing_indicator {
            background-color: transparent !important;
        }

        /* 省略号动画 */
        /* 恢复省略号显示 */
        .typing-ellipsis::after {
            display: inline-block;
            animation: ellipsis-animation 1.4s infinite;
            content: '.';
            width: 1.2em; /* 预留足够空间防止布局抖动 */
            text-align: left;
            vertical-align: bottom;
        }
        @keyframes ellipsis-animation {
            0% { content: '.'; }
            33% { content: '..'; }
            66%, 100% { content: '...'; }
        }

        /* 移除提示文字渐变样式，恢复为普通文本 */
        .typing-indicator-text {
            font-weight: normal; /* 恢复正常字体粗细 */
            background: none; /* 移除背景 */
            -webkit-background-clip: unset; /* 移除裁剪 */
            background-clip: unset;
            -webkit-text-fill-color: unset; /* 恢复文本颜色 */
            display: inline; /* 恢复默认行内显示 */
            animation: none; /* 移除动画 */
            color: var(--text_color); /* 确保文字颜色正常 */
        }

        /* 移除闪烁渐变动画 */
        /*
        @keyframes gradient-pulse {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        */

        /* 选项按钮样式 */
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

        /* 移除：浮动提示样式 */
        /*
        .ai-floating-indicator {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            pointer-events: none;
            background-color: transparent;
            padding: 8px 16px;
            margin: 0;
            width: fit-content;
            max-width: 90%;
            text-align: center;
            color: var(--text_color);
            box-shadow: none;
            display: none;
            justify-content: center;
            align-items: center;
        }
        */
    `;
    let styleTag = document.getElementById('typing-indicator-global-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'typing-indicator-global-style';
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
    }
}


/**
 * 绘制此扩展的设置界面。
 */
function addExtensionSettings(settings) {
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
    // Initial state
    baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';




    optionsContainer.appendChild(optionsSettingsContainer);
    
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
            // 重置所有设置为默认值
            Object.assign(settings, structuredClone(defaultSettings));
            
            // 更新UI显示
            optionsEnabledCheckbox.checked = settings.optionsGenEnabled;
            debugCheckbox.checked = settings.debug;
            apiTypeSelect.value = settings.optionsApiType;
            apiKeyInput.value = settings.optionsApiKey;
            modelInput.value = settings.optionsApiModel;
            baseUrlInput.value = settings.optionsBaseUrl;
            
            // 更新UI状态
            optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';
            baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
            
            // 保存设置
            saveSettingsDebounced();
            
            // 显示成功消息
            console.log('设置已重置为默认值');
            alert('设置已重置为默认值');
        }
    });
    
    resetContainer.appendChild(resetButton);
    
    inlineDrawerContent.append(optionsContainer, resetContainer);
}

/**
 * 在聊天中显示一个打字指示器。
 */
function showTypingIndicator(type, _args, dryRun) {
    const settings = getSettings();
    const noIndicatorTypes = ['quiet', 'impersonate'];

    if (type !== 'refresh' && (noIndicatorTypes.includes(type) || dryRun)) {
        return;
    }

    if (!settings.enabled) {
        return;
    }

    if (settings.showCharName && !name2 && type !== 'refresh') {
        return;
    }

    if (legacyIndicatorTemplate && selected_group && !isStreamingEnabled()) {
        return;
    }

    // 构建最终显示的文本
    const placeholder = '{char}';
    let finalText = settings.customText || defaultSettings.customText;

    if (settings.showCharName && name2) {
        if (finalText.includes(placeholder)) {
            finalText = finalText.replace(placeholder, name2);
        } else {
            finalText = `${name2}${finalText}`;
        }
    } else {
        finalText = finalText.replace(placeholder, '').replace(/  +/g, ' ').trim();
    }

    const animationHtml = settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
    const htmlContent = `
    <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
        <div class="typing-indicator-text">${finalText}</div>
        ${animationHtml}
    </div>
`;

    let typingIndicator = document.getElementById('typing_indicator');
    if (typingIndicator) {
        logger.log('showTypingIndicator: 找到现有指示器，更新内容并尝试显示。');
        typingIndicator.innerHTML = htmlContent;
        // typingIndicator.style.display = 'flex'; // 不再强制display，让系统控制
    } else {
        logger.log('showTypingIndicator: 未找到现有指示器，创建新指示器。');
        typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing_indicator';
        // 恢复原始 class，移除 ai-floating-indicator
    typingIndicator.classList.add('typing_indicator');
    typingIndicator.innerHTML = htmlContent;

        // 恢复附加到 chat，而不是 body
    const chat = document.getElementById('chat');
    if (chat) {
            // 检查用户是否已滚动到底部（允许有几个像素的误差）
        const wasChatScrolledDown = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 5;

        chat.appendChild(typingIndicator);
            logger.log('showTypingIndicator: 指示器已附加到 chat。');

            // 如果用户在指示器出现前就位于底部，则自动滚动到底部以保持指示器可见
        if (wasChatScrolledDown) {
            chat.scrollTop = chat.scrollHeight;
                logger.log('showTypingIndicator: 聊天已自动滚动到底部。');
            }
        }
    }
    logger.log(`showTypingIndicator: 最终指示器 display 属性 (由CSS控制，JS不强制): ${typingIndicator.style.display}`);

    // 由于现在是固定定位，以下滚动逻辑不再需要
    // const chat = document.getElementById('chat');
    // if (chat) {
    //     // 检查用户是否已滚动到底部（允许有几个像素的误差）
    //     const wasChatScrolledDown = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 5;
    //     chat.appendChild(typingIndicator);
    //     // 如果用户在指示器出现前就位于底部，则自动滚动到底部以保持指示器可见
    //     if (wasChatScrolledDown) {
    //         chat.scrollTop = chat.scrollHeight;
    //     }
    // }
}

/**
 * 隐藏打字指示器。
 */
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing_indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// (DOM-based, v4) 检查最后一条消息是否来自AI
function isLastMessageFromAI() {
    logger.log('检查最后一条消息 (last_mes 属性模式)...');
    try {
        const lastMessage = document.querySelector('#chat .last_mes');
        if (!lastMessage) {
            logger.log('未找到 .last_mes 元素，判定为非AI。');
            return false;
        }

        const isUser = lastMessage.getAttribute('is_user');
        logger.log(`找到 .last_mes 元素。is_user 属性为: "${isUser}".`);

        // The attribute value is a string "false", not a boolean.
        const isBot = isUser === 'false';
        logger.log(`结论: ${isBot ? '是' : '不是'} AI消息。`);
        return isBot;
    } catch (error) {
        logger.error('通过 .last_mes 检查最后一条消息时出错:', error);
        return false;
    }
}


function initializeTypingIndicator() {
    injectGlobalStyles();
    const settings = getSettings();
    addExtensionSettings(settings);
    applyBasicStyle();

    const showIndicatorEvents = [event_types.GENERATION_AFTER_COMMANDS];
    const hideIndicatorEvents = [event_types.GENERATION_STOPPED, event_types.GENERATION_ENDED, event_types.CHAT_CHANGED];

    showIndicatorEvents.forEach(e => eventSource.on(e, showTypingIndicator));
    // 在手动中止时设置标志
    eventSource.on(event_types.GENERATION_STOPPED, () => {
        logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
        OptionsGenerator.isManuallyStopped = true;
    });
    hideIndicatorEvents.forEach(e => eventSource.on(e, hideTypingIndicator));

    eventSource.on(event_types.GENERATION_ENDED, () => {
        logger.log('GENERATION_ENDED event triggered.', { isManuallyStopped: OptionsGenerator.isManuallyStopped, optionsGenEnabled: getSettings().optionsGenEnabled });
        // 只有当选项生成功能启用且没有手动中止时才生成选项
        if (getSettings().optionsGenEnabled && !OptionsGenerator.isManuallyStopped) {
            logger.log('GENERATION_ENDED: 条件满足，触发选项生成。');
            OptionsGenerator.generateOptions();
        } else {
            logger.log('GENERATION_ENDED: 不满足选项生成条件，跳过。');
        }
        // 无论是否生成选项，都重置标志，为下一次生成做准备
        OptionsGenerator.isManuallyStopped = false;
    });

    eventSource.on(event_types.CHAT_CHANGED, () => {
        logger.log('CHAT_CHANGED event triggered.');
        // 首先，像往常一样隐藏所有UI
        hideTypingIndicator();
        OptionsGenerator.hideGeneratingUI();
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) {
            logger.log('隐藏已存在的选项容器。');
            oldContainer.remove();
        }

        // 然后，在新聊天加载后，检查是否需要自动生成选项
        setTimeout(() => {
            logger.log('开始延时检查...');
            const settings = getSettings();
            if (!settings.optionsGenEnabled) {
                logger.log('选项生成已禁用，跳过检查。');
                return;
            }

            const isLastFromAI = isLastMessageFromAI();
            const optionsContainer = document.getElementById('ti-options-container');

            // 移除 !OptionsGenerator.isGenerating 条件，让 generateOptions 内部的检查来处理
            if (isLastFromAI && !optionsContainer) {
                logger.log('条件满足 (AI消息且无选项)，准备自动生成选项。');
                OptionsGenerator.generateOptions();
            } else {
                logger.log('不满足自动生成条件:', { isLastFromAI, hasOptionsContainer: !!optionsContainer, isGenerating: OptionsGenerator.isGenerating });
            }
        }, 500); // 延迟500毫秒以确保新聊天渲染完成
    });
}

function waitForCoreSystem() {
    if (typeof eventSource !== 'undefined' && eventSource.on) {
        logger.log('核心事件系统已就绪，初始化插件。');
        initializeTypingIndicator();
    } else {
        logger.log('等待核心事件系统加载...');
        setTimeout(waitForCoreSystem, 200);
    }
}

// 启动就绪检查
waitForCoreSystem();
