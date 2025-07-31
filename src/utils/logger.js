/**
 * 日志工具类
 */
import { CONFIG } from '../config/constants.js';

export class Logger {
  constructor() {
    this.module = CONFIG.MODULE_NAME;
  }

  /**
   * 记录普通日志
   * @param {...any} args 日志参数
   */
  log(...args) {
    if (this.isDebugEnabled()) {
      console.log(`[${this.module}]`, ...args);
    }
  }

  /**
   * 记录错误日志
   * @param {...any} args 错误参数
   */
  error(...args) {
    console.error(`[${this.module}]`, ...args);
  }

  /**
   * 记录警告日志
   * @param {...any} args 警告参数
   */
  warn(...args) {
    console.warn(`[${this.module}]`, ...args);
  }

  /**
   * 记录信息日志
   * @param {...any} args 信息参数
   */
  info(...args) {
    if (this.isDebugEnabled()) {
      console.info(`[${this.module}]`, ...args);
    }
  }

  /**
   * 检查是否启用调试模式
   * @returns {boolean}
   */
  isDebugEnabled() {
    try {
      const settings = window.getSettings?.() || {};
      return settings.debug === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 记录性能日志
   * @param {string} label 标签
   * @param {Function} fn 要执行的函数
   * @returns {Promise<any>}
   */
  async time(label, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.log(`${label} 完成，耗时: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} 失败，耗时: ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
}

// 创建全局日志实例
export const logger = new Logger(); 