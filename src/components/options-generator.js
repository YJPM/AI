/**
 * 选项生成器组件
 */
import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { APIManager } from '../core/api-manager.js';
import { ContextManager } from '../core/context-manager.js';
import { SettingsManager } from '../core/settings.js';
import { UIManager } from './ui-manager.js';

export class OptionsGenerator {
  constructor() {
    this.apiManager = new APIManager();
    this.contextManager = new ContextManager();
    this.settingsManager = new SettingsManager();
    this.uiManager = new UIManager();
    
    this.isGenerating = false;
    this.isManuallyStopped = false;
  }

  /**
   * 生成选项
   */
  async generateOptions() {
    if (this.isGenerating) {
      logger.log('已在生成选项，跳过本次请求。');
      return;
    }

    // 重置手动中止标志
    this.isManuallyStopped = false;

    const settings = this.settingsManager.getSettings();
    if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
      logger.log('选项生成功能未启用或API密钥未设置');
      return;
    }

    this.uiManager.showGeneratingUI('AI助手思考中');
    this.isGenerating = true;

    try {
      const apiContext = this.contextManager.getContextForAPI();
      if (apiContext.length === 0) {
        throw new Error('无法获取聊天上下文');
      }

      // 处理模板
      const processedTemplate = this.contextManager.processTemplate(settings.optionsTemplate);

      const finalMessages = [
        ...apiContext,
        { role: 'user', content: processedTemplate }
      ];

      // 调用API生成选项
      const content = await this.apiManager.generateOptions(
        finalMessages, 
        processedTemplate, 
        settings
      );

      // 解析选项
      const options = this.parseOptions(content);
      logger.log('解析出的选项:', options);
      
      // 显示选项
      this.uiManager.displayOptions(options);
    } catch (error) {
      logger.error('生成选项失败:', error);
      this.uiManager.showGeneratingUI(`生成失败: ${error.message}`, 5000);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * 解析选项内容
   * @param {string} content API返回的内容
   * @returns {Array} 解析出的选项数组
   */
  parseOptions(content) {
    // 1. 优先尝试解析【...】格式
    let options = (content.match(/【(.*?)】/g) || []).map(m => 
      m.replace(/[【】]/g, '').trim()
    );
    
    if (options.length > 0) {
      logger.log('使用【】格式解析器成功。');
      return options.filter(Boolean);
    }

    // 2. 如果失败，尝试解析列表格式 (e.g., "- ...", "1. ...")
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const listRegex = /^(?:\*|-\s|\d+\.\s)\s*(.*)/;
    options = lines.map(line => {
      const match = line.trim().match(listRegex);
      return match ? match[1].trim() : null;
    }).filter(Boolean);

    if (options.length > 0) {
      logger.log('使用列表格式解析器成功。');
      return options;
    }

    logger.log('所有解析器都未能找到选项。');
    return [];
  }

  /**
   * 设置手动中止标志
   * @param {boolean} stopped 是否手动中止
   */
  setManuallyStopped(stopped) {
    this.isManuallyStopped = stopped;
    logger.log(`手动中止标志设置为: ${stopped}`);
  }

  /**
   * 检查是否可以生成选项
   * @returns {boolean} 是否可以生成
   */
  canGenerate() {
    const settings = this.settingsManager.getSettings();
    return settings.optionsGenEnabled && 
           settings.optionsApiKey && 
           !this.isGenerating;
  }

  /**
   * 检查最后一条消息是否为AI消息
   * @returns {boolean} 是否为AI消息
   */
  isLastMessageFromAI() {
    return this.contextManager.isLastMessageFromAI();
  }
} 