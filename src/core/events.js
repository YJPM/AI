import { logger } from './logger.js';

/**
 * 事件管理器
 */
export class EventManager {
    constructor() {
        this.eventSource = null;
        this.eventTypes = null;
        this.listeners = new Map();
    }

    /**
     * 初始化事件管理器
     */
    init(eventSource, eventTypes) {
        this.eventSource = eventSource;
        this.eventTypes = eventTypes;
        logger.log('事件管理器已初始化');
    }

    /**
     * 添加事件监听器
     */
    on(eventType, handler, options = {}) {
        if (!this.eventSource) {
            logger.error('事件源未初始化');
            return;
        }

        this.eventSource.on(eventType, handler);
        
        // 记录监听器以便后续管理
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push({ handler, options });
        
        logger.debug(`已添加事件监听器: ${eventType}`);
    }

    /**
     * 移除事件监听器
     */
    off(eventType, handler) {
        if (!this.eventSource) {
            return;
        }

        this.eventSource.off(eventType, handler);
        
        // 从记录中移除
        if (this.listeners.has(eventType)) {
            const listeners = this.listeners.get(eventType);
            const index = listeners.findIndex(l => l.handler === handler);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
        
        logger.debug(`已移除事件监听器: ${eventType}`);
    }

    /**
     * 移除所有事件监听器
     */
    removeAllListeners() {
        if (!this.eventSource) {
            return;
        }

        for (const [eventType, listeners] of this.listeners) {
            for (const { handler } of listeners) {
                this.eventSource.off(eventType, handler);
            }
        }
        
        this.listeners.clear();
        logger.log('已移除所有事件监听器');
    }

    /**
     * 获取事件类型
     */
    getEventTypes() {
        return this.eventTypes;
    }

    /**
     * 检查事件源是否可用
     */
    isReady() {
        return this.eventSource && this.eventTypes;
    }
}

// 创建全局事件管理器实例
export const eventManager = new EventManager(); 