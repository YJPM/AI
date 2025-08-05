import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { defaultSettings, getSettings, CONSTANTS } from './settings.js';
import { logger } from './logger.js';
import { OptionsGenerator } from './optionsGenerator.js';
import { applyBasicStyle, injectGlobalStyles, addExtensionSettings, initQuickPacePanel } from './ui.js';
import { DebugTools } from './debug-tools.js';

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
        logger.info('事件处理器初始化完成');
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 用户发送消息时清除选项
        eventSource.on(event_types.MESSAGE_SENT, this.handleMessageSent.bind(this));
        
        // 用户重新请求时清除选项
        eventSource.on(event_types.GENERATION_STARTED, this.handleGenerationStarted.bind(this));
        
        // 生成停止事件
        eventSource.on(event_types.GENERATION_STOPPED, this.handleGenerationStopped.bind(this));
        
        // 生成结束事件
        eventSource.on(event_types.GENERATION_ENDED, this.handleGenerationEnded.bind(this));
        
        // 聊天切换事件
        eventSource.on(event_types.CHAT_CHANGED, this.handleChatChanged.bind(this));
    }
    
    // 处理消息发送事件
    handleMessageSent() {
        const settings = getSettings();
        const sendMode = settings.sendMode || CONSTANTS.DEFAULT_SEND_MODE;
        
        if (sendMode === 'manual') {
            logger.log('MESSAGE_SENT: 手动模式，清除选中的选项状态');
            this.resetManualModeState();
            return;
        }
        
        logger.log('MESSAGE_SENT: 清除选项，等待AI回复');
        this.clearOptions();
    }
    
    // 处理生成开始事件
    handleGenerationStarted() {
        const settings = getSettings();
        const sendMode = settings.sendMode || CONSTANTS.DEFAULT_SEND_MODE;
        
        if (sendMode === 'manual') {
            logger.log('GENERATION_STARTED: 手动模式，清除选中的选项状态');
            this.resetManualModeState();
            return;
        }
        
        logger.log('GENERATION_STARTED: 清除选项，等待AI回复');
        this.clearOptions();
    }
    
    // 处理生成停止事件
    handleGenerationStopped() {
        logger.log('GENERATION_STOPPED: 设置 isManuallyStopped 为 true');
        OptionsGenerator.isManuallyStopped = true;
    }
    
    // 处理生成结束事件
    async handleGenerationEnded() {
        const settings = getSettings();
        logger.log('GENERATION_ENDED: 检查自动生成条件', { 
            isManuallyStopped: OptionsGenerator.isManuallyStopped, 
            optionsGenEnabled: settings.optionsGenEnabled,
            autoGenMode: settings.autoGenMode
        });
        
        // 检查是否满足自动生成条件
        const shouldAutoGenerate = settings.optionsGenEnabled && 
            !OptionsGenerator.isManuallyStopped && 
            settings.autoGenMode === 'auto';
            
        if (shouldAutoGenerate) {
            logger.log('GENERATION_ENDED: 自动生成模式，触发选项生成');
            await this.triggerOptionsGeneration();
        } else {
            logger.log('GENERATION_ENDED: 手动生成模式或不满足生成条件，跳过');
        }
        
        OptionsGenerator.isManuallyStopped = false;
    }
    
    // 处理聊天切换事件
    handleChatChanged() {
        const settings = getSettings();
        const sendMode = settings.sendMode || CONSTANTS.DEFAULT_SEND_MODE;
        
        if (sendMode === 'manual') {
            logger.log('CHAT_CHANGED: 手动模式，不清除选项');
            return;
        }
        
        logger.log('CHAT_CHANGED: 清除选项');
        this.clearOptions();
    }
    
    // 清除选项
    clearOptions() {
        const settings = getSettings();
        const sendMode = settings.sendMode || CONSTANTS.DEFAULT_SEND_MODE;
        
        // 在手动模式下不清除选项容器
        if (sendMode === 'manual') {
            logger.log('手动模式，不清除选项容器');
            return;
        }
        
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) {
            logger.log('清除已存在的选项容器');
            oldContainer.remove();
        }
        OptionsGenerator.hideGeneratingUI();
    }
    
    // 重置手动模式状态
    resetManualModeState() {
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
    }
    
    // 触发选项生成
    async triggerOptionsGeneration() {
        try {
            // 立即显示loading状态
            const { showPacePanelLoading } = await import('./ui.js');
            showPacePanelLoading();
            
            // 延迟一点再生成选项，确保loading显示
            setTimeout(() => {
                OptionsGenerator.generateOptions();
            }, 100);
        } catch (error) {
            logger.error('触发选项生成失败:', error);
        }
    }
}

// 主初始化函数
function initializeTypingIndicator() {
    try {
        // 初始化样式和UI
        injectGlobalStyles();
        const settings = getSettings();
        addExtensionSettings(settings);
        applyBasicStyle();
        initQuickPacePanel(); // 初始化快捷操作面板
        
        // 初始化事件处理器
        const eventHandler = new EventHandler();
        eventHandler.init();
        
        // 在调试模式下运行诊断
        if (settings.debug) {
            setTimeout(() => {
                DebugTools.runFullDiagnostic();
            }, 3000);
        }
        
        logger.info('AI智能助手初始化完成');
    } catch (error) {
        logger.error('初始化失败:', error);
    }
}

// 等待核心系统就绪
function waitForCoreSystem() {
    if (typeof eventSource !== 'undefined' && eventSource.on) {
        logger.info('核心事件系统已就绪，初始化插件');
        initializeTypingIndicator();
    } else {
        logger.log('等待核心事件系统加载...');
        setTimeout(waitForCoreSystem, 200);
    }
}

// 启动应用
waitForCoreSystem();
