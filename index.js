import { name2, eventSource, event_types, isStreamingEnabled, saveSettingsDebounced } from '../../../../script.js';
import { selected_group } from '../../../group-chats.js';
import { defaultSettings, getSettings } from './settings.js';
import { logger } from './logger.js';
import { OptionsGenerator } from './optionsGenerator.js';
import { applyBasicStyle, injectGlobalStyles, addExtensionSettings } from './ui.js';
import { showTypingIndicator, hideTypingIndicator, isLastMessageFromAI } from './typingIndicator.js';

const MODULE = 'typing_indicator';
const legacyIndicatorTemplate = document.getElementById('typing_indicator_template');

function initializeTypingIndicator() {
    injectGlobalStyles();
    const settings = getSettings();
    addExtensionSettings(settings);
    applyBasicStyle();
    
    // 清除选项的函数
    function clearOptions() {
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) {
            logger.log('清除已存在的选项容器。');
            oldContainer.remove();
        }
        OptionsGenerator.hideGeneratingUI();
    }
    
    const showIndicatorEvents = [event_types.GENERATION_AFTER_COMMANDS];
    const hideIndicatorEvents = [event_types.GENERATION_STOPPED, event_types.GENERATION_ENDED, event_types.CHAT_CHANGED];
    showIndicatorEvents.forEach(e => eventSource.on(e, showTypingIndicator));
    
    // 用户发送消息时清除选项
    eventSource.on(event_types.MESSAGE_SENT, () => {
        logger.log('MESSAGE_SENT event triggered. 清除选项，等待AI回复。');
        clearOptions();
    });
    
    // 用户重新请求时清除选项
    eventSource.on(event_types.GENERATION_STARTED, () => {
        logger.log('GENERATION_STARTED event triggered. 清除选项，等待AI回复。');
        clearOptions();
    });
    
    eventSource.on(event_types.GENERATION_STOPPED, () => {
        logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
        OptionsGenerator.isManuallyStopped = true;
    });
    hideIndicatorEvents.forEach(e => eventSource.on(e, hideTypingIndicator));
    eventSource.on(event_types.GENERATION_ENDED, () => {
        logger.log('GENERATION_ENDED event triggered.', { isManuallyStopped: OptionsGenerator.isManuallyStopped, optionsGenEnabled: getSettings().optionsGenEnabled });
        if (getSettings().optionsGenEnabled && !OptionsGenerator.isManuallyStopped) {
            logger.log('GENERATION_ENDED: 条件满足，触发选项生成。');
            OptionsGenerator.generateOptions();
        } else {
            logger.log('GENERATION_ENDED: 不满足选项生成条件，跳过。');
        }
        OptionsGenerator.isManuallyStopped = false;
    });
    eventSource.on(event_types.CHAT_CHANGED, () => {
        logger.log('CHAT_CHANGED event triggered.');
        hideTypingIndicator();
        clearOptions();
        // 删除CHAT_CHANGED中的自动生成逻辑，只在AI回复后生成
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

waitForCoreSystem();
