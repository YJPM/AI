/**
 * 设置管理类
 */
import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class SettingsManager {
  constructor() {
    this.settings = null;
    this.extensionSettings = null;
  }

  /**
   * 获取扩展设置
   * @returns {Object} 设置对象
   */
  getSettings() {
    if (this.settings === null) {
      this.loadSettings();
    }
    return this.settings;
  }

  /**
   * 加载设置
   */
  loadSettings() {
    try {
      // 获取SillyTavern的扩展设置
      if (window.extension_settings && window.extension_settings[CONFIG.MODULE_NAME]) {
        this.extensionSettings = window.extension_settings[CONFIG.MODULE_NAME];
      } else {
        this.extensionSettings = {};
      }

      // 合并默认设置
      this.settings = { ...CONFIG.DEFAULT_SETTINGS };
      for (const key in CONFIG.DEFAULT_SETTINGS) {
        if (this.extensionSettings[key] !== undefined) {
          this.settings[key] = this.extensionSettings[key];
        }
      }

      logger.log('设置加载完成:', this.settings);
    } catch (error) {
      logger.error('加载设置失败:', error);
      this.settings = { ...CONFIG.DEFAULT_SETTINGS };
    }
  }

  /**
   * 保存设置
   * @param {Object} newSettings 新设置
   */
  saveSettings(newSettings = null) {
    try {
      if (newSettings) {
        this.settings = { ...this.settings, ...newSettings };
      }

      // 保存到SillyTavern
      if (window.extension_settings) {
        window.extension_settings[CONFIG.MODULE_NAME] = { ...this.settings };
      }

      // 触发保存事件
      if (window.saveSettingsDebounced) {
        window.saveSettingsDebounced();
      }

      logger.log('设置保存完成:', this.settings);
    } catch (error) {
      logger.error('保存设置失败:', error);
    }
  }

  /**
   * 更新单个设置项
   * @param {string} key 设置键
   * @param {any} value 设置值
   */
  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings();
  }

  /**
   * 获取单个设置项
   * @param {string} key 设置键
   * @param {any} defaultValue 默认值
   * @returns {any}
   */
  getSetting(key, defaultValue = null) {
    return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }

  /**
   * 重置设置到默认值
   */
  resetSettings() {
    this.settings = { ...CONFIG.DEFAULT_SETTINGS };
    this.saveSettings();
    logger.log('设置已重置为默认值');
  }

  /**
   * 验证设置
   * @returns {Object} 验证结果
   */
  validateSettings() {
    const errors = [];
    const warnings = [];

    // 检查必要设置
    if (!this.settings.optionsApiKey && this.settings.optionsGenEnabled) {
      errors.push('启用选项生成功能需要设置API密钥');
    }

    if (!this.settings.optionsApiModel) {
      errors.push('需要设置API模型');
    }

    if (this.settings.optionsApiType === 'openai' && !this.settings.optionsBaseUrl) {
      errors.push('OpenAI类型需要设置基础URL');
    }

    // 检查可选设置
    if (this.settings.debug) {
      warnings.push('调试模式已启用，可能影响性能');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
} 