import { getSettings } from '@core/settings.js';
import { logger } from '@core/logger.js';
import { API_TYPES } from '@core/constants.js';
import { createElement, safeRemoveElement } from '@utils/dom-helpers.js';
import { parseOptions, replaceTemplateVariables } from '@utils/text-parser.js';

/**
 * 选项生成器类
 */
export class OptionsGenerator {
    constructor() {
        this.isGenerating = false;
        this.isManuallyStopped = false;
    }

    /**
     * 获取用户输入
     * @returns {string}
     */
    getUserInput() {
        const textarea = document.querySelector('#send_textarea, .send_textarea');
        return textarea ? textarea.value : '';
    }

    /**
     * 获取角色卡片信息
     * @returns {string}
     */
    getCharacterCard() {
        if (selected_group && selected_group.avatar_url) {
            return `角色名称: ${selected_group.name || '未知'}`;
        }
        return '';
    }

    /**
     * 获取世界设定信息
     * @returns {string}
     */
    getWorldInfo() {
        const worldInfoElement = document.querySelector('#world_info, .world_info');
        return worldInfoElement ? worldInfoElement.textContent || '' : '';
    }

    /**
     * 获取对话上下文
     * @returns {string}
     */
    getContextForAPI() {
        const messages = [];
        const messageElements = document.querySelectorAll('.mes, .message');
        
        messageElements.forEach((element, index) => {
            const isUser = element.classList.contains('mes_user') || element.classList.contains('user');
            const isAI = element.classList.contains('mes_assistant') || element.classList.contains('assistant');
            
            if (isUser || isAI) {
                const textElement = element.querySelector('.mes_text, .text');
                const text = textElement ? textElement.textContent || '' : '';
                
                if (text.trim()) {
                    messages.push({
                        role: isUser ? 'user' : 'assistant',
                        content: text.trim()
                    });
                }
            }
        });

        // 只保留最近的10条消息
        return messages.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }

    /**
     * 转换消息格式为Gemini格式
     * @param {Array} messages - 消息数组
     * @returns {Array} Gemini格式的消息
     */
    transformMessagesForGemini(messages) {
        return messages.map(msg => ({
            parts: [{ text: msg.content }]
        }));
    }

    /**
     * 生成选项
     */
    async generateOptions() {
        const settings = getSettings();
        
        if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
            logger.log('选项生成已禁用或API密钥未设置');
            return;
        }

        if (this.isGenerating) {
            logger.log('选项生成正在进行中，跳过');
            return;
        }

        this.isGenerating = true;
        this.showGeneratingUI('正在生成选项...');

        try {
            const userInput = this.getUserInput();
            const charCard = this.getCharacterCard();
            const worldInfo = this.getWorldInfo();
            const context = this.getContextForAPI();

            const variables = {
                user_input: userInput,
                char_card: charCard,
                world_info: worldInfo,
                context: context
            };

            let processedTemplate = settings.optionsTemplate;
            Object.entries(variables).forEach(([key, value]) => {
                processedTemplate = processedTemplate.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
            });

            let response;
            if (settings.optionsApiType === API_TYPES.GEMINI) {
                response = await this.callGeminiAPI(processedTemplate);
            } else {
                response = await this.callOpenAIAPI(processedTemplate);
            }

            if (response) {
                const options = parseOptions(response);
                if (options.length > 0) {
                    await this.displayOptions(options);
                } else {
                    logger.warn('未能解析到有效选项');
                }
            }
        } catch (error) {
            logger.error('生成选项时出错:', error);
        } finally {
            this.isGenerating = false;
            this.hideGeneratingUI();
        }
    }

    /**
     * 调用Gemini API
     * @param {string} prompt - 提示文本
     * @returns {Promise<string>}
     */
    async callGeminiAPI(prompt) {
        const settings = getSettings();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.optionsApiModel}:generateContent?key=${settings.optionsApiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API错误: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    /**
     * 调用OpenAI API
     * @param {string} prompt - 提示文本
     * @returns {Promise<string>}
     */
    async callOpenAIAPI(prompt) {
        const settings = getSettings();
        const url = `${settings.optionsBaseUrl}/chat/completions`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.optionsApiKey}`
            },
            body: JSON.stringify({
                model: settings.optionsApiModel,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API错误: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    /**
     * 显示生成中UI
     * @param {string} message - 显示消息
     * @param {number} duration - 持续时间
     */
    showGeneratingUI(message, duration = null) {
        this.hideGeneratingUI();

        const container = createElement('div', {
            id: 'ti-generating-container',
            className: 'ti-generating-container'
        });

        const spinner = createElement('div', {
            className: 'ti-spinner'
        });

        const text = createElement('div', {
            className: 'ti-generating-text'
        }, message);

        container.appendChild(spinner);
        container.appendChild(text);

        const chatContainer = document.querySelector('#chat, .chat');
        if (chatContainer) {
            chatContainer.appendChild(container);
        }

        if (duration) {
            setTimeout(() => this.hideGeneratingUI(), duration);
        }
    }

    /**
     * 隐藏生成中UI
     */
    hideGeneratingUI() {
        const container = document.getElementById('ti-generating-container');
        if (container) {
            safeRemoveElement(container);
        }
    }

    /**
     * 显示选项
     * @param {string[]} options - 选项数组
     */
    async displayOptions(options) {
        this.hideOptions();

        const container = createElement('div', {
            id: 'ti-options-container',
            className: 'ti-options-container'
        });

        for (const text of options) {
            const btn = createElement('button', {
                className: 'qr--button menu_button interactable ti-options-capsule'
            });

            // 打字机效果
            for (let i = 0; i < text.length; i++) {
                btn.textContent = text.substring(0, i + 1);
                await this.sleep(15);
            }

            btn.onclick = () => {
                const textarea = document.querySelector('#send_textarea, .send_textarea');
                if (textarea) {
                    textarea.value = text;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.focus();
                }
                container.remove();
            };

            container.appendChild(btn);
        }

        const chatContainer = document.querySelector('#chat, .chat');
        if (chatContainer) {
            chatContainer.appendChild(container);
        }
    }

    /**
     * 隐藏选项
     */
    hideOptions() {
        const container = document.getElementById('ti-options-container');
        if (container) {
            safeRemoveElement(container);
        }
    }

    /**
     * 延时函数
     * @param {number} ms - 毫秒数
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 