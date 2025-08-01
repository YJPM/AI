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
你是我的AI叙事导演。分析最近对话，为我生成3-5个正常行动建议（每条用【】包裹，首条最优）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过100字
- 描述当前正在进行的动作或状态
- 例如："收拾东西准备回家"

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹）

## 开始
`.trim(),
    
    fast: `
你是我的AI叙事导演。分析最近对话，为我生成3-4个快速行动建议（每条用【】包裹，首条最优）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过100字
- 描述动作的中间状态
- 例如："在回家的路上了"

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹）

## 开始
`.trim(),
    
    jump: `
你是我的AI叙事导演。分析最近对话，为我生成3-4个跳跃行动建议（每条用【】包裹，首条最优）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过100字
- 描述已完成的动作或结果状态
- 例如："已经到家了"

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹）

## 开始
`.trim()
};

// 已移除旧的剧情走向模板定义


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
