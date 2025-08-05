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
    streamOptions: false, // true=流式, false=非流式
    paceMode: CONSTANTS.DEFAULT_PACE_MODE, // 推进节奏：normal=正常, fast=快速
    autoGenMode: CONSTANTS.DEFAULT_AUTO_GEN_MODE, // 选项生成模式：auto=自动生成, manual=手动生成
    plotMode: 'normal', // 剧情走向：normal=正常, twist=转折, nsfw=成人向
    
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
- 每条建议不超过80字
- 必须生成4个选项，每条用【】包裹
- 保持当前场景的连续性和自然发展
- 分析并考虑当前场景类型、我的情绪状态和叙事重点
- 建议应该具体、可执行、符合角色设定

## 分析维度
请从以下维度分析当前情况：
1. **场景类型**: 对话、冲突、探索、日常、工作、社交等
2. **情绪状态**: 平静、兴奋、担忧、好奇、紧张、放松等
3. **叙事重点**: 人物关系、任务进展、环境探索、情感发展等
4. **角色动机**: 我想要什么、我在担心什么、我在期待什么

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "character_motivation": "我的主要动机或目标",
    "relationship_dynamics": "当前人物关系状态"
}

## 示例输出
场景分析：
{
    "scene_type": "社交对话",
    "user_mood": "好奇且友好",
    "narrative_focus": "建立新的人际关系",
    "character_motivation": "想要了解对方并建立友谊",
    "relationship_dynamics": "初次见面，互相试探阶段"
}

建议列表：
【询问她的兴趣爱好，寻找共同话题】
【分享一个关于自己工作的有趣故事】
【注意到她提到的某个地方，询问更多细节】
【提议一起参加即将到来的社区活动】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4条}

## 开始
`.trim(),
    
    fast: `
你是我的AI叙事导演。分析最近对话，为我生成时间推进的行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过80字
- 必须生成4个选项，每条用【】包裹
- 包含短期时间推进（1小时内到1天内）
- 关注事件完成、约定履行、场景转换等节点
- 保持剧情的连贯性和合理性
- 建议应该推动故事向前发展

## 时间推进类型
1. **即时行动**: 立即可以执行的动作
2. **短期计划**: 几小时内要完成的事情
3. **当日安排**: 今天剩余时间的计划
4. **明日准备**: 为明天做准备的行动

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "time_span": "建议的时间跨度范围",
    "urgency_level": "紧急程度：低/中/高",
    "next_milestone": "下一个重要节点或目标"
}

## 示例输出
场景分析：
{
    "scene_type": "工作项目",
    "user_mood": "专注且有些压力",
    "narrative_focus": "项目截止日期临近",
    "time_span": "2-4小时",
    "urgency_level": "高",
    "next_milestone": "完成项目报告提交"
}

建议列表：
【立即开始整理项目数据，准备最终报告】
【一小时后，与团队成员进行最后的讨论和确认】
【下午三点，完成报告并发送给主管审核】
【傍晚时分，准备明天的项目展示材料】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4条，包含明确的时间标记}

## 开始
`.trim(),
    

};

// 剧情走向提示模板
export const PLOT_PROMPTS = {
    normal: `
你是我的AI叙事导演。分析最近对话，为我生成4个正常剧情行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过50字
- 保持正常、健康的剧情发展
- 避免极端或不当内容
- 必须生成4个选项
- 建议应该符合现实逻辑和角色设定

## 剧情类型指导
1. **日常互动**: 正常的社交、工作、生活场景
2. **情感发展**: 友谊、亲情、爱情的健康发展
3. **个人成长**: 学习、技能提升、自我认知
4. **问题解决**: 面对困难时的理性处理方式

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "relationship_status": "当前人际关系状态",
    "personal_goals": "个人目标或愿望"
}

## 示例输出
场景分析：
{
    "scene_type": "日常社交",
    "user_mood": "轻松愉快",
    "narrative_focus": "维护友谊关系",
    "relationship_status": "与朋友关系良好",
    "personal_goals": "保持健康的人际关系"
}

建议列表：
【邀请朋友一起参加周末的户外活动】
【分享最近学到的新技能或知识】
【关心朋友的工作和生活近况】
【计划一次小型的聚会或庆祝活动】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4个}

## 开始
`.trim(),
    
    twist: `
你是我的AI叙事导演。分析最近对话，为我生成4个转折剧情行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过50字
- 包含意外转折和戏剧性变化
- 可以是角色关系变化、环境突变、情感转折等
- 必须生成4个选项
- 转折应该合理且有戏剧张力

## 转折类型指导
1. **关系转折**: 友谊变爱情、信任破裂、误解产生
2. **环境转折**: 意外事件、环境变化、外部干扰
3. **情感转折**: 情绪突变、认知改变、价值观冲突
4. **情节转折**: 秘密揭露、意外发现、计划受阻

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "tension_points": "潜在的冲突或紧张点",
    "unexpected_elements": "可能出现的意外因素"
}

## 示例输出
场景分析：
{
    "scene_type": "平静日常",
    "user_mood": "满足且放松",
    "narrative_focus": "享受平静生活",
    "tension_points": "可能存在的隐藏问题",
    "unexpected_elements": "意外访客或消息"
}

建议列表：
【突然接到一个改变一切的电话或消息】
【发现朋友隐瞒的重要秘密或真相】
【意外遇到过去的熟人，带来复杂情感】
【环境突然发生变化，打破平静生活】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4个，包含转折元素}

## 开始
`.trim(),
    
    nsfw: `
你是我的AI叙事导演。分析最近对话，为我生成4个成人向剧情行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过50字
- 包含成人向、亲密或浪漫内容
- 保持艺术性和品味
- 必须生成4个选项
- 内容应该优雅且符合角色发展

## 成人向内容指导
1. **浪漫发展**: 情感升温、亲密接触、浪漫表达
2. **身体接触**: 牵手、拥抱、亲吻等亲密行为
3. **情感交流**: 深度对话、情感表达、内心分享
4. **氛围营造**: 浪漫环境、特殊时刻、情感氛围

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "romantic_tension": "浪漫氛围或紧张感",
    "intimacy_level": "当前亲密程度"
}

## 示例输出
场景分析：
{
    "scene_type": "浪漫约会",
    "user_mood": "兴奋且有些紧张",
    "narrative_focus": "发展浪漫关系",
    "romantic_tension": "彼此吸引，氛围暧昧",
    "intimacy_level": "初步亲密接触阶段"
}

建议列表：
【轻轻握住她的手，表达内心的情感】
【靠近她耳边，轻声说出内心的想法】
【在浪漫的灯光下，慢慢靠近她的脸庞】
【用温柔的眼神和动作，表达深深的爱意】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4个，成人向内容}

## 开始
`.trim()
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
