import { MODULE } from './constants.js';
import { API_TYPES, DEFAULT_MODELS, DEFAULT_BASE_URLS } from './constants.js';

/**
 * @typedef {Object} TypingIndicatorSettings
 * @property {boolean} enabled
 * @property {boolean} showCharName
 * @property {boolean} animationEnabled - 是否启用末尾的...动画。
 * @property {string} customText
 * @property {boolean} debug - 是否启用调试日志
 * @property {boolean} optionsGenEnabled - 是否启用选项生成功能
 * @property {string} optionsApiType - API类型 ('openai' 或 'gemini')
 * @property {string} optionsApiKey - API密钥
 * @property {string} optionsApiModel - 使用的模型
 * @property {string} optionsBaseUrl - API基础URL (仅限OpenAI)
 * @property {string} optionsTemplate - 选项生成提示模板
 */

/**
 * @type {TypingIndicatorSettings}
 */
export const defaultSettings = {
    enabled: true,
    showCharName: true,
    animationEnabled: true,
    customText: '正在输入',
    debug: false,
    // 选项生成相关设置
    optionsGenEnabled: false,
    optionsApiType: API_TYPES.OPENAI,
    optionsApiKey: '',
    optionsApiModel: DEFAULT_MODELS[API_TYPES.GEMINI],
    optionsBaseUrl: DEFAULT_BASE_URLS[API_TYPES.OPENAI],
    optionsTemplate: `
# 角色
你是一位拥有顶级创作能力的AI叙事导演。

# 核心目标
基于完整的聊天上下文，通过一个严谨的内部思考过程，为"我"（用户角色）生成3-5个接下来可能发生的、最具戏剧性的行动或事件选项。

# 内部思考过程
1.  **[情境分析]**: 快速分析当前场景、我的情绪和目标、以及当前的冲突点。
2.  **[选项构思]**: 基于分析，在内部构思多个多样化的选项（升级冲突、探索未知、反映内心、意外转折等）。
3.  **[排序与决策]**: 根据戏剧性、角色一致性和叙事推动力，对构思的选项进行排序，将你认为的"最优选项"放在第一位。

# 最终输出格式 (!!!至关重要!!!)
- 你的最终输出必须是一个不换行的单行文本，包含3-5个高质量选项。
- **第一个选项必须是你决策出的最优选项。**
- 每个选项都必须用全角括号【】包裹。
- **绝对禁止**包含任何序号、JSON、思考过程、解释或其他多余字符。

# 当前用户输入
{{user_input}}

# 角色信息
{{char_card}}

# 世界设定
{{world_info}}

# 对话上下文
{{context}}

# 开始执行导演任务，并输出你的最终选项列表：
`.trim(),
};

/**
 * 获取此扩展的设置。
 */
export function getSettings() {
    const extension_settings = window.extension_settings;
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

/**
 * 重置所有设置为默认值
 */
export function resetSettings() {
    const extension_settings = window.extension_settings;
    extension_settings[MODULE] = structuredClone(defaultSettings);
    return extension_settings[MODULE];
} 