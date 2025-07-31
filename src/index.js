// 导入内部模块
import { TypingIndicator } from '@features/typing-indicator.js';
import { OptionsGenerator } from '@features/options-generator.js';
import { SettingsPanel } from '@ui/settings-panel.js';
import { StyleManager } from '@ui/styles.js';
import { logger } from '@core/logger.js';
import { getSettings } from '@core/settings.js';

/**
 * AI助手扩展主类
 */
class AIAssistantExtension {
    constructor() {
        this.typingIndicator = null;
        this.optionsGenerator = null;
        this.settingsPanel = null;
        this.styleManager = null;
        this.isInitialized = false;
    }

    /**
     * 获取SillyTavern的全局变量
     */
    getSillyTavernGlobals() {
        // 尝试不同的全局变量名称
        const eventSource = window.eventSource || window.EventSource;
        const event_types = window.event_types || window.eventTypes || window.EVENT_TYPES;
        const extension_settings = window.extension_settings || window.extensionSettings;
        const saveSettingsDebounced = window.saveSettingsDebounced || window.saveSettings;
        const name2 = window.name2;
        const selected_group = window.selected_group || window.selectedGroup;
        const isStreamingEnabled = window.isStreamingEnabled;
        
        console.log('AI助手扩展：获取到的全局变量', {
            eventSource: !!eventSource,
            event_types: !!event_types,
            extension_settings: !!extension_settings,
            saveSettingsDebounced: !!saveSettingsDebounced,
            name2: !!name2,
            selected_group: !!selected_group,
            isStreamingEnabled: !!isStreamingEnabled
        });
        
        return {
            name2,
            eventSource,
            event_types,
            isStreamingEnabled,
            saveSettingsDebounced,
            extension_settings,
            selected_group,
        };
    }

