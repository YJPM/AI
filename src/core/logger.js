import { getSettings, getModuleName } from './settings.js';

const MODULE = getModuleName();

/**
 * 日志记录器
 */
export const logger = {
    /**
     * 记录普通日志
     */
    log: (...args) => {
        if (getSettings().debug) {
            console.log(`[${MODULE}]`, ...args);
        }
    },

    /**
     * 记录错误日志
     */
    error: (...args) => {
        console.error(`[${MODULE}]`, ...args);
    },

    /**
     * 记录警告日志
     */
    warn: (...args) => {
        console.warn(`[${MODULE}]`, ...args);
    },

    /**
     * 记录信息日志
     */
    info: (...args) => {
        if (getSettings().debug) {
            console.info(`[${MODULE}]`, ...args);
        }
    },

    /**
     * 记录调试日志
     */
    debug: (...args) => {
        if (getSettings().debug) {
            console.debug(`[${MODULE}]`, ...args);
        }
    }
};

/**
 * 创建带前缀的日志记录器
 */
export function createLogger(prefix) {
    return {
        log: (...args) => logger.log(`[${prefix}]`, ...args),
        error: (...args) => logger.error(`[${prefix}]`, ...args),
        warn: (...args) => logger.warn(`[${prefix}]`, ...args),
        info: (...args) => logger.info(`[${prefix}]`, ...args),
        debug: (...args) => logger.debug(`[${prefix}]`, ...args)
    };
} 