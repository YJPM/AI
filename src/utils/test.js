/**
 * 测试工具类
 */
import { logger } from './logger.js';
import { CONFIG } from '../config/constants.js';

export class TestUtils {
  constructor() {
    this.tests = [];
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    logger.log('开始运行测试...');
    
    const results = {
      passed: 0,
      failed: 0,
      total: 0
    };

    for (const test of this.tests) {
      try {
        await test.fn();
        logger.log(`✅ ${test.name} - 通过`);
        results.passed++;
      } catch (error) {
        logger.error(`❌ ${test.name} - 失败:`, error);
        results.failed++;
      }
      results.total++;
    }

    logger.log(`测试完成: ${results.passed}/${results.total} 通过`);
    return results;
  }

  /**
   * 添加测试
   * @param {string} name 测试名称
   * @param {Function} fn 测试函数
   */
  addTest(name, fn) {
    this.tests.push({ name, fn });
  }

  /**
   * 测试配置加载
   */
  testConfig() {
    this.addTest('配置常量测试', () => {
      if (!CONFIG.EXTENSION_NAME) throw new Error('扩展名称未定义');
      if (!CONFIG.DEFAULT_SETTINGS) throw new Error('默认设置未定义');
      if (!CONFIG.EVENTS) throw new Error('事件类型未定义');
      if (!CONFIG.CSS_CLASSES) throw new Error('CSS类名未定义');
      if (!CONFIG.SELECTORS) throw new Error('DOM选择器未定义');
    });
  }

  /**
   * 测试设置管理
   */
  testSettings() {
    this.addTest('设置管理测试', () => {
      // 这里可以添加设置管理的测试
      // 由于需要SillyTavern环境，暂时跳过
    });
  }

  /**
   * 测试API管理
   */
  testAPI() {
    this.addTest('API配置测试', () => {
      if (!CONFIG.API_ENDPOINTS.openai) throw new Error('OpenAI端点未定义');
      if (!CONFIG.API_ENDPOINTS.gemini) throw new Error('Gemini端点未定义');
    });
  }

  /**
   * 测试UI管理
   */
  testUI() {
    this.addTest('UI配置测试', () => {
      if (!CONFIG.UI.ANIMATION_DURATION) throw new Error('动画时长未定义');
      if (!CONFIG.UI.TYPING_SPEED) throw new Error('打字速度未定义');
    });
  }

  /**
   * 测试模板系统
   */
  testTemplate() {
    this.addTest('模板系统测试', () => {
      const template = CONFIG.DEFAULT_SETTINGS.optionsTemplate;
      if (!template.includes('{{user_input}}')) throw new Error('用户输入占位符缺失');
      if (!template.includes('{{char_card}}')) throw new Error('角色卡占位符缺失');
      if (!template.includes('{{world_info}}')) throw new Error('世界设定占位符缺失');
      if (!template.includes('{{context}}')) throw new Error('上下文占位符缺失');
    });
  }

  /**
   * 测试DOM选择器
   */
  testSelectors() {
    this.addTest('DOM选择器测试', () => {
      const selectors = CONFIG.SELECTORS;
      if (!selectors.CHAT) throw new Error('聊天容器选择器未定义');
      if (!selectors.SEND_FORM) throw new Error('发送表单选择器未定义');
      if (!selectors.SEND_TEXTAREA) throw new Error('发送文本框选择器未定义');
      if (!selectors.LAST_MESSAGE) throw new Error('最后消息选择器未定义');
    });
  }

  /**
   * 测试CSS类名
   */
  testCSSClasses() {
    this.addTest('CSS类名测试', () => {
      const classes = CONFIG.CSS_CLASSES;
      if (!classes.TYPING_INDICATOR) throw new Error('打字指示器类名未定义');
      if (!classes.OPTIONS_CONTAINER) throw new Error('选项容器类名未定义');
      if (!classes.OPTIONS_CAPSULE) throw new Error('选项胶囊类名未定义');
      if (!classes.LOADING_CONTAINER) throw new Error('加载容器类名未定义');
    });
  }

  /**
   * 运行基础测试
   */
  async runBasicTests() {
    this.testConfig();
    this.testAPI();
    this.testUI();
    this.testTemplate();
    this.testSelectors();
    this.testCSSClasses();
    
    return await this.runAllTests();
  }
}

// 创建测试实例
export const testUtils = new TestUtils();

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  window.testUtils = testUtils;
} 