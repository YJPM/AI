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
    paceMode: CONSTANTS.DEFAULT_PACE_MODE, // 推进节奏：normal=正常, fast=快速, jump=跳跃
    autoGenMode: CONSTANTS.DEFAULT_AUTO_GEN_MODE, // 选项生成模式：auto=自动生成, manual=手动生成
    templateMode: 'discovery', // 模板类型：discovery=探索, mystery=神秘, resolution=解决, challenge=挑战, healing=疗愈, celebration=庆祝
    
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
    
    jump: `
你是我的AI叙事导演。分析最近对话，为我生成显著时间跳跃的行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过80字
- 必须生成4个选项，每条用【】包裹
- 包含长期时间跳跃（1天以上）
- 每个选项必须包含具体时间标记
- 跨越不同场景、活动或人物互动
- 建议应该体现生活的重要转折点

## 时间跳跃类型
1. **短期跳跃**: 1-7天
2. **中期跳跃**: 1-4周
3. **长期跳跃**: 1-6个月
4. **重大转折**: 生活重要变化

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "time_span": "建议的时间跨度范围",
    "scene_changes": ["预期的场景变化列表"],
    "life_goals": "相关的个人目标或愿望",
    "challenges": "可能面临的挑战或困难"
}

## 示例输出
场景分析：
{
    "scene_type": "生活转折点",
    "user_mood": "期待且有些紧张",
    "narrative_focus": "职业发展和个人成长",
    "time_span": "一个月到三个月",
    "scene_changes": ["工作环境", "居住地点", "社交圈子"],
    "life_goals": "在新的城市建立事业和人际关系",
    "challenges": "适应新环境，建立新的社交网络"
}

建议列表：
【一个月后，在新城市找到合适的公寓，开始独立生活】
【两个月后，在新公司站稳脚跟，建立工作关系网】
【三个月后，参加当地兴趣小组，认识志同道合的朋友】
【半年后，回顾这段经历，庆祝个人成长和成就】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4条，包含明确的长期时间跳跃标记}

## 开始
`.trim()
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

// 新增：探索型提示模板
export const EXPLORATION_PROMPTS = {
    discovery: `
你是我的AI叙事导演。分析最近对话，为我生成4个探索发现类行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过60字
- 专注于探索、发现、学习新事物
- 包含好奇心驱动的行动
- 必须生成4个选项
- 建议应该激发探索欲望

## 探索类型指导
1. **环境探索**: 探索新地点、发现新环境
2. **知识探索**: 学习新技能、了解新知识
3. **关系探索**: 深入了解他人、发现新朋友
4. **自我探索**: 发现自己的新能力、新兴趣

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "curiosity_level": "好奇心程度：低/中/高",
    "exploration_goals": "探索目标或兴趣领域"
}

## 示例输出
场景分析：
{
    "scene_type": "新环境适应",
    "user_mood": "好奇且兴奋",
    "narrative_focus": "探索新城市",
    "curiosity_level": "高",
    "exploration_goals": "了解当地文化和生活方式"
}

建议列表：
【走进那条看起来很有特色的小巷，探索隐藏的店铺】
【询问当地人推荐的美食，尝试从未吃过的料理】
【参加一个当地的文化活动或节日庆典】
【租一辆自行车，漫无目的地探索城市的不同区域】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4个}

## 开始
`.trim(),
    
    mystery: `
你是我的AI叙事导演。分析最近对话，为我生成4个神秘探索类行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过60字
- 专注于解开谜题、发现秘密
- 包含推理和调查元素
- 必须生成4个选项
- 建议应该增加神秘感和悬念

## 神秘探索类型
1. **线索收集**: 寻找证据、收集信息
2. **推理分析**: 分析线索、形成假设
3. **秘密调查**: 暗中观察、深入调查
4. **真相揭露**: 面对真相、处理结果

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "mystery_level": "神秘程度：低/中/高",
    "suspicion_points": "可疑或需要调查的地方"
}

## 示例输出
场景分析：
{
    "scene_type": "神秘事件",
    "user_mood": "困惑且好奇",
    "narrative_focus": "调查奇怪现象",
    "mystery_level": "高",
    "suspicion_points": "邻居的异常行为，夜晚的奇怪声音"
}

建议列表：
【仔细观察邻居的日常行为模式，寻找异常】
【询问其他邻居是否也注意到奇怪的现象】
【在夜晚记录下所有听到的奇怪声音】
【查阅当地的历史记录，寻找相关线索】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4个}

## 开始
`.trim()
};

