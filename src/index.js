/**
 * AI助手扩展 - 主入口文件
 * 
 * 功能：
 * - 打字指示器显示
 * - 智能回复选项生成
 * - 自动触发选项生成
 * - 设置管理
 */

// 导入核心模块
import { CONFIG } from './config/constants.js';
import { logger } from './utils/logger.js';
import { SettingsManager } from './core/settings.js';

// 导入其他模块（稍后创建）
// import { APIManager } from './core/api-manager.js';
// import { ContextManager } from './core/context-manager.js';
// import { EventManager } from './core/event-manager.js';
// import { UIManager } from './components/ui-manager.js';
// import { OptionsGenerator } from './components/options-generator.js';

/**
 * AI助手扩展主类
 */
class AIAssistantExtension {
  constructor() {
    this.settingsManager = new SettingsManager();
    // this.eventManager = new EventManager();
    // this.uiManager = new UIManager();
    this.isInitialized = false;
  }

  /**
   * 初始化扩展
   */
  async initialize() {
    try {
      logger.log('开始初始化AI助手扩展...');

      // 等待核心系统就绪
      await this.waitForCoreSystem();

      // 初始化设置
      this.settingsManager.loadSettings();

      // 初始化UI
      // this.uiManager.injectGlobalStyles();
      // this.uiManager.applyBasicStyle();
      // this.uiManager.createSettingsUI(this.settingsManager.getSettings());

      // 初始化事件管理器
      // this.eventManager.initialize();

      // 设置全局变量（向后兼容）
      this.setupGlobalCompatibility();

      this.isInitialized = true;
      logger.log('AI助手扩展初始化完成');
    } catch (error) {
      logger.error('扩展初始化失败:', error);
    }
  }

  /**
   * 等待核心系统就绪
   */
  async waitForCoreSystem() {
    return new Promise((resolve) => {
      const checkSystem = () => {
        if (window.extension_settings && 
            window.eventSource && 
            window.event_types &&
            document.getElementById('chat')) {
          resolve();
        } else {
          setTimeout(checkSystem, 100);
        }
      };
      checkSystem();
    });
  }

  /**
   * 设置全局兼容性（向后兼容）
   */
  setupGlobalCompatibility() {
    // 设置全局函数
    window.getSettings = () => this.settingsManager.getSettings();
    // window.showTypingIndicator = (...args) => this.uiManager.showTypingIndicator(...args);
    // window.hideTypingIndicator = () => this.uiManager.hideTypingIndicator();
    // window.generateOptions = () => this.eventManager.optionsGenerator.generateOptions();
  }

  /**
   * 获取扩展状态
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      settings: this.settingsManager.getSettings(),
      // canGenerate: this.eventManager.optionsGenerator.canGenerate(),
      // isGenerating: this.eventManager.optionsGenerator.isGenerating
    };
  }

  /**
   * 清理扩展
   */
  cleanup() {
    // this.eventManager.cleanup();
    logger.log('AI助手扩展已清理');
  }
}

// 创建并初始化扩展实例
const extension = new AIAssistantExtension();

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    extension.initialize();
  });
} else {
  extension.initialize();
}

// 设置全局变量（供SillyTavern使用）
window.AIAssistantExtension = extension; 