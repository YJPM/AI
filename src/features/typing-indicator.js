import { logger } from '../core/logger.js';
import { getSettings, defaultSettings } from '../core/settings.js';
import { DOMUtils } from '../utils/dom-utils.js';

/**
 * 打字指示器类
 */
export class TypingIndicator {
    constructor() {
        this.settings = getSettings();
        this.legacyIndicatorTemplate = document.getElementById('typing_indicator_template');
    }

    /**
     * 显示打字指示器
     */
    show(type, _args, dryRun) {
        this.settings = getSettings(); // 重新获取最新设置
        const noIndicatorTypes = ['quiet', 'impersonate'];

        if (type !== 'refresh' && (noIndicatorTypes.includes(type) || dryRun)) {
            return;
        }

        if (!this.settings.enabled) {
            return;
        }

        // 检查是否需要显示角色名称
        if (this.settings.showCharName && !window.name2 && type !== 'refresh') {
            return;
        }

        // 检查流式传输状态
        if (this.legacyIndicatorTemplate && window.selected_group && !window.isStreamingEnabled()) {
            return;
        }

        // 构建最终显示的文本
        const placeholder = '{char}';
        let finalText = this.settings.customText || defaultSettings.customText;

        if (this.settings.showCharName && window.name2) {
            if (finalText.includes(placeholder)) {
                finalText = finalText.replace(placeholder, window.name2);
            } else {
                finalText = `${window.name2}${finalText}`;
            }
        } else {
            finalText = finalText.replace(placeholder, '').replace(/  +/g, ' ').trim();
        }

        const animationHtml = this.settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
        const htmlContent = `
        <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
            <div class="typing-indicator-text">${finalText}</div>
            ${animationHtml}
        </div>
    `;

        let typingIndicator = document.getElementById('typing_indicator');
        if (typingIndicator) {
            logger.log('showTypingIndicator: 找到现有指示器，更新内容并尝试显示。');
            typingIndicator.innerHTML = htmlContent;
        } else {
            logger.log('showTypingIndicator: 未找到现有指示器，创建新指示器。');
            typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing_indicator';
            typingIndicator.classList.add('typing_indicator');
            typingIndicator.innerHTML = htmlContent;

            // 附加到聊天容器
            const chat = document.getElementById('chat');
            if (chat) {
                // 检查用户是否已滚动到底部（允许有几个像素的误差）
                const wasChatScrolledDown = DOMUtils.isAtBottom(5);

                chat.appendChild(typingIndicator);
                logger.log('showTypingIndicator: 指示器已附加到 chat。');

                // 如果用户在指示器出现前就位于底部，则自动滚动到底部以保持指示器可见
                if (wasChatScrolledDown) {
                    DOMUtils.scrollToBottom();
                    logger.log('showTypingIndicator: 聊天已自动滚动到底部。');
                }
            }
        }
        logger.log(`showTypingIndicator: 最终指示器 display 属性 (由CSS控制，JS不强制): ${typingIndicator.style.display}`);
    }

    /**
     * 隐藏打字指示器
     */
    hide() {
        const typingIndicator = document.getElementById('typing_indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// 创建全局打字指示器实例
export const typingIndicator = new TypingIndicator(); 