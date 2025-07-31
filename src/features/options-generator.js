import { logger } from '../core/logger.js';
import { getSettings } from '../core/settings.js';
import { DOMUtils } from '../utils/dom-utils.js';
import { apiClient } from '../utils/api-client.js';

/**
 * 选项生成器类
 */
export class OptionsGenerator {
    constructor() {
        this.isGenerating = false;
        this.isManuallyStopped = false;
        this.settings = getSettings();
    }

    /**
     * 生成选项
     */
    async generateOptions() {
        if (this.isGenerating) {
            logger.log('已在生成选项，跳过本次请求。');
            return;
        }

        // 重置手动中止标志，确保每次生成都是新的判断
        this.isManuallyStopped = false;

        this.settings = getSettings();
        if (!this.settings.optionsGenEnabled || !this.settings.optionsApiKey) {
            logger.log('选项生成功能未启用或API密钥未设置');
            return;
        }

        this.showGeneratingUI('AI助手思考中');
        this.isGenerating = true;

        try {
            const apiContext = DOMUtils.getChatContext();
            if (apiContext.length === 0) {
                throw new Error('无法获取聊天上下文');
            }

            // 获取当前用户输入
            const userInput = DOMUtils.getUserInput();
            
            // 替换模板中的占位符
            let processedTemplate = this.settings.optionsTemplate
                .replace(/{{context}}/g, '对话历史已在上方消息中提供')
                .replace(/{{user_input}}/g, userInput || '用户当前输入')
                .replace(/{{char_card}}/g, DOMUtils.getCharacterCard() || '角色信息')
                .replace(/{{world_info}}/g, DOMUtils.getWorldInfo() || '世界设定信息');

            const finalMessages = [
                ...apiContext,
                { role: 'user', content: processedTemplate }
            ];

            const content = await apiClient.generateOptions(finalMessages);
            const options = apiClient.parseOptions(content);
            logger.log('解析出的选项:', options);
            this.displayOptions(options);
        } catch (error) {
            logger.error('生成选项失败:', error);
            this.showGeneratingUI(`生成失败: ${error.message}`, 5000);
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 显示生成中UI
     */
    showGeneratingUI(message, duration = null) {
        logger.log(`showGeneratingUI: 尝试显示提示: "${message}"`);
        let container = document.getElementById('ti-loading-container');
        const chat = document.getElementById('chat');
        if (!chat) {
            logger.log('showGeneratingUI: chat 未找到，无法显示。');
            return;
        }

        if (!container) {
            logger.log('showGeneratingUI: 未找到现有容器，创建新容器。');
            container = document.createElement('div');
            container.id = 'ti-loading-container';
            container.classList.add('typing_indicator');
            chat.appendChild(container);
            logger.log('showGeneratingUI: 容器已附加到 chat。');
        } else {
            logger.log('showGeneratingUI: 找到现有容器，更新内容并尝试显示。');
        }

        // 统一内容结构，使其与 showTypingIndicator 完全一致 (文本 + 省略号动画)
        const animationHtml = getSettings().animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                <div class="typing-indicator-text">${message}</div>
                ${animationHtml}
            </div>
        `;
        container.style.display = 'flex';
        logger.log(`showGeneratingUI: 最终容器 display 属性: ${container.style.display}`);

        if (duration) {
            logger.log(`showGeneratingUI: 将在 ${duration}ms 后隐藏提示。`);
            setTimeout(() => this.hideGeneratingUI(), duration);
        }
    }

    /**
     * 隐藏生成中UI
     */
    hideGeneratingUI() {
        const loadingContainer = document.getElementById('ti-loading-container');
        if (loadingContainer) {
            logger.log('hideGeneratingUI: 隐藏提示。');
            loadingContainer.style.display = 'none';
        }
    }

    /**
     * 显示选项
     */
    async displayOptions(options) {
        this.hideGeneratingUI();
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) oldContainer.remove();

        const sendForm = document.getElementById('send_form');
        if (!sendForm || !options || options.length === 0) {
            if (!options || options.length === 0) {
                this.showGeneratingUI('未能生成有效选项', 3000);
            }
            return;
        }

        const container = document.createElement('div');
        container.id = 'ti-options-container';
        sendForm.insertAdjacentElement('beforebegin', container);

        const sleep = ms => new Promise(res => setTimeout(res, ms));

        for (const text of options) {
            const btn = document.createElement('button');
            btn.className = 'qr--button menu_button interactable ti-options-capsule';
            container.appendChild(btn);

            for (let i = 0; i < text.length; i++) {
                btn.textContent = text.substring(0, i + 1);
                await sleep(15);
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
        }
    }

    /**
     * 设置手动中止标志
     */
    setManuallyStopped(value) {
        this.isManuallyStopped = value;
    }

    /**
     * 检查是否正在生成
     */
    isCurrentlyGenerating() {
        return this.isGenerating;
    }

    /**
     * 检查是否手动中止
     */
    isManuallyStopped() {
        return this.isManuallyStopped;
    }
}

// 创建全局选项生成器实例
export const optionsGenerator = new OptionsGenerator(); 