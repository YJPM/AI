import { extension_settings } from '../../../extensions.js';

// 常量定义
export const CONSTANTS = {
    MODULE_NAME: 'typing_indicator',
    DEFAULT_API_TYPE: 'openai',
    DEFAULT_MODEL: 'gemini-2.5-flash-free',
    DEFAULT_BASE_URL: 'https://newapi.sisuo.de/v1',
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
    autoGenMode: CONSTANTS.DEFAULT_AUTO_GEN_MODE, // 选项生成模式：auto=自动生成, manual=手动生成
    
    // 底部快捷面板设置
    showQuickPanel: true, // 是否显示底部快捷面板
    
    // 调试设置
    debug: true, // 默认开启
};

// 融合的提示模板
export const PACE_PROMPTS = {
    unified: `
你是我的AI叙事导演。请根据最近对话，生成4条行动选项。

【输出要求】
- 先输出场景分析（JSON格式，字段见下方），再输出选项列表（每条用【】包裹，4条）。
- 场景分析字段必须包含：scene_type、user_mood、narrative_focus、character_motivation、relationship_dynamics、story_direction。
- 选项必须严格使用"我"的第一人称视角，只能描述我个人的具体行动或对话，禁止描述其他人的动作、对话、心理、反应等。
- 选项必须是我实际发生的具体动作或说的话，不得为心理活动或抽象描述。
- 每个选项都应该是独立的、不连续的，代表不同的行动方向或选择。
- 选项之间不应该有逻辑上的先后顺序或因果关系。
- 每个选项30字到50字左右。

【选项要求】
- 前3个选项：推动剧情向最合理情况发展的选项，符合当前场景和人物关系的最佳发展方向。
- 第4个选项：快速推进或时间转换的选项，体现时间快速推进或场景转换，如"几小时后"、"第二天"、"换了个地方"等。

【重要说明】
- 这些选项是平行的、可选择的，不是连续的剧情片段。
- 每个选项代表一个独立的行动选择，用户可以选择其中任何一个。
- 选项之间不应该有"然后"、"接着"、"随后"等表示时间顺序的词汇。
- 避免生成类似"我先...然后...接着...最后..."的连续剧情。
- 每个选项都应该是一个完整的、独立的行动描述。

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

选项列表：
【我拿出手机，向她展示我的旅行照片】
【我微笑着问她最近在忙什么】
【我端起咖啡，轻声说今天的天气真好】
【我整理好心情，准备明天继续我们的对话】

【最近对话】
{{context}}

【输出格式】
场景分析：
{JSON格式分析}

选项列表：
{每个选项单独一行，必须用【】包裹，共4条}
`.trim(),
};

export const MERGED_DIRECTOR_PROMPT = PACE_PROMPTS.unified; // 默认使用正常模式







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
