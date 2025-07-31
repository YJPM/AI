// 日志工具
export const logger = {
    log: (...args) => {
        // 这里假设 getSettings() 可用，实际使用时请根据项目结构调整
        try {
            if (typeof getSettings === 'function' && getSettings().debug) {
                console.log('[typing_indicator]', ...args);
            }
        } catch {}
    },
    error: (...args) => {
        console.error('[typing_indicator]', ...args);
    },
};