import { getSettings } from './settings.js';
import { logger } from './logger.js';

export const OptionsGenerator = {
    isGenerating: false,
    isManuallyStopped: false, // 新增标志，用于判断是否手动中止

    // 获取当前用户输入
    getUserInput() {
        // 这里需要根据实际情况实现
        // return ...
    },
    // ... 其他方法 ...
    async generateOptions() {
        if (this.isGenerating) {
            logger.log('已在生成选项，跳过本次请求。');
            return;
        }
        this.isManuallyStopped = false;
        const settings = getSettings();
        if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
            logger.log('选项生成功能未启用或API密钥未设置');
            return;
        }
        this.showGeneratingUI('AI助手思考中');
        this.isGenerating = true;
        try {
            const apiContext = this.getContextForAPI();
            if (apiContext.length === 0) {
                throw new Error('无法获取聊天上下文');
            }
            const userInput = this.getUserInput();
            let processedTemplate = settings.optionsTemplate
                .replace(/{{context}}/g, '对话历史已在上方消息中提供')
                .replace(/{{user_input}}/g, userInput || '用户当前输入')
                .replace(/{{char_card}}/g, this.getCharacterCard() || '角色信息')
                .replace(/{{world_info}}/g, this.getWorldInfo() || '世界设定信息');
            const finalMessages = [
                ...apiContext,
                { role: 'user', content: processedTemplate }
            ];
            let content = '';
            if (settings.optionsApiType === 'gemini') {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.optionsApiModel}:generateContent?key=${settings.optionsApiKey}`;
                logger.log('Requesting options from Gemini:', url);
                const body = { contents: this.transformMessagesForGemini(finalMessages) };
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    logger.error('API 响应错误 (raw):', errorText);
                    throw new Error('Gemini API 请求失败');
                }
                const data = await response.json();
                logger.log('API 响应数据 (Gemini):', data);
                content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } else {
                const optionsBaseUrl = settings.optionsBaseUrl;
                const optionsApiKey = settings.optionsApiKey;
                const optionsApiModel = settings.optionsApiModel;
                const apiUrl = `${optionsBaseUrl.replace(/\/$/, '')}/chat/completions`;
                logger.log('Requesting options from OpenAI-compatible API:', apiUrl);
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${optionsApiKey}`,
                    },
                    body: JSON.stringify({
                        model: optionsApiModel,
                        messages: finalMessages,
                        temperature: 0.8,
                        stream: false,
                    }),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    logger.error('API 响应错误 (raw):', errorText);
                    throw new Error('OpenAI-兼容 API 请求失败');
                }
                const data = await response.json();
                logger.log('API 响应数据 (OpenAI-兼容模式):', data);
                content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || '';
            }
            const options = this.parseOptions(content);
            logger.log('解析出的选项:', options);
            this.displayOptions(options);
        } catch (error) {
            logger.error('生成选项时出错:', error);
            this.showGeneratingUI(`生成失败: ${error.message}`, 5000);
        } finally {
            this.isGenerating = false;
        }
    },
    // ... 其他方法 ...
};