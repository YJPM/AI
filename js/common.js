import { extension_settings } from '../../../extensions.js';

export const MODULE = 'ai_director';

export const defaultSettings = {
    // Typing Indicator settings
    ti_enabled: false,
    ti_streaming: false,
    ti_showCharName: false,
    ti_animationEnabled: true,
    ti_fontColor: '',
    ti_customText: '正在输入',
    ti_activeTheme: '默认',
    ti_themes: {
        '默认': { css: '/* 默认主题：不应用额外样式。 */' },
        '渐变脉冲': { css: `
#typing_indicator .typing-ellipsis { display: none; }
#typing_indicator div.typing-indicator-text {
font-weight: bold;
background: linear-gradient(90deg, #ff00de, #00f2ff, #ff00de);
background-size: 200% 200%;
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
animation: gradient-pulse 3s ease-in-out infinite;
}
@keyframes gradient-pulse {
0% { background-position: 0% 50%; }
50% { background-position: 100% 50%; }
100% { background-position: 0% 50%; }
}
        ` },
    },
    
    // AI Director settings
    ad_enabled: true,
    ad_apiType: 'openai',
    ad_apiKey: '',
    ad_baseUrl: 'https://api.openai.com/v1',
    ad_model: 'gpt-4o-mini',
    ad_sendMode: 'auto',
    ad_enableDynamicDirector: false,
    ad_analysisModel: 'gpt-3.5-turbo',
    ad_choiceLog: [],
    ad_learnedStyle: '',
    ad_logTriggerCount: 20,
    ad_promptContent: `
# 角色
你是一位拥有顶级创作能力的AI叙事导演。
# 核心目标
基于完整的聊天上下文，通过一个严谨的内部思考过程，为"我"（用户角色）生成3-5个接下来可能发生的、最具戏剧性的行动或事件选项。
# ... (rest of the simple prompt)
`.trim(),
    ad_dynamicPromptTemplate: `
# 角色
你是一位拥有顶级创作能力的AI叙事导演，你必须根据我提供的实时情境分析来调整你的导演风格。
# ... (rest of the dynamic prompt)
`.trim(),
};

export function getSettings() {
    if (extension_settings[MODULE] === undefined) {
        extension_settings[MODULE] = structuredClone(defaultSettings);
    }
    // Ensure all keys from defaultSettings exist in the loaded settings
    for (const key in defaultSettings) {
        if (extension_settings[MODULE][key] === undefined) {
            extension_settings[MODULE][key] = defaultSettings[key];
        }
    }
    return extension_settings[MODULE];
} 