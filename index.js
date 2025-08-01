import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { defaultSettings, getSettings } from './settings.js';
import { logger } from './logger.js';
import { OptionsGenerator } from './optionsGenerator.js';
import { applyBasicStyle, injectGlobalStyles, addExtensionSettings, initQuickPacePanel } from './ui.js';

const MODULE = 'typing_indicator';

function initializeTypingIndicator() {
    injectGlobalStyles();
    const settings = getSettings();
    addExtensionSettings(settings);
    applyBasicStyle();
    initQuickPacePanel(); // 初始化快捷操作面板
    
    // 清除选项的函数
    function clearOptions() {
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) {
            logger.log('清除已存在的选项容器。');
            oldContainer.remove();
        }
        OptionsGenerator.hideGeneratingUI();
    }
    
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
    
    eventSource.on(event_types.GENERATION_ENDED, async () => {
        logger.log('GENERATION_ENDED event triggered.', { isManuallyStopped: OptionsGenerator.isManuallyStopped, optionsGenEnabled: getSettings().optionsGenEnabled });
        if (getSettings().optionsGenEnabled && !OptionsGenerator.isManuallyStopped) {
            logger.log('GENERATION_ENDED: 条件满足，触发选项生成。');
            // 立即显示loading状态
            const { showPacePanelLoading } = await import('./ui.js');
            showPacePanelLoading();
            // 延迟一点再生成选项，确保loading显示
            setTimeout(() => {
                OptionsGenerator.generateOptions();
            }, 100);
        } else {
            logger.log('GENERATION_ENDED: 不满足选项生成条件，跳过。');
        }
        OptionsGenerator.isManuallyStopped = false;
    });
    
    eventSource.on(event_types.CHAT_CHANGED, () => {
        logger.log('CHAT_CHANGED event triggered.');
        clearOptions();
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
