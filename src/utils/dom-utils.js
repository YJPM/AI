import { logger } from '../core/logger.js';

/**
 * DOM工具类
 */
export class DOMUtils {
    /**
     * 获取元素，支持多种选择器
     */
    static getElement(selector, parent = document) {
        if (typeof selector === 'string') {
            return parent.querySelector(selector);
        }
        return selector;
    }

    /**
     * 获取多个元素
     */
    static getElements(selector, parent = document) {
        if (typeof selector === 'string') {
            return parent.querySelectorAll(selector);
        }
        return [selector];
    }

    /**
     * 创建元素
     */
    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // 设置属性
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('on')) {
                element[key] = value;
            } else {
                element.setAttribute(key, value);
            }
        });

        // 添加子元素
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    /**
     * 检查最后一条消息是否来自AI
     */
    static isLastMessageFromAI() {
        logger.log('检查最后一条消息 (last_mes 属性模式)...');
        try {
            const lastMessage = document.querySelector('#chat .last_mes');
            if (!lastMessage) {
                logger.log('未找到 .last_mes 元素，判定为非AI。');
                return false;
            }

            const isUser = lastMessage.getAttribute('is_user');
            logger.log(`找到 .last_mes 元素。is_user 属性为: "${isUser}".`);

            // The attribute value is a string "false", not a boolean.
            const isBot = isUser === 'false';
            logger.log(`结论: ${isBot ? '是' : '不是'} AI消息。`);
            return isBot;
        } catch (error) {
            logger.error('通过 .last_mes 检查最后一条消息时出错:', error);
            return false;
        }
    }

    /**
     * 获取聊天上下文
     */
    static getChatContext() {
        logger.log('从DOM获取API上下文 (属性模式, 增强日志)...');
        try {
            const messageElements = document.querySelectorAll('#chat .mes');
            const messages = [];
            logger.log(`发现 ${messageElements.length} 个 .mes 元素。开始遍历...`);

            messageElements.forEach((el, index) => {
                const contentEl = el.querySelector('.mes_text');
                if (contentEl) {
                    let role = 'system'; // Default role
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
            const finalMessages = messages.slice(-20);
            logger.log('最终用于API的上下文:', finalMessages);
            return finalMessages;
        } catch (error) {
            logger.error('从DOM获取API上下文失败:', error);
            return [];
        }
    }

    /**
     * 获取当前用户输入
     */
    static getUserInput() {
        const textarea = document.querySelector('#send_textarea, .send_textarea');
        return textarea ? textarea.value.trim() : '';
    }

    /**
     * 获取角色卡信息
     */
    static getCharacterCard() {
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
     */
    static getWorldInfo() {
        try {
            if (typeof window.getLorebooks === 'function') {
                const lorebooks = window.getLorebooks();
                if (lorebooks && lorebooks.length > 0) {
                    return lorebooks.map(lb => lb.entries?.map(entry => entry.content).join('\n')).join('\n\n');
                }
            }
            return '';
        } catch (error) {
            logger.error('获取世界设定信息失败:', error);
            return '';
        }
    }

    /**
     * 滚动到聊天底部
     */
    static scrollToBottom() {
        const chat = document.getElementById('chat');
        if (chat) {
            chat.scrollTop = chat.scrollHeight;
        }
    }

    /**
     * 检查是否在聊天底部
     */
    static isAtBottom(threshold = 5) {
        const chat = document.getElementById('chat');
        if (!chat) return false;
        
        return chat.scrollHeight - chat.scrollTop - chat.clientHeight < threshold;
    }
} 