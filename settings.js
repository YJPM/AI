import { extension_settings } from '../../../extensions.js';

// 常量定义
export const CONSTANTS = {
    MODULE_NAME: 'typing_indicator',
    DEFAULT_API_TYPE: 'openai',
    DEFAULT_MODEL: 'gemini-2.5-flash-free',
    DEFAULT_BASE_URL: 'https://newapi.sisuo.de/v1',
    DEFAULT_PACE_MODE: 'normal',
    DEFAULT_SEND_MODE: 'auto',
    DEFAULT_AUTO_GEN_MODE: 'auto',
    MAX_CONTEXT_MESSAGES: 10,
    ANIMATION_DURATION: 2000,
    CACHE_DURATION: 5000
};

// 默认设置
export const defaultSettings = {
    // 选项生成功能设置
    optionsGenEnabled: true, // 默认开启
    optionsApiType: CONSTANTS.DEFAULT_API_TYPE,
    optionsApiKey: '',
    optionsApiModel: CONSTANTS.DEFAULT_MODEL,
    optionsBaseUrl: CONSTANTS.DEFAULT_BASE_URL,
    sendMode: CONSTANTS.DEFAULT_SEND_MODE,
    paceMode: CONSTANTS.DEFAULT_PACE_MODE, // 推进节奏：normal=正常, fast=快速
    autoGenMode: CONSTANTS.DEFAULT_AUTO_GEN_MODE, // 选项生成模式：auto=自动生成, manual=手动生成
    
    // 底部快捷面板设置
    showQuickPanel: true, // 是否显示底部快捷面板
    
    // 调试设置
    debug: true, // 默认开启
};

// 不同推进节奏的提示模板
export const PACE_PROMPTS = {
    normal: `
你是我的AI叙事导演。请根据最近对话，生成4条连续性行动建议。

【输出要求】
- 先输出场景分析（JSON格式，字段见下方），再输出建议列表（每条用【】包裹，4条）。
- 场景分析字段必须包含：scene_type、user_mood、narrative_focus、character_motivation、relationship_dynamics、story_direction。
- 建议必须严格使用“我”的第一人称视角，只能描述我个人的具体行动或对话，禁止描述其他人的动作、对话、心理、反应等。
- 建议必须是我实际发生的具体动作或说的话，不得为心理活动或抽象描述。
- 每条都应推动剧情或角色关系发展。
- 每条建议30字到50字左右。

【场景分析字段说明】
- scene_type: 当前场景类型（如社交对话、任务、探索等）
- user_mood: 我的情绪（如好奇、紧张、平静等）
- narrative_focus: 当前叙事重点
- character_motivation: 我的动机或目标
- relationship_dynamics: 当前人物关系状态
- story_direction: 当前故事发展方向

【示例输出】
场景分析：
{
  "scene_type": "社交对话",
  "user_mood": "好奇且友好",
  "narrative_focus": "建立新的人际关系",
  "character_motivation": "想要了解对方并建立友谊",
  "relationship_dynamics": "初次见面，互相试探阶段",
  "story_direction": "向友谊发展"
}

建议列表：
【我拿出手机，向她展示我的旅行照片】
【我微笑着问她最近在忙什么】
【我端起咖啡，轻声说今天的天气真好】
【我点头答应一起参加周末聚会】

【最近对话】
{{context}}

【输出格式】
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4条}
`.trim(),

    fast: `
你是我的AI叙事导演。请根据最近对话，生成4条快速推进或时间转换的行动建议。

【输出要求】
- 先输出场景分析（JSON格式，字段见下方），再输出建议列表（每条用【】包裹，4条）。
- 场景分析字段必须包含：scene_type、user_mood、narrative_focus、character_motivation、relationship_dynamics、story_direction、time_progression、scene_transition。
- 建议必须严格使用“我”的第一人称视角，只能描述我个人的具体行动或对话，禁止描述其他人的动作、对话、心理、反应等。
- 建议必须体现时间快速推进或场景转换，如“几小时后”、“第二天”、“换了个地方”等。
- 建议可以是当前事件的快速完成，也可以是跳跃到新的时间点或场景。
- 每条都应推动剧情或角色关系发展。
- 每条建议30字到50字左右。

【场景分析字段说明】
- scene_type: 当前场景类型
- user_mood: 我的情绪
- narrative_focus: 当前叙事重点
- character_motivation: 我的动机或目标
- relationship_dynamics: 当前人物关系状态
- story_direction: 当前故事发展方向
- time_progression: 时间推进跨度（如“几小时后”、“第二天”等）
- scene_transition: 场景转换目标（如“任务执行现场”、“新地点”等）

【示例输出】
场景分析：
{
  "scene_type": "任务准备",
  "user_mood": "专注且紧张",
  "narrative_focus": "准备执行重要任务",
  "character_motivation": "尽快完成准备工作",
  "relationship_dynamics": "独自行动",
  "story_direction": "任务执行和结果",
  "time_progression": "几小时后",
  "scene_transition": "任务执行现场"
}

建议列表：
【我快速检查装备，确认所有物品齐全】
【我整理好资料，立即出发前往任务地点】
【我到达现场，开始执行任务】
【我完成任务，准备返回汇报结果】

【最近对话】
{{context}}

【输出格式】
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4条}
`.trim(),
};

export const MERGED_DIRECTOR_PROMPT = PACE_PROMPTS.normal; // 默认使用正常模式







// 设置管理类
class SettingsManager {
    constructor() {
        this._cache = null;
        this._lastUpdate = 0;
    }
    
    // 获取设置，带缓存优化
    getSettings() {
        const now = Date.now();
        
        // 如果缓存存在且未过期，直接返回
        if (this._cache && (now - this._lastUpdate) < CONSTANTS.CACHE_DURATION) {
            return this._cache;
        }
        
        // 初始化设置
        if (extension_settings[CONSTANTS.MODULE_NAME] === undefined) {
            extension_settings[CONSTANTS.MODULE_NAME] = structuredClone(defaultSettings);
        }
        
        // 确保所有默认设置都存在
        for (const key in defaultSettings) {
            if (extension_settings[CONSTANTS.MODULE_NAME][key] === undefined) {
                extension_settings[CONSTANTS.MODULE_NAME][key] = defaultSettings[key];
            }
        }
        
        // 更新缓存
        this._cache = extension_settings[CONSTANTS.MODULE_NAME];
        this._lastUpdate = now;
        
        return this._cache;
    }
    
    // 清除缓存
    clearCache() {
        this._cache = null;
        this._lastUpdate = 0;
    }
    
    // 更新设置
    updateSettings(newSettings) {
        Object.assign(extension_settings[CONSTANTS.MODULE_NAME], newSettings);
        this.clearCache(); // 清除缓存，确保下次获取最新设置
    }
}

// 创建单例实例
const settingsManager = new SettingsManager();

// 导出兼容函数
export function getSettings() {
    return settingsManager.getSettings();
}

// 导出设置管理器（供高级用法）
export { settingsManager };
