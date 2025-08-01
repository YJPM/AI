import { getSettings, defaultSettings } from './settings.js';
import { logger } from './logger.js';
import { selected_group } from '../../../group-chats.js';
import { isStreamingEnabled } from '../../../../script.js';

export function showTypingIndicator(type, _args, dryRun) {
    const settings = getSettings();
    const legacyIndicatorTemplate = document.getElementById('typing_indicator_template');
    const noIndicatorTypes = ['quiet', 'impersonate'];
    if (type !== 'refresh' && (noIndicatorTypes.includes(type) || dryRun)) return;
    if (!settings.enabled) return;
    if (settings.showCharName && !window.name2 && type !== 'refresh') return;
    // 移除对isStreamingEnabled的检查，确保在所有情况下都能显示打字指示器
    // if (legacyIndicatorTemplate && selected_group && !isStreamingEnabled()) return;
    const placeholder = '{char}';
    let finalText = settings.customText || defaultSettings.customText;
    if (settings.showCharName && window.name2) {
        if (finalText.includes(placeholder)) {
            finalText = finalText.replace(placeholder, window.name2);
        } else {
            finalText = `${window.name2}${finalText}`;
        }
    } else {
        finalText = finalText.replace(placeholder, '').replace(/  +/g, ' ').trim();
    }
    const animationHtml = settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
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
        const chat = document.getElementById('chat');
        if (chat) {
            const wasChatScrolledDown = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 5;
            chat.appendChild(typingIndicator);
            logger.log('showTypingIndicator: 指示器已附加到 chat。');
            if (wasChatScrolledDown) {
                chat.scrollTop = chat.scrollHeight;
                logger.log('showTypingIndicator: 聊天已自动滚动到底部。');
            }
        }
    }
    logger.log(`showTypingIndicator: 最终指示器 display 属性 (由CSS控制，JS不强制): ${typingIndicator.style.display}`);
}

export function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing_indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

export function isLastMessageFromAI() {
    logger.log('检查最后一条消息 (last_mes 属性模式)...');
    try {
        const lastMessage = document.querySelector('#chat .last_mes');
        if (!lastMessage) {
            logger.log('未找到 .last_mes 元素，判定为非AI。');
            return false;
        }
        const isUser = lastMessage.getAttribute('is_user');
        logger.log(`找到 .last_mes 元素。is_user 属性为: "${isUser}".`);
        const isBot = isUser === 'false';
        logger.log(`结论: ${isBot ? '是' : '不是'} AI消息。`);
        return isBot;
    } catch (error) {
        logger.error('通过 .last_mes 检查最后一条消息时出错:', error);
        return false;
    }
}