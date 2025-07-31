import { getSettings } from '@core/settings.js';
import { logger } from '@core/logger.js';
import { createElement, safeRemoveElement, injectCSS } from '@utils/dom-helpers.js';

/**
 * 打字指示器类
 */
export class TypingIndicator {
    constructor() {
        this.isVisible = false;
        this.legacyIndicatorTemplate = document.getElementById('typing_indicator_template');
        this.injectStyles();
    }

    /**
     * 注入样式
     */
    injectStyles() {
        const css = `
            .typing_indicator {
                background-color: transparent;
                padding: 8px 16px;
                margin: 8px auto;
                width: fit-content;
                max-width: 90%;
                text-align: center;
                color: var(--text_color);
                opacity: 1 !important;
            }

            .typing-ellipsis {
                display: inline-block;
                animation: typing-dots 1.5s infinite;
            }

            @keyframes typing-dots {
                0%, 20% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 0; }
            }

            .typing-ellipsis::after {
                content: '...';
                animation: typing-dots 1.5s infinite;
            }
        `;
        injectCSS(css, 'typing-indicator-styles');
    }

    /**
     * 显示打字指示器
     * @param {string} type - 指示器类型
     * @param {Object} args - 参数
     * @param {boolean} dryRun - 是否仅预览
     */
    show(type, args = {}, dryRun = false) {
        const settings = getSettings();
        
        if (!settings.enabled) {
            return;
        }

        if (settings.showCharName && !name2 && type !== 'refresh') {
            return;
        }

        if (dryRun) {
            return;
        }

        this.hide();

        let finalText = settings.customText || '正在输入';
        
        if (settings.showCharName && name2) {
            finalText = `${name2} ${finalText}`;
        }

        const animationHtml = settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : '';

        const indicatorHtml = `
            <div id="typing_indicator" class="typing_indicator">
                <div class="typing_indicator_text">${finalText}</div>
                ${animationHtml}
            </div>
        `;

        const chatContainer = document.querySelector('#chat, .chat');
        if (chatContainer) {
            chatContainer.insertAdjacentHTML('beforeend', indicatorHtml);
            this.isVisible = true;
            logger.log('打字指示器已显示');
        }
    }

    /**
     * 隐藏打字指示器
     */
    hide() {
        const indicator = document.getElementById('typing_indicator');
        if (indicator) {
            safeRemoveElement(indicator);
            this.isVisible = false;
            logger.log('打字指示器已隐藏');
        }
    }

    /**
     * 检查是否可见
     * @returns {boolean}
     */
    isVisible() {
        return this.isVisible;
    }
} 