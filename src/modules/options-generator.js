// 选项生成器模块
let isInitialized = false;

export async function init() {
    if (isInitialized) return;
    
    console.log('初始化选项生成器模块...');
    
    // 设置事件监听器
    setupEventListeners();
    
    isInitialized = true;
    console.log('选项生成器模块初始化完成');
}

export async function exit() {
    if (!isInitialized) return;
    
    console.log('退出选项生成器模块...');
    
    // 清理事件监听器
    cleanupEventListeners();
    
    isInitialized = false;
    console.log('选项生成器模块已退出');
}

function setupEventListeners() {
    // 监听SillyTavern事件
    if (window.eventSource) {
        window.eventSource.on('GENERATION_ENDED', handleGenerationEnded);
        window.eventSource.on('CHAT_CHANGED', handleChatChanged);
    }
    
    console.log('设置选项生成器事件监听器');
}

function cleanupEventListeners() {
    // 清理事件监听器
    if (window.eventSource) {
        window.eventSource.off('GENERATION_ENDED', handleGenerationEnded);
        window.eventSource.off('CHAT_CHANGED', handleChatChanged);
    }
    
    console.log('清理选项生成器事件监听器');
}

function handleGenerationEnded() {
    console.log('生成结束，检查是否需要生成选项');
    // 检查最后一条消息是否为AI回复
    if (isLastMessageFromAI()) {
        generateOptions();
    }
}

function handleChatChanged() {
    console.log('聊天改变，检查是否需要生成选项');
    // 延迟检查，确保DOM已更新
    setTimeout(() => {
        if (isLastMessageFromAI() && !hasOptionsDisplayed()) {
            generateOptions();
        }
    }, 500);
}

function isLastMessageFromAI() {
    try {
        const lastMessage = document.querySelector('#chat .last_mes');
        if (!lastMessage) {
            return false;
        }
        const isUser = lastMessage.getAttribute('is_user');
        return isUser === 'false';
    } catch (error) {
        console.error('检查最后一条消息时出错:', error);
        return false;
    }
}

function hasOptionsDisplayed() {
    return document.querySelector('.ti-options-container') !== null;
}

function generateOptions() {
    console.log('开始生成选项...');
    // 这里实现选项生成逻辑
} 