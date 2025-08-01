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
你是我的AI叙事导演。分析最近对话，为我生成3-5个深度行动建议（每条用【】包裹，首条最优）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过100字
- 深入分析我的心理状态和处境

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹）

## 开始
`.trim(),
    
    balanced: `
你是我的AI叙事导演。分析最近对话，为我生成3-5个戏剧性行动建议（每条用【】包裹，首条最优）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过100字
- 分析场景类型、我的情绪、叙事焦点

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹）

## 开始
`.trim(),
    
    fast: `
你是我的AI叙事导演。分析最近对话，为我生成3-4个时间跨越行动建议（每条用【】包裹，首条最优）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过100字
- 包含明显时间推进（任务完成、赴约、重要事件）
- 避免当前场景细节，直接推进到下一节点

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹，包含时间跨越）

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
