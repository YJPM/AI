import { extension_settings } from '../../../extensions.js';

export const defaultSettings = {
    enabled: true,
    // 选项生成功能设置
    optionsGenEnabled: false,
    optionsApiType: 'openai',
    optionsApiKey: '',
    optionsApiModel: 'gemini-2.5-flash-free',
    optionsBaseUrl: 'https://newapi.sisuo.de/v1',
    choiceLog: [],
    learnedStyle: '',
    logTriggerCount: 20,
    sendMode: 'auto',
    streamOptions: false, // true=流式, false=非流式
    
    // 提示样式设置（继承自打字指示器）
    animationEnabled: true,
    customText: 'AI助手思考中',
    debug: false,
};

export const MERGED_DIRECTOR_PROMPT = `
你是一位顶级AI叙事导演。请按如下流程操作：
1. 先分析最近对话，提取：
   - 场景类型
   - 用户情绪
   - 当前叙事焦点
2. 再基于分析结果、用户历史风格，为"我"生成3-5个最具戏剧性的行动/事件建议（每条用【】包裹，首条为最优选项）。

## 最近对话
{{context}}

## 用户历史风格
{{learned_style}}

## 输出格式
- 先输出JSON格式的情境分析（scene_type, user_mood, narrative_focus）
- 再输出建议列表（单行、每条用【】包裹）

## 开始
`.trim();

const MODULE = 'typing_indicator';

export function getSettings() {
    if (extension_settings[MODULE] === undefined) {
        extension_settings[MODULE] = structuredClone(defaultSettings);
    }
    for (const key in defaultSettings) {
        if (extension_settings[MODULE][key] === undefined) {
            extension_settings[MODULE][key] = defaultSettings[key];
        }
    }
    return extension_settings[MODULE];
}
