/**
 * DOM操作工具函数
 */

/**
 * 创建元素并设置属性
 * @param {string} tagName - 标签名
 * @param {Object} attributes - 属性对象
 * @param {string} textContent - 文本内容
 * @returns {HTMLElement}
 */
export function createElement(tagName, attributes = {}, textContent = '') {
    const element = document.createElement(tagName);
    
    // 设置属性
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // 设置文本内容
    if (textContent) {
        element.textContent = textContent;
    }
    
    return element;
}

/**
 * 安全地移除元素
 * @param {HTMLElement} element - 要移除的元素
 */
export function safeRemoveElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

/**
 * 查找元素，如果不存在则创建
 * @param {string} id - 元素ID
 * @param {string} tagName - 标签名
 * @param {Object} attributes - 属性对象
 * @returns {HTMLElement}
 */
export function findOrCreateElement(id, tagName = 'div', attributes = {}) {
    let element = document.getElementById(id);
    if (!element) {
        element = createElement(tagName, { id, ...attributes });
    }
    return element;
}

/**
 * 添加CSS样式到页面
 * @param {string} css - CSS样式字符串
 * @param {string} id - 样式标签ID
 */
export function injectCSS(css, id) {
    let styleTag = document.getElementById(id);
    if (!styleTag) {
        styleTag = createElement('style', { id });
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
} 