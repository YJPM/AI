/**
 * 事件管理类
 */
import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { OptionsGenerator } from '../components/options-generator.js';
import { UIManager } from '../components/ui-manager.js';

export class EventManager {
  constructor() {
    this.optionsGenerator = new OptionsGenerator();
    this.uiManager = new UIManager();
    this.listeners = new Map();
  }

  /**
   * 初始化事件监听
   */
  initialize() {
    this.setupTypingIndicatorEvents();
    this.setupOptionsGenerationEvents();
    logger.log('事件管理器初始化完成');
  }

  /**
   * 设置打字指示器事件
   */
  setupTypingIndicatorEvents() {
    const showIndicatorEvents = [CONFIG.EVENTS.GENERATION_AFTER_COMMANDS];
    const hideIndicatorEvents = [
      CONFIG.EVENTS.GENERATION_STOPPED, 
      CONFIG.EVENTS.GENERATION_ENDED, 
      CONFIG.EVENTS.CHAT_CHANGED
    ];

    // 显示指示器事件
    showIndicatorEvents.forEach(event => {
      this.on(event, this.uiManager.showTypingIndicator.bind(this.uiManager));
    });

    // 隐藏指示器事件
    hideIndicatorEvents.forEach(event => {
      this.on(event, this.uiManager.hideTypingIndicator.bind(this.uiManager));
    });
  }

  /**
   * 设置选项生成事件
   */
  setupOptionsGenerationEvents() {
    // 手动中止事件
    this.on(CONFIG.EVENTS.GENERATION_STOPPED, () => {
      logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
      this.optionsGenerator.setManuallyStopped(true);
    });

    // 生成结束事件
    this.on(CONFIG.EVENTS.GENERATION_ENDED, () => {
      logger.log('GENERATION_ENDED event triggered.', { 
        isManuallyStopped: this.optionsGenerator.isManuallyStopped,
        optionsGenEnabled: this.optionsGenerator.settingsManager.getSettings().optionsGenEnabled 
      });
      
      // 只有当选项生成功能启用且没有手动中止时才生成选项
      if (this.optionsGenerator.canGenerate() && !this.optionsGenerator.isManuallyStopped) {
        logger.log('GENERATION_ENDED: 条件满足，触发选项生成。');
        this.optionsGenerator.generateOptions();
      } else {
        logger.log('GENERATION_ENDED: 不满足选项生成条件，跳过。');
      }
      
      // 重置标志，为下一次生成做准备
      this.optionsGenerator.setManuallyStopped(false);
    });

    // 聊天变化事件
    this.on(CONFIG.EVENTS.CHAT_CHANGED, () => {
      logger.log('CHAT_CHANGED event triggered.');
      
      // 隐藏所有UI
      this.uiManager.hideTypingIndicator();
      this.uiManager.hideGeneratingUI();
      
      const oldContainer = document.getElementById(CONFIG.CSS_CLASSES.OPTIONS_CONTAINER);
      if (oldContainer) {
        logger.log('隐藏已存在的选项容器。');
        oldContainer.remove();
      }

      // 延时检查是否需要自动生成选项
      setTimeout(() => {
        logger.log('开始延时检查...');
        
        if (!this.optionsGenerator.canGenerate()) {
          logger.log('选项生成已禁用，跳过检查。');
          return;
        }

        const isLastFromAI = this.optionsGenerator.isLastMessageFromAI();
        const optionsContainer = document.getElementById(CONFIG.CSS_CLASSES.OPTIONS_CONTAINER);

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
      }, CONFIG.UI.OPTIONS_DISPLAY_DELAY);
    });
  }

  /**
   * 添加事件监听器
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // 如果存在全局事件源，也添加到全局事件系统
    if (window.eventSource) {
      window.eventSource.on(event, callback);
    }
  }

  /**
   * 移除事件监听器
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  off(event, callback) {
    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }

    // 如果存在全局事件源，也从全局事件系统移除
    if (window.eventSource) {
      window.eventSource.off(event, callback);
    }
  }

  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {any} data 事件数据
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`事件回调执行失败 [${event}]:`, error);
      }
    });
  }

  /**
   * 清理所有事件监听器
   */
  cleanup() {
    this.listeners.clear();
    logger.log('事件监听器已清理');
  }
} 