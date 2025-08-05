import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { defaultSettings, getSettings, CONSTANTS } from './settings.js';
import { logger } from './logger.js';
import { OptionsGenerator } from './optionsGenerator.js';
import { applyBasicStyle, injectGlobalStyles, addExtensionSettings, initQuickPacePanel } from './ui.js';

const MODULE = 'typing_indicator';

// 事件处理器类
class EventHandler {
    constructor() {
        this.isInitialized = false;
    }
    
    // 初始化事件处理器
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.isInitialized = true;
    }
    
    // 设置事件监听器
    setupEventListeners() {
        eventSource.on(event_types.MESSAGE_SENT, this.handleMessageSent.bind(this));
        eventSource.on(event_types.GENERATION_STARTED, this.handleGenerationStarted.bind(this));
        eventSource.on(event_types.GENERATION_STOPPED, this.handleGenerationStopped.bind(this));
        eventSource.on(event_types.GENERATION_ENDED, this.handleGenerationEnded.bind(this));
        eventSource.on(event_types.CHAT_CHANGED, this.handleChatChanged.bind(this));
    }
    
    // 处理消息发送事件
    handleMessageSent() {
        this.clearOptions();
    }
    
    // 处理生成开始事件
    handleGenerationStarted() {
        this.clearOptions();
    }
    
    // 处理生成停止事件
    handleGenerationStopped() {
        OptionsGenerator.isManuallyStopped = true;
    }
    
    // 处理生成结束事件
    async handleGenerationEnded() {
        const settings = getSettings();
        
        const shouldAutoGenerate = settings.optionsGenEnabled && 
            !OptionsGenerator.isManuallyStopped && 
            settings.autoGenMode === 'auto';
            
        if (shouldAutoGenerate) {
            await this.triggerOptionsGeneration();
        }
        
        OptionsGenerator.isManuallyStopped = false;
    }
    
    // 处理聊天切换事件
    handleChatChanged() {
        this.clearOptions();
    }
    
    // 清除选项
    clearOptions() {
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) {
            oldContainer.remove();
        }
        OptionsGenerator.hideGeneratingUI();
    }
    
    // 触发选项生成
    async triggerOptionsGeneration() {
        try {
            const { showPacePanelLoading } = await import('./ui.js');
            showPacePanelLoading();
            
            setTimeout(() => {
                OptionsGenerator.generateOptions();
            }, 100);
        } catch (error) {
            // 静默处理错误
        }
    }
}

// 主初始化函数
function initializeTypingIndicator() {
    try {
        injectGlobalStyles();
        const settings = getSettings();
        addExtensionSettings(settings);
        applyBasicStyle();
        initQuickPacePanel();
        
        const eventHandler = new EventHandler();
        eventHandler.init();
    } catch (error) {
        // 静默处理错误
    }
}

// 等待核心系统就绪
function waitForCoreSystem() {
    if (typeof eventSource !== 'undefined' && eventSource.on) {
        initializeTypingIndicator();
    } else {
        setTimeout(waitForCoreSystem, 200);
    }
}

// 启动应用
waitForCoreSystem();
