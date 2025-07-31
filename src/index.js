// 导入外部依赖
import {
    name2,
    eventSource,
    event_types,
    isStreamingEnabled,
    saveSettingsDebounced,
} from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { selected_group } from '../../../group-chats.js';

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
        const settings = getSettings();

        // 打字指示器事件
        const showIndicatorEvents = [event_types.GENERATION_AFTER_COMMANDS];
        const hideIndicatorEvents = [event_types.GENERATION_STOPPED, event_types.GENERATION_ENDED, event_types.CHAT_CHANGED];

        showIndicatorEvents.forEach(e => {
            eventSource.on(e, (type, args, dryRun) => {
                this.typingIndicator.show(type, args, dryRun);
            });
        });

        hideIndicatorEvents.forEach(e => {
            eventSource.on(e, () => {
                this.typingIndicator.hide();
            });
        });

        // 手动中止事件
        eventSource.on(event_types.GENERATION_STOPPED, () => {
            logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
            this.optionsGenerator.isManuallyStopped = true;
        });

        // 生成结束事件
        eventSource.on(event_types.GENERATION_ENDED, () => {
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
        eventSource.on(event_types.CHAT_CHANGED, () => {
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
    
    // 检查必要的全局变量
    const hasEventSource = typeof eventSource !== 'undefined' && eventSource && eventSource.on;
    const hasExtensionSettings = typeof extension_settings !== 'undefined';
    const hasSaveSettingsDebounced = typeof saveSettingsDebounced !== 'undefined';
    
    console.log('AI助手扩展：系统检查结果', {
        hasEventSource,
        hasExtensionSettings,
        hasSaveSettingsDebounced
    });

    if (hasEventSource && hasExtensionSettings && hasSaveSettingsDebounced) {
        console.log('AI助手扩展：核心事件系统已就绪，初始化插件。');
        const extension = AIAssistantExtension.getInstance();
        extension.initialize();
    } else {
        console.log('AI助手扩展：等待核心事件系统加载...');
        setTimeout(waitForCoreSystem, 500); // 增加延迟时间
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