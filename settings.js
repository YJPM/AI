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

## 开始
`.trim(),
    
    fast: `
你是我的AI叙事导演。分析最近对话，为我生成时间推进的行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过50字
- 必须生成4个选项，每条用【】包裹
- 实现情节时间推进至后续时段，依据当前剧情节奏或事件选择合适的时间点
- 时间变化应顺畅衔接前后场景，注意人物情绪与事件状态在时间变化下的自然延续或变化
- 自然结束正在进行的事件，并自然过渡至事件后的情绪或行为反应阶段
- 不要立即进入新事件，而应留出角色对事件的总结或反应空间
- 若事件带来情感波动，请适当描写其余韵或回响
- 选项必须是清晰明确的简要内容，不要出现任何"试图" "想要" "应该" "可以"，而是明确地东西
- 必须参考当前故事方向
- 给每个选项填充具体可以合理接续当前剧情的内容
- 必须符合正常的作息条件和时间观
- 选项不是我决定做什么，而是自然而然发生了什么
- 选项的语言必须极度朴素，概括性，不带修辞

## 时间推进策略
1. **事件收尾**: 完成当前事件，处理后续反应和总结
2. **情绪过渡**: 从事件情绪状态自然过渡到平静或反思状态
3. **时间跳跃**: 选择合适的时间点推进（几小时到一天内）
4. **状态延续**: 保持人物情绪和事件影响的自然延续

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "current_event_status": "当前事件状态（进行中/即将结束/已结束）",
    "emotional_impact": "事件带来的情感影响",
    "time_progression": "建议的时间推进跨度",
    "post_event_reaction": "事件后可能的情绪或行为反应",
    "story_direction": "当前故事发展方向",
    "time_context": "当前时间背景和作息条件"
}

## 示例输出
场景分析：
{
    "scene_type": "重要对话",
    "user_mood": "紧张且期待",
    "narrative_focus": "处理关键人际关系",
    "current_event_status": "对话即将结束",
    "emotional_impact": "混合着释然和不确定",
    "time_progression": "2-3小时后",
    "post_event_reaction": "需要时间消化对话内容，可能感到轻松或担忧",
    "story_direction": "关系深化或重新评估",
    "time_context": "下午时分，工作日"
}

建议列表：
【对话结束，我坐在咖啡厅里，手机收到她的感谢消息】
【回家路上，地铁里回想刚才的对话内容】
【傍晚时分，朋友发来消息询问今天的见面情况】
【晚上九点，躺在床上思考这次对话的意义】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4条，描述自然发生的事件，注重事件收尾和情绪过渡}

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
