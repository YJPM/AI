import { injectCSS } from '@utils/dom-helpers.js';

/**
 * 样式管理类
 */
export class StyleManager {
    constructor() {
        this.injectGlobalStyles();
        this.applyBasicStyle();
    }

    /**
     * 应用基本样式
     */
    applyBasicStyle() {
        let styleTag = document.getElementById('typing-indicator-theme-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'typing-indicator-theme-style';
            document.head.appendChild(styleTag);
        }

        // 恢复为原始透明背景样式，移除所有渐变、圆角和阴影
        styleTag.textContent = `
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
    }

    /**
     * 注入全局样式
     */
    injectGlobalStyles() {
        const css = `
            /* 核心指示器样式修复 */
            #typing_indicator.typing_indicator {
                opacity: 1 !important;
                background-color: transparent !important;
            }

            /* 选项容器样式 */
            .ti-options-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin: 10px 0;
                padding: 10px;
                background: var(--SmartThemeBlurple);
                border-radius: 8px;
                animation: fadeIn 0.3s ease-in;
            }

            .ti-options-capsule {
                background: var(--SmartThemeBlurple);
                color: white;
                border: 1px solid var(--border_color);
                border-radius: 20px;
                padding: 8px 16px;
                margin: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 200px;
            }

            .ti-options-capsule:hover {
                background: var(--SmartThemeBlurple);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }

            /* 生成中UI样式 */
            .ti-generating-container {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin: 10px 0;
                padding: 10px;
                background: var(--SmartThemeBlurple);
                border-radius: 8px;
                color: white;
            }

            .ti-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .ti-generating-text {
                font-size: 14px;
                font-weight: 500;
            }

            /* 动画 */
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* 打字指示器样式 */
            .typing_indicator {
                background-color: transparent;
                padding: 8px 16px;
                margin: 8px auto;
                width: fit-content;
                max-width: 90%;
                text-align: center;
                color: var(--text_color);
                opacity: 1 !important;
            }

            .typing-ellipsis {
                display: inline-block;
                animation: typing-dots 1.5s infinite;
            }

            @keyframes typing-dots {
                0%, 20% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 0; }
            }

            .typing-ellipsis::after {
                content: '...';
                animation: typing-dots 1.5s infinite;
            }

            /* 设置面板样式 */
            .inline-drawer {
                margin-bottom: 10px;
            }

            .inline-drawer-toggle {
                cursor: pointer;
                padding: 10px;
                background: var(--SmartThemeBlurple);
                color: white;
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .inline-drawer-content {
                padding: 15px;
                border: 1px solid var(--border_color);
                border-top: none;
                border-radius: 0 0 4px 4px;
                background: var(--SmartThemeBody);
            }

            .checkbox_label {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
                cursor: pointer;
            }

            .checkbox_label input[type="checkbox"] {
                margin: 0;
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .ti-options-container {
                    flex-direction: column;
                }

                .ti-options-capsule {
                    max-width: none;
                    width: 100%;
                }
            }
        `;

        injectCSS(css, 'ai-assistant-styles');
    }
} 