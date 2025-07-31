import { logger } from '../core/logger.js';

/**
 * 样式管理器
 */
export class StyleManager {
    constructor() {
        this.styleTags = new Map();
    }

    /**
     * 注入全局样式
     */
    injectGlobalStyles() {
        const css = `
            /* 核心指示器样式修复 */
            #typing_indicator.typing_indicator {
                opacity: 1 !important; /* 强制覆盖主机应用可能存在的透明度样式，以修复不透明CSS仍然半透明的问题。 */
                background-color: transparent !important; /* 强制透明背景 */
            }

            /* 确保所有提示容器都是透明背景 */
            .typing_indicator {
                background-color: transparent !important;
            }

            /* 省略号动画 */
            /* 恢复省略号显示 */
            .typing-ellipsis::after {
                display: inline-block;
                animation: ellipsis-animation 1.4s infinite;
                content: '.';
                width: 1.2em; /* 预留足够空间防止布局抖动 */
                text-align: left;
                vertical-align: bottom;
            }
            @keyframes ellipsis-animation {
                0% { content: '.'; }
                33% { content: '..'; }
                66%, 100% { content: '...'; }
            }

            /* 移除提示文字渐变样式，恢复为普通文本 */
            .typing-indicator-text {
                font-weight: normal; /* 恢复正常字体粗细 */
                background: none; /* 移除背景 */
                -webkit-background-clip: unset; /* 移除裁剪 */
                background-clip: unset;
                -webkit-text-fill-color: unset; /* 恢复文本颜色 */
                display: inline; /* 恢复默认行内显示 */
                animation: none; /* 移除动画 */
                color: var(--text_color); /* 确保文字颜色正常 */
            }

            /* 选项按钮样式 */
            #ti-options-container {
                width: 100%;
                padding: 8px 0;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
            }
            .ti-options-capsule {
                flex: 1;
                white-space: normal;
                text-align: center;
                margin: 0 !important;
                height: auto;
                min-width: 120px;
            }
        `;

        this.injectStyle('typing-indicator-global-style', css);
        logger.log('全局样式已注入');
    }

    /**
     * 应用基本样式
     */
    applyBasicStyle() {
        const css = `
            .typing_indicator {
                background-color: transparent; /* 恢复透明背景 */
                padding: 8px 16px;
                margin: 8px auto;
                width: fit-content;
                max-width: 90%;
                text-align: center;
                color: var(--text_color); /* 使用主题的默认文字颜色 */
            }
        `;

        this.injectStyle('typing-indicator-theme-style', css);
        logger.log('基本样式已应用');
    }

    /**
     * 注入样式标签
     */
    injectStyle(id, css) {
        let styleTag = document.getElementById(id);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = id;
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = css;
        this.styleTags.set(id, styleTag);
    }

    /**
     * 移除样式标签
     */
    removeStyle(id) {
        const styleTag = this.styleTags.get(id);
        if (styleTag) {
            styleTag.remove();
            this.styleTags.delete(id);
        }
    }

    /**
     * 移除所有样式
     */
    removeAllStyles() {
        for (const [id] of this.styleTags) {
            this.removeStyle(id);
        }
        logger.log('所有样式已移除');
    }

    /**
     * 获取样式标签
     */
    getStyleTag(id) {
        return this.styleTags.get(id);
    }
}

// 创建全局样式管理器实例
export const styleManager = new StyleManager(); 