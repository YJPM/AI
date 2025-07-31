// 设置模块
let isInitialized = false;

export async function init() {
    if (isInitialized) return;
    
    console.log('初始化设置模块...');
    
    // 初始化默认设置
    initializeDefaultSettings();
    
    // 创建设置UI
    createSettingsUI();
    
    isInitialized = true;
    console.log('设置模块初始化完成');
}

export async function exit() {
    if (!isInitialized) return;
    
    console.log('退出设置模块...');
    
    // 清理设置UI
    cleanupSettingsUI();
    
    isInitialized = false;
    console.log('设置模块已退出');
}

function initializeDefaultSettings() {
    const defaultSettings = {
        enabled: true,
        showCharName: true,
        animationEnabled: true,
        customText: '正在输入',
        debug: false,
        optionsGenEnabled: false,
        optionsApiType: 'openai',
        optionsApiKey: '',
        optionsApiModel: 'gpt-4o-mini',
        optionsBaseUrl: 'https://api.openai.com/v1',
        optionsTemplate: `
# 角色
你是一位拥有顶级创作能力的AI叙事导演。

# 核心目标
基于完整的聊天上下文，通过一个严谨的内部思考过程，为"我"（用户角色）生成3-5个接下来可能发生的、最具戏剧性的行动或事件选项。

# 当前用户输入
{{user_input}}

# 角色信息
{{char_card}}

# 世界设定
{{world_info}}

# 内部思考过程
1.  **[情境分析]**: 快速分析当前场景、我的情绪和目标、以及当前的冲突点。
2.  **[选项构思]**: 基于分析，在内部构思多个多样化的选项（升级冲突、探索未知、反映内心、意外转折等）。
3.  **[排序与决策]**: 根据戏剧性、角色一致性和叙事推动力，对构思的选项进行排序，将你认为的"最优选项"放在第一位。

# 最终输出格式 (!!!至关重要!!!)
- 你的最终输出必须是一个不换行的单行文本，包含3-5个高质量选项。
- **第一个选项必须是你决策出的最优选项。**
- 每个选项都必须用全角括号【】包裹。
- **绝对禁止**包含任何序号、JSON、思考过程、解释或其他多余字符。

# 对话上下文
{{context}}

# 开始执行导演任务，并输出你的最终选项列表：
`.trim()
    };
    
    // 确保扩展设置存在
    if (!window.extension_settings) {
        window.extension_settings = {};
    }
    
    // 初始化扩展设置
    if (!window.extension_settings['typing_indicator']) {
        window.extension_settings['typing_indicator'] = defaultSettings;
    }
    
    console.log('默认设置已初始化');
}

function createSettingsUI() {
    console.log('创建设置UI');
    // 这里实现设置UI的创建逻辑
}

function cleanupSettingsUI() {
    console.log('清理设置UI');
    // 这里实现设置UI的清理逻辑
} 