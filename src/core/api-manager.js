/**
 * API管理类
 */
import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class APIManager {
  constructor() {
    this.providers = {
      openai: new OpenAIProvider(),
      gemini: new GeminiProvider()
    };
  }

  /**
   * 生成选项
   * @param {Array} context 对话上下文
   * @param {string} template 提示模板
   * @param {Object} settings 设置
   * @returns {Promise<string>} API响应内容
   */
  async generateOptions(context, template, settings) {
    const provider = this.providers[settings.optionsApiType];
    if (!provider) {
      throw new Error(`不支持的API类型: ${settings.optionsApiType}`);
    }

    return await logger.time('API调用', () => 
      provider.generate(context, template, settings)
    );
  }
}

/**
 * OpenAI API提供者
 */
class OpenAIProvider {
  async generate(context, template, settings) {
    const { optionsApiKey, optionsBaseUrl, optionsApiModel } = settings;
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
        messages: [
          ...context,
          { role: 'user', content: template }
        ],
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('API 响应错误 (raw):', errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.log('API 响应数据 (OpenAI-兼容模式):', data);
    
    // 优先尝试Gemini格式，然后回退到OpenAI格式
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 
           data.choices?.[0]?.message?.content || '';
  }
}

/**
 * Google Gemini API提供者
 */
class GeminiProvider {
  async generate(context, template, settings) {
    const { optionsApiKey, optionsApiModel } = settings;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${optionsApiModel}:generateContent?key=${optionsApiKey}`;
    
    logger.log('Requesting options from Gemini:', url);
    
    const transformedMessages = this.transformMessagesForGemini([
      ...context,
      { role: 'user', content: template }
    ]);
    
    const body = { contents: transformedMessages };

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
   * 转换消息格式为Gemini格式
   * @param {Array} messages 消息数组
   * @returns {Array} 转换后的消息
   */
  transformMessagesForGemini(messages) {
    const contents = [];
    let lastRole = '';
    
    messages.forEach(msg => {
      const currentRole = msg.role === 'assistant' ? 'model' : 'user';
      
      // Gemini API需要交替的用户/模型角色
      if (currentRole === 'user' && lastRole === 'user' && contents.length > 0) {
        contents[contents.length - 1].parts[0].text += `\n\n${msg.content}`;
      } else {
        contents.push({ role: currentRole, parts: [{ text: msg.content }] });
      }
      lastRole = currentRole;
    });
    
    // 最后一条消息必须来自用户
    if (contents.length > 0 && contents[contents.length - 1].role !== 'user') {
      contents.push({ role: 'user', parts: [{text: '(继续)'}]});
    }
    
    return contents;
  }
} 