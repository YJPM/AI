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
        const settings = getSettings();
        const sendMode = settings.sendMode || 'auto';
        
        // 在手动模式下不清除选项容器
        if (sendMode === 'manual') {
            logger.log('手动模式，不清除选项容器。');
            return;
        }
        
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) {
            logger.log('清除已存在的选项容器。');
            oldContainer.remove();
        }
        OptionsGenerator.hideGeneratingUI();
    }
    
    // 用户发送消息时清除选项
    eventSource.on(event_types.MESSAGE_SENT, () => {
        const settings = getSettings();
        const sendMode = settings.sendMode || 'auto';
        
        if (sendMode === 'manual') {
            logger.log('MESSAGE_SENT event triggered. 手动模式，清除选中的选项状态。');
            // 清除选中的选项状态
            OptionsGenerator.selectedOptions = [];
            // 重置所有选项按钮的样式
            const container = document.getElementById('ti-options-container');
            if (container) {
                const buttons = container.querySelectorAll('button');
                buttons.forEach(btn => {
                    btn.style.background = 'var(--SmartThemeBackgroundColor, #fff)';
                    btn.style.color = 'var(--SmartThemeBodyColor, #222)';
                    btn.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
                });
            }
            return;
        }
        
        logger.log('MESSAGE_SENT event triggered. 清除选项，等待AI回复。');
        clearOptions();
    });
    
    // 用户重新请求时清除选项
    eventSource.on(event_types.GENERATION_STARTED, () => {
        const settings = getSettings();
        const sendMode = settings.sendMode || 'auto';
        
        if (sendMode === 'manual') {
            logger.log('GENERATION_STARTED event triggered. 手动模式，清除选中的选项状态。');
            // 清除选中的选项状态
            OptionsGenerator.selectedOptions = [];
            // 重置所有选项按钮的样式
            const container = document.getElementById('ti-options-container');
            if (container) {
                const buttons = container.querySelectorAll('button');
                buttons.forEach(btn => {
                    btn.style.background = 'var(--SmartThemeBackgroundColor, #fff)';
                    btn.style.color = 'var(--SmartThemeBodyColor, #222)';
                    btn.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
                });
            }
            return;
        }
        
        logger.log('GENERATION_STARTED event triggered. 清除选项，等待AI回复。');
        clearOptions();
    });
    
    eventSource.on(event_types.GENERATION_STOPPED, () => {
        logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
        OptionsGenerator.isManuallyStopped = true;
    });
    
    eventSource.on(event_types.GENERATION_ENDED, async () => {
        const settings = getSettings();
        logger.log('GENERATION_ENDED event triggered.', { 
            isManuallyStopped: OptionsGenerator.isManuallyStopped, 
            optionsGenEnabled: settings.optionsGenEnabled,
            autoGenMode: settings.autoGenMode
        });
        
        // 检查是否满足自动生成条件
        const shouldAutoGenerate = settings.optionsGenEnabled && 
            !OptionsGenerator.isManuallyStopped && 
            settings.autoGenMode === 'auto';
            
        if (shouldAutoGenerate) {
            logger.log('GENERATION_ENDED: 自动生成模式，触发选项生成。');
            // 立即显示loading状态
            const { showPacePanelLoading } = await import('./ui.js');
            showPacePanelLoading();
            // 延迟一点再生成选项，确保loading显示
            setTimeout(() => {
                OptionsGenerator.generateOptions();
            }, 100);
        } else {
            logger.log('GENERATION_ENDED: 手动生成模式或不满足生成条件，跳过。');
        }
        OptionsGenerator.isManuallyStopped = false;
    });
    
    eventSource.on(event_types.CHAT_CHANGED, () => {
        const settings = getSettings();
        const sendMode = settings.sendMode || 'auto';
        
        if (sendMode === 'manual') {
            logger.log('CHAT_CHANGED event triggered. 手动模式，不清除选项。');
            return;
        }
        
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
