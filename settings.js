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
    paceMode: 'normal', // 推进节奏：normal=正常, fast=快速, jump=跳跃
    
    // 调试设置
    debug: true, // 默认开启
};

// 不同推进节奏的提示模板
const PACE_PROMPTS = {
    normal: `
你是我的AI叙事导演。分析最近对话，为我生成4个正常行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 分析场景类型、我的情绪、叙事焦点

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹）

## 开始
`.trim(),
    
    fast: `
你是我的AI叙事导演。分析最近对话，为我生成4个快速行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 包含适度时间推进（下一个行动、后续发展）
- 保留一定当前场景连续性，不要跳跃太快

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹，包含时间跨越）

## 开始
`.trim(),
    
    jump: `
你是我的AI叙事导演。分析最近对话，为我生成4个跳跃式行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 包含显著场景跳跃（不同地点、不同人物、不同活动）
- 完全跳过中间过程，直接到达新场景

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹，包含场景跳跃）

## 开始
`.trim()
};

// 剧情走向提示模板
const PLOT_PROMPTS = {
    normal: `
你是我的AI叙事导演。分析最近对话，为我生成4个正常剧情行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 保持正常、健康的剧情发展
- 避免极端或不当内容
- 必须生成4个选项

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹，必须4个）

## 开始
`.trim(),
    
    twist: `
你是我的AI叙事导演。分析最近对话，为我生成4个转折剧情行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 包含意外转折和戏剧性变化
- 可以是角色关系变化、环境突变、情感转折等
- 必须生成4个选项

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹，必须4个，包含转折元素）

## 开始
`.trim(),
    
    nsfw: `
你是我的AI叙事导演。分析最近对话，为我生成4个成人向剧情行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 包含成人向、亲密或浪漫内容
- 保持艺术性和品味
- 必须生成4个选项

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹，必须4个，成人向内容）

## 开始
`.trim()
};

export const MERGED_DIRECTOR_PROMPT = PACE_PROMPTS.normal; // 默认使用正常模式

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
