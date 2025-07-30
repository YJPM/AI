/**
 * AI导演 - 主入口文件
 */

import { AIDirectorUI } from './ui.js';

/**
 * 初始化AI导演功能
 */
function initAIDirector() {
    // 等待SillyTavern核心功能加载完成
    let retries = 0;
    const maxRetries = 100;
    
    const interval = setInterval(() => {
        const isReady = window.parent.jQuery && 
                        typeof TavernHelper !== 'undefined' && 
                        window.parent.document.getElementById('extensionsMenu');
        
        if (isReady) {
            clearInterval(interval);
            console.log('[AI导演] 开始初始化...');
            AIDirectorUI.init(window.parent.jQuery);
        } else if (++retries > maxRetries) {
            clearInterval(interval);
            console.error('[AI导演] 等待SillyTavern核心功能超时。');
        }
    }, 200);
}

// 启动AI导演
initAIDirector(); 