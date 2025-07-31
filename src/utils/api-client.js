import { logger } from '../core/logger.js';
import { getSettings } from '../core/settings.js';

/**
 * API客户端类
 */
export class APIClient {
    constructor() {
        this.settings = getSettings();
    }

    /**
     * 转换消息格式为Gemini格式
     */
    transformMessagesForGemini(messages) {
        const contents = [];
        let lastRole = '';
        messages.forEach(msg => {
            const currentRole = msg.role === 'assistant' ? 'model' : 'user';
            // Gemini API requires alternating user/model roles.
            // If the last role was also 'user', we merge the content.
            if (currentRole === 'user' && lastRole === 'user' && contents.length > 0) {
                contents[contents.length - 1].parts[0].text += `\n\n${msg.content}`;
            } else {
                contents.push({ role: currentRole, parts: [{ text: msg.content }] });
            }
            lastRole = currentRole;
        });
        // The last message must be from the user.
        if (contents.length > 0 && contents[contents.length - 1].role !== 'user') {
            contents.push({ role: 'user', parts: [{text: '(继续)'}]});
        }
        return contents;
    }

    /**
     * 调用Gemini API
     */
    async callGeminiAPI(messages) {
        const { optionsApiKey, optionsApiModel } = this.settings;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${optionsApiModel}:generateContent?key=${optionsApiKey}`;
        
        logger.log('Requesting options from Gemini:', url);
        const body = { contents: this.transformMessagesForGemini(messages) };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('Gemini API 响应错误:', errorText);
            throw new Error(`Gemini API请求失败: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        logger.log('Gemini API 响应数据:', data);
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    /**
     * 调用OpenAI兼容API
     */
    async callOpenAIAPI(messages) {
        const { optionsApiKey, optionsBaseUrl, optionsApiModel } = this.settings;
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
                messages: messages,
                temperature: 0.8,
                stream: false, // 强制非流式，与参考脚本一致
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('API 响应错误 (raw):', errorText);
            throw new Error(`API请求失败: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        logger.log('API 响应数据 (OpenAI-兼容模式):', data);
        // Per user request, parse this response as if it's from Gemini,
        // because they use a Gemini proxy. Fallback to OpenAI format.
        return data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || '';
    }

    /**
     * 生成选项
     */
    async generateOptions(messages) {
        this.settings = getSettings(); // 重新获取最新设置
        
        if (!this.settings.optionsGenEnabled || !this.settings.optionsApiKey) {
            logger.log('选项生成功能未启用或API密钥未设置');
            return '';
        }

        try {
            let content = '';
            
            if (this.settings.optionsApiType === 'gemini') {
                content = await this.callGeminiAPI(messages);
            } else { // 'openai'
                content = await this.callOpenAIAPI(messages);
            }

            return content;
        } catch (error) {
            logger.error('生成选项失败:', error);
            throw error;
        }
    }

    /**
     * 解析选项内容
     */
    parseOptions(content) {
        // 1. 优先尝试解析【...】格式
        let options = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim());
        if (options.length > 0) {
            logger.log('使用【】格式解析器成功。');
            return options.filter(Boolean);
        }

        // 2. 如果失败，尝试解析列表格式 (e.g., "- ...", "1. ...")
        const lines = content.split('\n').filter(line => line.trim() !== '');
        const listRegex = /^(?:\*|-\s|\d+\.\s)\s*(.*)/;
        options = lines.map(line => {
            const match = line.trim().match(listRegex);
            return match ? match[1].trim() : null;
        }).filter(Boolean);

        if (options.length > 0) {
            logger.log('使用列表格式解析器成功。');
            return options;
        }

        logger.log('所有解析器都未能找到选项。');
        return [];
    }
}

// 创建全局API客户端实例
export const apiClient = new APIClient(); 