    /**
     * 初始化扩展
     */
    initialize() {
        if (this.isInitialized) {
            logger.warn('扩展已经初始化');
            return;
        }

        try {
            logger.log('开始初始化AI助手扩展...');

            // 初始化样式管理器
            this.styleManager = new StyleManager();

            // 初始化打字指示器
            this.typingIndicator = new TypingIndicator();

            // 初始化选项生成器
            this.optionsGenerator = new OptionsGenerator();

            // 创建设置面板
            this.settingsPanel = new SettingsPanel();
            this.settingsPanel.createSettingsPanel();

            // 绑定事件监听器
            this.bindEventListeners();

            this.isInitialized = true;
            logger.log('AI助手扩展初始化完成');
        } catch (error) {
            logger.error('初始化扩展时出错:', error);
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        const globals = this.getSillyTavernGlobals();
        const settings = getSettings();

        // 打字指示器事件
        const showIndicatorEvents = [globals.event_types.GENERATION_AFTER_COMMANDS];
        const hideIndicatorEvents = [globals.event_types.GENERATION_STOPPED, globals.event_types.GENERATION_ENDED, globals.event_types.CHAT_CHANGED];

        showIndicatorEvents.forEach(e => {
            globals.eventSource.on(e, (type, args, dryRun) => {
                this.typingIndicator.show(type, args, dryRun);
            });
        });

        hideIndicatorEvents.forEach(e => {
            globals.eventSource.on(e, () => {
                this.typingIndicator.hide();
            });
        });

        // 手动中止事件
        globals.eventSource.on(globals.event_types.GENERATION_STOPPED, () => {
            logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
            this.optionsGenerator.isManuallyStopped = true;
        });

        // 生成结束事件
        globals.eventSource.on(globals.event_types.GENERATION_ENDED, () => {
            logger.log('GENERATION_ENDED event triggered.', { 
                isManuallyStopped: this.optionsGenerator.isManuallyStopped, 
                optionsGenEnabled: getSettings().optionsGenEnabled 
            });

            // 只有当选项生成功能启用且没有手动中止时才生成选项
            if (getSettings().optionsGenEnabled && !this.optionsGenerator.isManuallyStopped) {
                logger.log('GENERATION_ENDED: 条件满足，触发选项生成。');
                this.optionsGenerator.generateOptions();
            } else {
                logger.log('GENERATION_ENDED: 不满足选项生成条件，跳过。');
            }

            // 无论是否生成选项，都重置标志，为下一次生成做准备
            this.optionsGenerator.isManuallyStopped = false;
        });

        // 聊天切换事件
        globals.eventSource.on(globals.event_types.CHAT_CHANGED, () => {
            logger.log('CHAT_CHANGED event triggered.');
            
            // 首先，像往常一样隐藏所有UI
            this.typingIndicator.hide();
            this.optionsGenerator.hideGeneratingUI();
            this.optionsGenerator.hideOptions();

            // 然后，在新聊天加载后，检查是否需要自动生成选项
            setTimeout(() => {
                logger.log('开始延时检查...');
                const currentSettings = getSettings();
                if (!currentSettings.optionsGenEnabled) {
                    logger.log('选项生成已禁用，跳过检查。');
                    return;
                }

                const isLastFromAI = this.isLastMessageFromAI();
                const optionsContainer = document.getElementById('ti-options-container');

                if (isLastFromAI && !optionsContainer) {
                    logger.log('条件满足 (AI消息且无选项)，准备自动生成选项。');
                    this.optionsGenerator.generateOptions();
                } else {
                    logger.log('不满足自动生成条件:', { 
                        isLastFromAI, 
                        hasOptionsContainer: !!optionsContainer, 
                        isGenerating: this.optionsGenerator.isGenerating 
                    });
                }
            }, 500); // 延迟500毫秒以确保新聊天渲染完成
        });
    }

    /**
     * 检查最后一条消息是否来自AI
     * @returns {boolean}
     */
    isLastMessageFromAI() {
        const messages = document.querySelectorAll('.mes, .message');
        if (messages.length === 0) return false;

        const lastMessage = messages[messages.length - 1];
        return lastMessage.classList.contains('mes_assistant') || lastMessage.classList.contains('assistant');
    }

    /**
     * 获取扩展实例
     * @returns {AIAssistantExtension}
     */
    static getInstance() {
        if (!AIAssistantExtension.instance) {
            AIAssistantExtension.instance = new AIAssistantExtension();
        }
        return AIAssistantExtension.instance;
    }
}

/**
 * 等待核心系统就绪
 */
function waitForCoreSystem() {
    console.log('AI助手扩展：检查核心系统状态...');
    
    // 检查所有可能的全局变量
    const globalVars = {
        eventSource: window.eventSource,
        event_types: window.event_types,
        extension_settings: window.extension_settings,
        saveSettingsDebounced: window.saveSettingsDebounced,
        // 可能的替代名称
        eventSourceAlt: window.EventSource,
        extensionSettingsAlt: window.extensionSettings,
        saveSettingsAlt: window.saveSettings,
        // 检查SillyTavern特有的全局变量
        sillyTavern: window.SillyTavern,
        st: window.st,
        api: window.api,
        // 检查其他可能的变量
        name2: window.name2,
        selected_group: window.selected_group,
        isStreamingEnabled: window.isStreamingEnabled
    };
    
    console.log('AI助手扩展：所有全局变量检查结果', globalVars);
    
    // 检查必要的全局变量
    const hasEventSource = typeof window.eventSource !== 'undefined' && window.eventSource && window.eventSource.on;
    const hasExtensionSettings = typeof window.extension_settings !== 'undefined';
    const hasSaveSettingsDebounced = typeof window.saveSettingsDebounced !== 'undefined';
    
    // 尝试替代名称
    const hasEventSourceAlt = typeof window.EventSource !== 'undefined' && window.EventSource && window.EventSource.on;
    const hasExtensionSettingsAlt = typeof window.extensionSettings !== 'undefined';
    const hasSaveSettingsAlt = typeof window.saveSettings !== 'undefined';
    
    console.log('AI助手扩展：系统检查结果', {
        hasEventSource,
        hasExtensionSettings,
        hasSaveSettingsDebounced,
        hasEventSourceAlt,
        hasExtensionSettingsAlt,
        hasSaveSettingsAlt
    });

    // 如果找到任何可用的全局变量，就尝试初始化
    if ((hasEventSource || hasEventSourceAlt) && 
        (hasExtensionSettings || hasExtensionSettingsAlt) && 
        (hasSaveSettingsDebounced || hasSaveSettingsAlt)) {
        console.log('AI助手扩展：核心事件系统已就绪，初始化插件。');
        const extension = AIAssistantExtension.getInstance();
        extension.initialize();
    } else {
        console.log('AI助手扩展：等待核心事件系统加载...');
        // 增加延迟时间，避免过于频繁的检查
        setTimeout(waitForCoreSystem, 1000);
    }
}

// 启动就绪检查
waitForCoreSystem();

// 暴露给全局作用域，确保SillyTavern能够找到扩展
window.typing_indicator_extension = {
    initialize: () => {
        const extension = AIAssistantExtension.getInstance();
        extension.initialize();
    },
    getInstance: () => AIAssistantExtension.getInstance()
};

// 兼容性：也暴露为全局函数
window.initializeTypingIndicator = () => {
    const extension = AIAssistantExtension.getInstance();
    extension.initialize();
}; 