/**
 * AI助手扩展 - 主入口文件
 * 
 * 功能：
 * - 打字指示器显示
 * - 智能回复选项生成
 * - 自动触发选项生成
 * - 设置管理
 */

// 导入依赖
import {
  name2,
  eventSource,
  event_types,
  isStreamingEnabled,
  saveSettingsDebounced,
} from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { selected_group } from '../../../group-chats.js';

// 导入核心模块
import { CONFIG } from './src/config/constants.js';
import { logger } from './src/utils/logger.js';
import { SettingsManager } from './src/core/settings.js';
import { EventManager } from './src/core/event-manager.js';
import { UIManager } from './src/components/ui-manager.js';

/**
 * AI助手扩展主类
 */
class AIAssistantExtension {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.eventManager = new EventManager();
    this.uiManager = new UIManager();
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
      this.uiManager.injectGlobalStyles();
      this.uiManager.applyBasicStyle();
      this.uiManager.createSettingsUI(this.settingsManager.getSettings());

      // 初始化事件管理器
      this.eventManager.initialize();

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
    // 设置全局变量
    window.name2 = name2;
    window.eventSource = eventSource;
    window.event_types = event_types;
    window.isStreamingEnabled = isStreamingEnabled;
    window.saveSettingsDebounced = saveSettingsDebounced;
    window.extension_settings = extension_settings;
    window.selected_group = selected_group;

    // 设置全局函数
    window.getSettings = () => this.settingsManager.getSettings();
    window.showTypingIndicator = (...args) => this.uiManager.showTypingIndicator(...args);
    window.hideTypingIndicator = () => this.uiManager.hideTypingIndicator();
    window.generateOptions = () => this.eventManager.optionsGenerator.generateOptions();
  }

  /**
   * 获取扩展状态
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      settings: this.settingsManager.getSettings(),
      canGenerate: this.eventManager.optionsGenerator.canGenerate(),
      isGenerating: this.eventManager.optionsGenerator.isGenerating
    };
  }

  /**
   * 清理扩展
   */
  cleanup() {
    this.eventManager.cleanup();
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

// 导出扩展实例（用于调试）
window.AIAssistantExtension = extension;

// 导出主要功能（向后兼容）
export {
  extension as default,
  extension as AIAssistantExtension
};
