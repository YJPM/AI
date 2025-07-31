// 导入核心模块
import { eventManager } from './src/core/events.js';
import { logger } from './src/core/logger.js';
import { getSettings } from './src/core/settings.js';

// 导入功能模块
import { typingIndicator } from './src/features/typing-indicator.js';
import { optionsGenerator } from './src/features/options-generator.js';

// 导入UI模块
import { settingsUI } from './src/ui/settings-ui.js';
import { styleManager } from './src/ui/styles.js';

// 导入工具模块
import { DOMUtils } from './src/utils/dom-utils.js';

// 导入外部依赖
import {
    name2,
    eventSource,
    event_types,
    isStreamingEnabled,
    saveSettingsDebounced,
} from '../../../../script.js';
import { selected_group } from '../../../group-chats.js';

/**
 * AI助手扩展主类
 */
class AIAssistantExtension {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    /**
     * 初始化扩展
     */
    init() {
        try {
            // 初始化事件管理器
            eventManager.init(eventSource, event_types);
            
            // 注入样式
            styleManager.injectGlobalStyles();
            styleManager.applyBasicStyle();
            
            // 创建设置界面
            settingsUI.createSettingsUI();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            this.isInitialized = true;
            logger.log('AI助手扩展初始化完成');
        } catch (error) {
            logger.error('初始化失败:', error);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const eventTypes = eventManager.getEventTypes();
        
        // 打字指示器事件
        const showIndicatorEvents = [eventTypes.GENERATION_AFTER_COMMANDS];
        const hideIndicatorEvents = [eventTypes.GENERATION_STOPPED, eventTypes.GENERATION_ENDED, eventTypes.CHAT_CHANGED];

        showIndicatorEvents.forEach(e => eventManager.on(e, typingIndicator.show.bind(typingIndicator)));
        hideIndicatorEvents.forEach(e => eventManager.on(e, typingIndicator.hide.bind(typingIndicator)));

        // 手动中止事件
        eventManager.on(eventTypes.GENERATION_STOPPED, () => {
            logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
            optionsGenerator.setManuallyStopped(true);
        });

        // 生成结束事件
        eventManager.on(eventTypes.GENERATION_ENDED, () => {
            logger.log('GENERATION_ENDED event triggered.', { 
                isManuallyStopped: optionsGenerator.isManuallyStopped(), 
                optionsGenEnabled: getSettings().optionsGenEnabled 
            });
            
            // 只有当选项生成功能启用且没有手动中止时才生成选项
            if (getSettings().optionsGenEnabled && !optionsGenerator.isManuallyStopped()) {
                logger.log('GENERATION_ENDED: 条件满足，触发选项生成。');
                optionsGenerator.generateOptions();
            } else {
                logger.log('GENERATION_ENDED: 不满足选项生成条件，跳过。');
            }
            
            // 无论是否生成选项，都重置标志，为下一次生成做准备
            optionsGenerator.setManuallyStopped(false);
        });

        // 聊天切换事件
        eventManager.on(eventTypes.CHAT_CHANGED, () => {
            logger.log('CHAT_CHANGED event triggered.');
            
            // 首先，像往常一样隐藏所有UI
            typingIndicator.hide();
            optionsGenerator.hideGeneratingUI();
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

                const isLastFromAI = DOMUtils.isLastMessageFromAI();
                const optionsContainer = document.getElementById('ti-options-container');

                if (isLastFromAI && !optionsContainer) {
                    logger.log('条件满足 (AI消息且无选项)，准备自动生成选项。');
                    optionsGenerator.generateOptions();
                } else {
                    logger.log('不满足自动生成条件:', { 
                        isLastFromAI, 
                        hasOptionsContainer: !!optionsContainer, 
                        isGenerating: optionsGenerator.isCurrentlyGenerating() 
                    });
                }
            }, 500); // 延迟500毫秒以确保新聊天渲染完成
        });

        logger.log('事件监听器设置完成');
    }

    /**
     * 销毁扩展
     */
    destroy() {
        if (this.isInitialized) {
            // 移除所有事件监听器
            eventManager.removeAllListeners();
            
            // 移除所有样式
            styleManager.removeAllStyles();
            
            // 隐藏所有UI
            typingIndicator.hide();
            optionsGenerator.hideGeneratingUI();
            
            this.isInitialized = false;
            logger.log('AI助手扩展已销毁');
        }
    }

    /**
     * 获取扩展状态
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            settings: getSettings(),
            isGenerating: optionsGenerator.isCurrentlyGenerating(),
            isManuallyStopped: optionsGenerator.isManuallyStopped()
        };
    }
}

/**
 * 等待核心系统就绪
 */
function waitForCoreSystem() {
    if (typeof eventSource !== 'undefined' && eventSource.on) {
        logger.log('核心事件系统已就绪，初始化AI助手扩展。');
        window.aiAssistantExtension = new AIAssistantExtension();
    } else {
        logger.log('等待核心事件系统加载...');
        setTimeout(waitForCoreSystem, 200);
    }
}

// 启动就绪检查
waitForCoreSystem();

// 导出扩展实例（用于调试）
export { AIAssistantExtension }; 