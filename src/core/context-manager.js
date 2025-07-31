/**
 * 上下文管理类
 */
import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class ContextManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * 获取用户当前输入
   * @returns {string} 用户输入
   */
  getUserInput() {
    try {
      const textarea = document.querySelector(CONFIG.SELECTORS.SEND_TEXTAREA);
      return textarea ? textarea.value.trim() : '';
    } catch (error) {
      logger.error('获取用户输入失败:', error);
      return '';
    }
  }

  /**
   * 获取角色卡信息
   * @returns {string} 角色信息
   */
  getCharacterCard() {
    try {
      if (typeof window.getCharacters === 'function') {
        const characters = window.getCharacters();
        const currentCharId = window.characterId;
        if (characters && currentCharId) {
          const character = characters.find(c => c.avatar === currentCharId);
          return character ? character.description || character.name : '';
        }
      }
      return '';
    } catch (error) {
      logger.error('获取角色卡信息失败:', error);
      return '';
    }
  }

  /**
   * 获取世界设定信息
   * @returns {string} 世界设定信息
   */
  getWorldInfo() {
    try {
      if (typeof window.getLorebooks === 'function') {
        const lorebooks = window.getLorebooks();
        if (lorebooks && lorebooks.length > 0) {
          return lorebooks.map(lb => 
            lb.entries?.map(entry => entry.content).join('\n')
          ).join('\n\n');
        }
      }
      return '';
    } catch (error) {
      logger.error('获取世界设定信息失败:', error);
      return '';
    }
  }

  /**
   * 检查最后一条消息是否来自AI
   * @returns {boolean} 是否为AI消息
   */
  isLastMessageFromAI() {
    logger.log('检查最后一条消息 (last_mes 属性模式)...');
    try {
      const lastMessage = document.querySelector(CONFIG.SELECTORS.LAST_MESSAGE);
      if (!lastMessage) {
        logger.log('未找到 .last_mes 元素，判定为非AI。');
        return false;
      }

      const isUser = lastMessage.getAttribute('is_user');
      logger.log(`找到 .last_mes 元素。is_user 属性为: "${isUser}".`);

      // 属性值是字符串 "false"，不是布尔值
      const isBot = isUser === 'false';
      logger.log(`结论: ${isBot ? '是' : '不是'} AI消息。`);
      return isBot;
    } catch (error) {
      logger.error('通过 .last_mes 检查最后一条消息时出错:', error);
      return false;
    }
  }

  /**
   * 获取API上下文
   * @returns {Array} 消息数组
   */
  getContextForAPI() {
    logger.log('从DOM获取API上下文 (属性模式, 增强日志)...');
    try {
      const messageElements = document.querySelectorAll(CONFIG.SELECTORS.MESSAGE_ELEMENTS);
      const messages = [];
      logger.log(`发现 ${messageElements.length} 个 .mes 元素。开始遍历...`);

      messageElements.forEach((el, index) => {
        const contentEl = el.querySelector(CONFIG.SELECTORS.MESSAGE_TEXT);
        if (contentEl) {
          let role = 'system'; // 默认角色
          const isUserAttr = el.getAttribute('is_user');
          
          if (isUserAttr === 'true') {
            role = 'user';
          } else if (isUserAttr === 'false') {
            role = 'assistant';
          }

          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = contentEl.innerHTML.replace(/<br\s*\/?>/gi, '\n');
          const content = (tempDiv.textContent || tempDiv.innerText || '').trim();

          if (content) {
            // 只包括用户和助手的消息
            if (role === 'user' || role === 'assistant') {
              const messageData = { role, content };
              messages.push(messageData);
              logger.log(`[消息 ${index}] -> 有效 (${role}):`, messageData);
            } else {
              logger.log(`[消息 ${index}] -> 跳过 (系统消息)`);
            }
          } else {
            logger.log(`[消息 ${index}] -> 跳过 (无内容)`);
          }
        } else {
           logger.log(`[消息 ${index}] -> 跳过 (无 .mes_text 子元素)`);
        }
      });
      
      logger.log(`从DOM中提取了 ${messages.length} 条有效对话消息。`);
      const finalMessages = messages.slice(-20); // 限制上下文长度
      logger.log('最终用于API的上下文:', finalMessages);
      return finalMessages;
    } catch (error) {
      logger.error('从DOM获取API上下文失败:', error);
      return [];
    }
  }

  /**
   * 处理模板占位符
   * @param {string} template 原始模板
   * @returns {string} 处理后的模板
   */
  processTemplate(template) {
    try {
      const userInput = this.getUserInput();
      const characterCard = this.getCharacterCard();
      const worldInfo = this.getWorldInfo();

      return template
        .replace(/{{context}}/g, '对话历史已在上方消息中提供')
        .replace(/{{user_input}}/g, userInput || '用户当前输入')
        .replace(/{{char_card}}/g, characterCard || '角色信息')
        .replace(/{{world_info}}/g, worldInfo || '世界设定信息');
    } catch (error) {
      logger.error('处理模板占位符失败:', error);
      return template;
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    logger.log('上下文缓存已清除');
  }
} 