// 新增：冲突型提示模板
export const CONFLICT_PROMPTS = {
    resolution: `
你是我的AI叙事导演。分析最近对话，为我生成4个冲突解决类行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过60字
- 专注于解决冲突、化解矛盾
- 包含沟通和协商元素
- 必须生成4个选项
- 建议应该促进和谐关系

## 冲突解决策略
1. **直接沟通**: 面对面交流、表达观点
2. **寻求调解**: 找第三方帮助、寻求建议
3. **妥协让步**: 寻找共同点、互相理解
4. **时间缓冲**: 给彼此空间、冷静思考

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "conflict_level": "冲突程度：低/中/高",
    "stakeholders": "涉及的相关人员"
}

## 示例输出
场景分析：
{
    "scene_type": "人际冲突",
    "user_mood": "困扰且想要解决",
    "narrative_focus": "修复与朋友的关系",
    "conflict_level": "中",
    "stakeholders": "我和朋友，可能还有其他朋友"
}

建议列表：
【主动联系朋友，表达想要和解的意愿】
【邀请朋友一起喝咖啡，面对面交流想法】
【承认自己的错误，真诚道歉并寻求原谅】
【提议一起参加活动，重新建立友谊】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4个}

## 开始
`.trim(),
    
    challenge: `
你是我的AI叙事导演。分析最近对话，为我生成4个挑战应对类行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过60字
- 专注于面对挑战、克服困难
- 包含勇气和决心元素
- 必须生成4个选项
- 建议应该体现成长和进步

## 挑战应对策略
1. **直面挑战**: 勇敢面对、积极应对
2. **寻求帮助**: 寻找支持、学习经验
3. **制定计划**: 系统规划、分步实施
4. **调整心态**: 保持乐观、增强信心

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "challenge_level": "挑战难度：低/中/高",
    "personal_strengths": "我的优势或可用资源"
}

## 示例输出
场景分析：
{
    "scene_type": "职业挑战",
    "user_mood": "紧张但决心面对",
    "narrative_focus": "完成重要项目",
    "challenge_level": "高",
    "personal_strengths": "有相关经验，团队支持"
}

建议列表：
【制定详细的项目计划，分解任务到每一天】
【寻求有经验的同事指导，学习最佳实践】
【每天回顾进度，及时调整策略和方法】
【保持积极心态，相信自己能够成功】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4个}

## 开始
`.trim()
};

// 新增：情感型提示模板
export const EMOTIONAL_PROMPTS = {
    healing: `
你是我的AI叙事导演。分析最近对话，为我生成4个情感疗愈类行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过60字
- 专注于情感疗愈、心理恢复
- 包含自我关爱和成长元素
- 必须生成4个选项
- 建议应该促进心理健康

## 疗愈方式指导
1. **自我关爱**: 照顾自己、放松身心
2. **情感表达**: 释放情绪、寻求倾诉
3. **积极活动**: 参与活动、转移注意力
4. **专业帮助**: 寻求咨询、学习技巧

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "emotional_state": "情感状态描述",
    "healing_needs": "需要的疗愈类型"
}

## 示例输出
场景分析：
{
    "scene_type": "情感低谷",
    "user_mood": "失落但想要恢复",
    "narrative_focus": "走出情感困境",
    "emotional_state": "感到孤独和失落",
    "healing_needs": "需要情感支持和自我关爱"
}

建议列表：
【给自己一个温暖的拥抱，告诉自己一切都会好起来】
【联系最信任的朋友，分享内心的感受和想法】
【做一些让自己开心的事情，比如听音乐或看电影】
【尝试冥想或深呼吸，帮助自己平静下来】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4个}

## 开始
`.trim(),
    
    celebration: `
你是我的AI叙事导演。分析最近对话，为我生成4个庆祝喜悦类行动建议。

## 核心要求
- 始终以我的第一人称视角
- 每条建议不超过60字
- 专注于庆祝成功、分享喜悦
- 包含感恩和分享元素
- 必须生成4个选项
- 建议应该传播正能量

## 庆祝方式指导
1. **个人庆祝**: 犒劳自己、享受成果
2. **分享喜悦**: 与亲友分享、传播快乐
3. **感恩回馈**: 感谢帮助、回馈他人
4. **规划未来**: 设定新目标、继续前进

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "achievement_type": "成就类型",
    "celebration_scale": "庆祝规模：小/中/大"
}

## 示例输出
场景分析：
{
    "scene_type": "成功时刻",
    "user_mood": "兴奋且满足",
    "narrative_focus": "庆祝重要成就",
    "achievement_type": "职业发展成功",
    "celebration_scale": "中"
}

建议列表：
【给自己买一件心仪已久的礼物，犒劳自己的努力】
【邀请朋友一起聚餐，分享这个好消息】
【感谢一路上帮助过自己的人，表达感激之情】
【规划下一个目标，保持前进的动力】

## 最近对话
{{context}}

## 输出格式
场景分析：
{JSON格式分析}

建议列表：
{每条建议单独一行，必须用【】包裹，共4个}

## 开始
`.trim()
};

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
