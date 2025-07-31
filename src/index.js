import { init as typingInit, exit as typingExit } from './modules/typing-indicator';
import { init as optionsInit, exit as optionsExit } from './modules/options-generator';
import { init as settingsInit, exit as settingsExit } from './modules/settings';

export async function init() {
    await typingInit();
    await optionsInit();
    await settingsInit();
    console.log('AI助手扩展初始化完成');
}

export async function exit() {
    await typingExit();
    await optionsExit();
    await settingsExit();
    console.log('AI助手扩展已退出');
}

export const info = {
    id: 'AI-Assistant',
    name: 'AI助手',
    description: '为SillyTavern提供打字指示器和智能回复选项生成功能',
};

const plugin = {
    init,
    exit,
    info,
};

export default plugin;

// jQuery初始化
$(async () => {
    await init();
}); 