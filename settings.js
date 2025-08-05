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
    MAX_CONTEXT_MESSAGES: 5,
    MAX_WORLD_INFO_ITEMS: 3,
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
你是我的AI叙事导演。分析最近对话，为我生成连续性行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过50字
- 必须生成4个选项，每条用【】包裹
- 保持当前场景的连续性和自然发展
- 分析并考虑当前场景类型、我的情绪状态和叙事重点
- 建议应该具体、可执行、符合角色设定
- 选项必须是清晰明确的简要内容，不要出现任何"试图" "想要" "应该" "可以"，而是明确地东西
- 必须参考当前故事方向
- 给每个选项填充具体可以合理接续当前剧情的内容
- 必须符合正常的作息条件和时间观
- 选项不是我决定做什么，而是自然而然发生了什么
- 选项的语言必须极度朴素，概括性，不带修辞

## 分析维度
请从以下维度分析当前情况：
1. **场景类型**: 对话、冲突、探索、日常、工作、社交等
2. **情绪状态**: 平静、兴奋、担忧、好奇、紧张、放松等
3. **叙事重点**: 人物关系、任务进展、环境探索、情感发展等
4. **角色动机**: 我想要什么、我在担心什么、我在期待什么
5. **故事方向**: 当前剧情的发展趋势和可能走向

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "character_motivation": "我的主要动机或目标",
    "relationship_dynamics": "当前人物关系状态",
    "story_direction": "当前故事发展方向",
    "time_context": "当前时间背景和作息条件"
}

## 示例输出
场景分析：
{
    "scene_type": "社交对话",
    "user_mood": "好奇且友好",
    "narrative_focus": "建立新的人际关系",
    "character_motivation": "想要了解对方并建立友谊",
    "relationship_dynamics": "初次见面，互相试探阶段",
    "story_direction": "向友谊发展",
    "time_context": "下午茶时间，轻松氛围"
}

建议列表：
【她提到喜欢摄影，我分享手机里的旅行照片】
【服务员送来咖啡，我们聊起各自的工作】
【窗外下起小雨，我们转移到室内座位】
【她收到朋友消息，邀请我一起参加周末聚会】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4条，描述自然发生的事件}

## 引用说明
请在生成选项后，详细说明你参考了角色设定和世界书中的哪些具体内容来生成这些选项。

**引用格式要求：**
1. **角色设定引用**: 说明引用了角色的哪些具体特征、性格、背景等
2. **世界书引用**: 具体说明引用了哪个世界书条目（按名称或编号），以及该条目中的哪些具体内容
3. **内容关联**: 解释这些引用内容如何影响了选项的生成

**示例格式：**
- 角色设定：参考了角色的[具体特征]，影响了[具体选项]
- 世界书引用：参考了"世界书条目名称"中的[具体内容]，用于[具体用途]

## 开始
`.trim(),
    
    fast: `
你是我的AI叙事导演。分析最近对话，为我生成时间推进的行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过50字
- 必须生成4个选项，每条用【】包裹
- 选项必须直接接续当前正在进行的剧情，而不是跳跃到新事件
- 如果当前在准备做某事，选项应该是这件事的完成或进行过程
- 如果当前在某个地点，选项应该是在该地点的后续发展
- 如果当前在某个情绪状态，选项应该是该情绪的延续或转变
- 时间推进应该自然，不要突兀地跳跃到完全不同的场景
- 选项必须是清晰明确的简要内容，不要出现任何"试图" "想要" "应该" "可以"，而是明确地东西
- 必须参考当前故事方向
- 给每个选项填充具体可以合理接续当前剧情的内容
- 必须符合正常的作息条件和时间观
- 选项不是我决定做什么，而是自然而然发生了什么
- 选项的语言必须极度朴素，概括性，不带修辞

## 剧情接续策略
1. **任务延续**: 如果正在准备执行任务，选项应该是任务执行过程或结果
2. **地点延续**: 如果正在某个地点，选项应该是在该地点的后续活动
3. **情绪延续**: 如果处于某种情绪，选项应该是该情绪的延续或转变
4. **时间推进**: 在保持剧情连续性的基础上推进时间

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "current_activity": "当前正在进行的活动或准备做的事情",
    "current_location": "当前所在位置或即将前往的地点",
    "current_emotion": "当前的情绪状态",
    "next_logical_step": "当前活动的下一个逻辑步骤",
    "time_progression": "建议的时间推进跨度",
    "story_direction": "当前故事发展方向",
    "time_context": "当前时间背景和作息条件"
}

## 示例输出
场景分析：
{
    "scene_type": "任务准备",
    "user_mood": "专注且紧张",
    "narrative_focus": "准备执行重要任务",
    "current_activity": "正在整理任务所需的装备和资料",
    "current_location": "办公室或工作场所",
    "current_emotion": "专注且有些压力",
    "next_logical_step": "开始执行任务或前往任务地点",
    "time_progression": "1-2小时后",
    "story_direction": "任务执行和结果",
    "time_context": "工作时间，任务截止日期临近"
}

建议列表：
【任务开始执行，我按照计划逐步推进各个步骤】
【遇到第一个挑战，我冷静分析并找到解决方案】
【任务进展顺利，我完成了第一个重要节点】
【任务执行过程中，我发现了新的问题和机会】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4条，直接接续当前剧情，不要跳跃到新事件}

## 引用说明
请在生成选项后，详细说明你参考了角色设定和世界书中的哪些具体内容来生成这些选项。

**引用格式要求：**
1. **角色设定引用**: 说明引用了角色的哪些具体特征、性格、背景等
2. **世界书引用**: 具体说明引用了哪个世界书条目（按名称或编号），以及该条目中的哪些具体内容
3. **内容关联**: 解释这些引用内容如何影响了选项的生成

**示例格式：**
- 角色设定：参考了角色的[具体特征]，影响了[具体选项]
- 世界书引用：参考了"世界书条目名称"中的[具体内容]，用于[具体用途]

## 开始
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
