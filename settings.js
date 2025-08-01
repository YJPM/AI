import { extension_settings } from '../../../extensions.js';

export const defaultSettings = {
    // 选项生成功能设置
    optionsGenEnabled: true, // 默认开启
    optionsApiType: 'openai',
    optionsApiKey: '',
    optionsApiModel: 'gemini-2.5-flash-free',
    optionsBaseUrl: 'https://newapi.sisuo.de/v1',
    sendMode: 'auto',
    streamOptions: false, // true=流式, false=非流式
    paceMode: 'balanced', // 推进节奏：slow=慢速, balanced=平衡, fast=快速(时间跨越)
    
    // 调试设置
    debug: true, // 默认开启
};

// 不同推进节奏的提示模板
const PACE_PROMPTS = {
    slow: `
你是一位深思熟虑的AI叙事导演。请仔细分析最近对话，为"我"生成3-5个富有深度的行动/事件建议（每条用【】包裹，首条为最优选项）。

## 最近对话
{{context}}

## 输出格式
- 先输出JSON格式的情境分析（scene_type, user_mood, narrative_focus）
- 再输出建议列表（单行、每条用【】包裹）

## 开始
`.trim(),
    
    balanced: `
你是一位AI叙事导演。请按如下流程操作：
1. 先分析最近对话，提取：
   - 场景类型
   - 用户情绪
   - 当前叙事焦点
2. 再基于分析结果，为"我"生成3-5个最具戏剧性的行动/事件建议（每条用【】包裹，首条为最优选项）。

## 最近对话
{{context}}

## 输出格式
- 先输出JSON格式的情境分析（scene_type, user_mood, narrative_focus）
- 再输出建议列表（单行、每条用【】包裹）

## 开始
`.trim(),
    
    fast: `
你是一位高效的AI叙事导演。请深入分析最近对话，为"我"生成3-4个具有明显时间跨越的行动/事件建议（每条用【】包裹，首条为最优选项）。

要求：
- 提供深入的情境分析和角色心理洞察
- 选项应包含明显的时间推进，如：任务完成后、赴约时间、重要事件发生等
- 避免停留在当前场景的细节讨论，直接推进到下一个重要节点

## 最近对话
{{context}}

## 输出格式
- 先输出JSON格式的情境分析（scene_type, user_mood, narrative_focus）
- 再输出建议列表（单行、每条用【】包裹，包含时间跨越）

## 开始
`.trim()
};

export const MERGED_DIRECTOR_PROMPT = PACE_PROMPTS.balanced; // 默认使用平衡模式

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
