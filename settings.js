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
    autoGenMode: 'auto', // 选项生成模式：auto=自动生成, manual=手动生成
    
    // 调试设置
    debug: true, // 默认开启
};

// 不同推进节奏的提示模板
export const PACE_PROMPTS = {
    normal: `
你是我的AI叙事导演。分析最近对话，为我生成连续性行动建议。

要求：
- 始终以我的第一人称视角
- 每条建议不超过80字
- 必须生成4个选项，每条用【】包裹
- 保持当前场景的连续性和自然发展
- 分析并考虑当前场景类型、我的情绪状态和叙事重点

## 场景分析格式
{
    "scene_type": "当前场景类型，如：对话、冲突、探索等",
    "user_mood": "我的情绪状态，如：平静、兴奋、担忧等",
    "narrative_focus": "当前叙事重点，如：人物关系、任务进展、环境探索等"
}

## 示例输出
场景分析：
{
    "scene_type": "对话场景",
    "user_mood": "好奇",
    "narrative_focus": "了解新角色背景"
}

建议列表：
【询问她的家乡在哪里，表达对她家乡文化的兴趣】
【分享一个自己的有趣经历，引导话题展开】
【注意到她手上的饰品，礼貌地询问其来历】
【谈论当地的特色美食，邀请她推荐几个好去处】

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

要求：
- 始终以我的第一人称视角
- 每条建议不超过80字
- 必须生成4个选项，每条用【】包裹
- 包含短期时间推进（1小时内到1天内）
- 关注事件完成、约定履行、场景转换等节点
- 保持剧情的连贯性和合理性

## 场景分析格式
{
    "scene_type": "当前场景类型，如：任务、约会、工作等",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点和预期发展方向",
    "time_span": "建议的时间跨度范围"
}

## 示例输出
场景分析：
{
    "scene_type": "工作场景",
    "user_mood": "专注",
    "narrative_focus": "项目进展",
    "time_span": "2-3小时"
}

建议列表：
【两小时后，完成报告的最后修改，准备向团队展示】
【午饭时间到了，邀请同事一起去新开的餐厅放松一下】
【下午茶时分，组织一个简短的团队会议讨论项目进展】
【傍晚时分，整理好工作内容，为明天的客户会议做准备】

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

要求：
- 始终以我的第一人称视角
- 每条建议不超过80字
- 必须生成4个选项，每条用【】包裹
- 包含长期时间跳跃（1天以上）
- 每个选项必须包含具体时间标记
- 跨越不同场景、活动或人物互动

## 场景分析格式
{
    "scene_type": "当前场景类型",
    "user_mood": "我的情绪状态",
    "narrative_focus": "当前叙事重点",
    "time_span": "建议的时间跨度范围",
    "scene_changes": ["预期的场景变化列表"]
}

## 示例输出
场景分析：
{
    "scene_type": "生活规划",
    "user_mood": "期待",
    "narrative_focus": "个人发展",
    "time_span": "一周到一个月",
    "scene_changes": ["工作环境", "居住环境", "社交圈子"]
}

建议列表：
【一周后，收拾好行李，准备搬入新的公寓，开始新的生活章节】
【两周后，在新公司完成入职培训，逐渐适应工作节奏】
【三周后，参加本地摄影协会的月度聚会，认识志同道合的朋友】
【一个月后，计划一次短途旅行，庆祝新生活的开始】

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
