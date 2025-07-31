/**
 * 文本解析工具函数
 */

/**
 * 解析选项文本，提取【】中的选项
 * @param {string} content - 包含选项的文本
 * @returns {string[]} 选项数组
 */
export function parseOptions(content) {
    if (!content || typeof content !== 'string') {
        return [];
    }

    // 匹配【】中的内容
    const optionRegex = /【([^】]+)】/g;
    const options = [];
    let match;

    while ((match = optionRegex.exec(content)) !== null) {
        const option = match[1].trim();
        if (option && !options.includes(option)) {
            options.push(option);
        }
    }

    return options;
}

/**
 * 模板变量替换
 * @param {string} template - 模板字符串
 * @param {Object} variables - 变量对象
 * @returns {string} 替换后的字符串
 */
export function replaceTemplateVariables(template, variables) {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), value || '');
    });
    
    return result;
}

/**
 * 截断文本到指定长度
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 清理HTML标签
 * @param {string} html - HTML字符串
 * @returns {string} 清理后的纯文本
 */
export function stripHtmlTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
} 