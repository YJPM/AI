/**
 * AI导演 - API调用模块
 * 支持OpenAI和Google Gemini API的调用
 */

/**
 * 调用OpenAI兼容的API
 * @param {Array} messages - 消息数组
 * @param {boolean} stream - 是否使用流式传输
 * @param {string} overrideModel - 覆盖默认模型
 * @param {number} overrideTemp - 覆盖默认温度参数
 * @param {Object} settings - API设置
 * @returns {Promise<string>} - API响应内容
 */
export async function callOpenAIAPI(messages, stream, overrideModel = null, overrideTemp = 0.8, settings) {
    const { apiKey, baseUrl, model } = settings;
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${apiKey}` 
        },
        body: JSON.stringify({ 
            model: overrideModel || model, 
            messages, 
            temperature: overrideTemp, 
            stream 
        }),
    });

    if (!response.ok) { 
        throw new Error(`API请求失败, ${response.status}: ${await response.text()}`); 
    }

    if (stream) {
        let fullResponseText = ''; 
        const reader = response.body.getReader(); 
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read(); 
            if (done) break;
            
            decoder.decode(value, { stream: true })
                .split('\n\n')
                .filter(l => l.startsWith('data: '))
                .forEach(l => {
                    const jsonStr = l.substring(6); 
                    if (jsonStr === '[DONE]') return;
                    try { 
                        fullResponseText += JSON.parse(jsonStr).choices?.[0]?.delta?.content || ''; 
                    } catch (e) {}
                });
        }
        return fullResponseText;
    } else { 
        const data = await response.json(); 
        return data.choices?.[0]?.message?.content || ''; 
    }
}

/**
 * 调用Google Gemini API
 * @param {Array} messages - 消息数组
 * @param {Object} settings - API设置
 * @returns {Promise<string>} - API响应内容
 */
export async function callGeminiAPI(messages, settings) {
    const { apiKey, model } = settings;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = { contents: transformMessagesForGemini(messages) };
    
    const response = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
    });
    
    if (!response.ok) { 
        throw new Error(`Gemini API请求失败, ${response.status}: ${await response.text()}`); 
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * 将消息转换为Gemini API格式
 * @param {Array} messages - 消息数组
 * @returns {Array} - 转换后的消息数组
 */
function transformMessagesForGemini(messages) {
    const contents = []; 
    let lastRole = '';
    
    messages.forEach(msg => {
        if (msg.role === 'user' && lastRole === 'user') { 
            contents[contents.length - 1].parts[0].text += `\n\n${msg.content}`; 
        } else { 
            contents.push({ 
                role: msg.role === 'assistant' ? 'model' : 'user', 
                parts: [{ text: msg.content }] 
            }); 
        }
        lastRole = msg.role;
    });
    
    return contents;
}

/**
 * 统一API调用接口
 * @param {string} prompt - 提示内容
 * @param {boolean} stream - 是否使用流式传输
 * @param {Object} settings - API设置
 * @param {Object} context - 聊天上下文
 * @returns {Promise<string>} - API响应内容
 */
export async function callDirectorAPI(prompt, stream, settings, context) {
    if (!context) throw new Error('无法获取上下文');
    
    const finalMessages = [...context.messages, { role: 'user', content: prompt }];
    
    if (settings.apiType === 'gemini') {
        return callGeminiAPI(finalMessages, settings);
    } else {
        return callOpenAIAPI(finalMessages, stream, settings.model, 0.8, settings);
    }
} 