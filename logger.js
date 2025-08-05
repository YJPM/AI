// 日志工具 - 优化版本
export const logger = {
    // 缓存设置状态，避免重复调用
    _debugEnabled: null,
    _lastCheck: 0,
    
    // 检查调试模式是否启用
    _isDebugEnabled: async () => {
        const now = Date.now();
        // 缓存5秒，避免频繁检查
        if (this._debugEnabled === null || now - this._lastCheck > 5000) {
            try {
                // 动态导入settings模块
                const { getSettings } = await import('./settings.js');
                this._debugEnabled = getSettings().debug;
                this._lastCheck = now;
            } catch (error) {
                // 如果无法获取设置，默认关闭调试
                this._debugEnabled = false;
                this._lastCheck = now;
            }
        }
        return this._debugEnabled;
    },
    
    log: async (...args) => {
        try {
            if (await logger._isDebugEnabled()) {
                console.log('[AI智能助手]', ...args);
            }
        } catch (error) {
            // 静默处理错误，避免影响主程序
        }
    },
    
    error: (...args) => {
        console.error('[AI智能助手]', ...args);
    },
    
    warn: (...args) => {
        console.warn('[AI智能助手]', ...args);
    },
    
    info: (...args) => {
        console.info('[AI智能助手]', ...args);
    }
};