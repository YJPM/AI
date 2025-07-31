import { MODULE } from './constants.js';
import { getSettings } from './settings.js';

/**
 * 日志记录器
 */
export const logger = {
    log: (...args) => {
        if (getSettings().debug) {
            console.log(`[${MODULE}]`, ...args);
        }
    },
    error: (...args) => {
        console.error(`[${MODULE}]`, ...args);
    },
    warn: (...args) => {
        console.warn(`[${MODULE}]`, ...args);
    },
    info: (...args) => {
        if (getSettings().debug) {
            console.info(`[${MODULE}]`, ...args);
        }
    },
}; 