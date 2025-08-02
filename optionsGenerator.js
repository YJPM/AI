import { getSettings, PACE_PROMPTS } from './settings.js';
import { logger } from './logger.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { showPacePanelLoading, hidePacePanelLoading } from './ui.js';

function showGeneratingUI(message, duration = null) {
    logger.log(`showGeneratingUI: 尝试显示提示: "${message}"`);
    let container = document.getElementById('ti-loading-container');
    const chat = document.getElementById('chat');
    if (!chat) {
        logger.log('showGeneratingUI: chat 未找到，无法显示。');
        return;
    }
    if (!container) {
        logger.log('showGeneratingUI: 未找到现有容器，创建新容器。');
        container = document.createElement('div');
        container.id = 'ti-loading-container';
        container.classList.add('typing_indicator');
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.width = '100%';
        container.style.padding = '8px 16px';
        container.style.margin = '8px auto';
        container.style.maxWidth = '90%';
        container.style.textAlign = 'center';
        container.style.color = 'var(--text_color)';
        container.style.backgroundColor = 'transparent';
        chat.appendChild(container);
        logger.log('showGeneratingUI: 容器已附加到 chat。');
    } else {
        logger.log('showGeneratingUI: 找到现有容器，更新内容并尝试显示。');
    }
    
    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
            <div>${message}</div>
        </div>
    `;
    container.style.display = 'flex';
    logger.log(`showGeneratingUI: 最终容器 display 属性: ${container.style.display}`);
    if (duration) {
        logger.log(`showGeneratingUI: 将在 ${duration}ms 后隐藏。`);
        setTimeout(() => {
            hideGeneratingUI();
        }, duration);
    }
}

function hideGeneratingUI() {
    const container = document.getElementById('ti-loading-container');
    if (container) {
        container.remove();
        logger.log('hideGeneratingUI: 隐藏提示。');
    }
}

async function displayOptionsStreaming(content) {
    const suggestions = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim()).filter(Boolean);
    
    // 如果还没有容器，创建容器
    let container = document.getElementById('ti-options-container');
    if (!container) {
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) oldContainer.remove();
        const sendForm = document.getElementById('send_form');
        if (!sendForm) return;
        
        container = document.createElement('div');
        container.id = 'ti-options-container';
        container.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 10px;
            background-color: #1a1a1a;
        `;
        sendForm.insertAdjacentElement('beforebegin', container);
        
        // 在流式生成过程中，不隐藏思考提示
        // 只有在流式生成完成后才隐藏
    }
    
    // 获取当前发送模式
    const settings = getSettings();
    const sendMode = settings.sendMode || 'manual';
    
    // 更新或创建按钮
    suggestions.forEach((text, index) => {
        let btn = container.querySelector(`[data-option-index="${index}"]`);
        if (!btn) {
            // 创建新按钮
            btn = document.createElement('button');
            btn.className = 'qr--button menu_button interactable ti-options-capsule';
            btn.setAttribute('data-option-index', index);
            btn.style.cssText = `
                flex: 0 0 calc(25% - 6px);
                min-width: 150px;
                padding: 8px;
                border: 1px solid var(--SmartThemeBorderColor, #ccc);
                border-radius: 6px;
                background-color: rgb(30, 44, 70);
                cursor: pointer;
                transition: none;
                word-wrap: break-word;
                white-space: normal;
                font-family: CooperZhengKai;
                color: rgba(255, 252, 226, 0.79);
                line-height: 28px;
                font-size: 22px;
            `;
            container.appendChild(btn);
            
            // 设置点击事件
            btn.onclick = () => {
                const textarea = document.querySelector('#send_textarea, .send_textarea');
                const sendButton = document.querySelector('#send_but, .send_but, button[onclick*="send"], button[onclick*="Send"]');
                
                if (textarea) {
                    textarea.value = text;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.focus();
                    
                    // 根据发送模式决定是否自动发送
                    if (sendMode === 'auto' && sendButton) {
                        sendButton.click();
                    }
                }
                container.remove();
            };
        }
        
        // 更新按钮文字（只在文字变化时更新，避免跳动）
        if (btn.textContent !== text) {
            btn.textContent = text;
        }
    });
    
    // 移除多余的按钮
    const existingButtons = container.querySelectorAll('[data-option-index]');
    existingButtons.forEach((btn, index) => {
        if (index >= suggestions.length) {
            btn.remove();
        }
    });
}

async function displayOptions(options, isStreaming = false) {
    const oldContainer = document.getElementById('ti-options-container');
    if (oldContainer) oldContainer.remove();
    const sendForm = document.getElementById('send_form');
    if (!sendForm || !options || options.length === 0) {
        if (!options || options.length === 0) {
            // 只有在没有其他提示时才显示错误提示
            const loadingContainer = document.getElementById('ti-loading-container');
            if (!loadingContainer) {
                showGeneratingUI('未能生成有效选项', 3000);
            }
        }
        return;
    }
    const container = document.createElement('div');
    container.id = 'ti-options-container';
    sendForm.insertAdjacentElement('beforebegin', container);
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    
    // 获取当前发送模式
    const settings = getSettings();
    const sendMode = settings.sendMode || 'manual';
    
    // 设置容器样式，确保按钮布局
    container.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 10px 0;
    `;
    
    for (const text of options) {
        const btn = document.createElement('button');
        btn.className = 'qr--button menu_button interactable ti-options-capsule';
        btn.style.cssText = `
            flex: 0 0 calc(25% - 6px);
            min-width: 150px;
            padding: 8px 12px;
                border: 1px solid var(--SmartThemeBorderColor, #ccc);
                border-radius: 6px;
                background-color: rgb(30, 44, 70);
                cursor: pointer;
                transition: none;
                word-wrap: break-word;
                white-space: normal;
                font-family: CooperZhengKai;
                color: rgba(255, 252, 226, 0.79);
                line-height: 28px;
                font-size: 22px;
        `;
        
        // // 添加轻微的hover效果
        // btn.addEventListener('mouseover', () => {
        //     btn.style.borderColor = 'var(--SmartThemeBlurple, #007bff)';
        //     btn.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        // });
        
        // btn.addEventListener('mouseout', () => {
        //     btn.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
        //     btn.style.boxShadow = 'none';
        // });
        // container.appendChild(btn);
        
        // // 添加轻微的hover效果
        // btn.addEventListener('mouseover', () => {
        //     btn.style.borderColor = 'var(--SmartThemeBlurple, #007bff)';
        //     btn.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        // });
        
        // btn.addEventListener('mouseout', () => {
        //     btn.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
        //     btn.style.boxShadow = 'none';
        // });
        
        if (isStreaming) {
            // 流式显示：快速打字机效果
            for (let i = 0; i < text.length; i++) {
                btn.textContent = text.substring(0, i + 1);
                await sleep(1); // 从15ms减少到5ms，加快速度
            }
        } else {
            // 非流式显示：一次性显示完整文字
            btn.textContent = text;
        }
        
        btn.onclick = () => {
            const textarea = document.querySelector('#send_textarea, .send_textarea');
            const sendButton = document.querySelector('#send_but, .send_but, button[onclick*="send"], button[onclick*="Send"]');
            
            if (textarea) {
                textarea.value = text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.focus();
                
                // 根据发送模式决定是否自动发送
                if (sendMode === 'auto' && sendButton) {
                    sendButton.click();
                }
            }
            container.remove();
        };
    }
}

// 兼容型上下文提取
async function getContextCompatible(limit = 20) {
    console.log('[getContextCompatible] 开始获取上下文...');
    console.log('[getContextCompatible] window.TavernHelper:', window.TavernHelper);
    console.log('[getContextCompatible] window.SillyTavern:', window.SillyTavern);
    
    // 详细检查TavernHelper的所有属性
    if (window.TavernHelper) {
        console.log('[getContextCompatible] TavernHelper 对象存在，检查其属性:');
        console.log('[getContextCompatible] TavernHelper 类型:', typeof window.TavernHelper);
        console.log('[getContextCompatible] TavernHelper 所有属性:', Object.keys(window.TavernHelper));
        
        // 检查所有可能的方法名
        const possibleMethods = [
            'getContext',
            'getContextCompatible',
            'getChat',
            'getMessages',
            'getConversation',
            'getHistory',
            'getChatHistory',
            'getMessageHistory'
        ];
        
        for (const method of possibleMethods) {
            if (typeof window.TavernHelper[method] === 'function') {
                console.log(`[getContextCompatible] 找到可用方法: TavernHelper.${method}`);
            }
        }
    }
    
    // 检查SillyTavern原生接口
    if (window.SillyTavern) {
        console.log('[getContextCompatible] SillyTavern 对象存在，检查其属性:');
        console.log('[getContextCompatible] SillyTavern 类型:', typeof window.SillyTavern);
        console.log('[getContextCompatible] SillyTavern 所有属性:', Object.keys(window.SillyTavern));
        
        if (window.SillyTavern.chat) {
            console.log('[getContextCompatible] SillyTavern.chat 存在，长度:', window.SillyTavern.chat.length);
        }
    }
    
    // 优先使用酒馆助手的接口
    if (typeof window.TavernHelper?.getContext === 'function') {
        console.log('[getContextCompatible] 使用 TavernHelper.getContext()');
        try {
            const result = await window.TavernHelper.getContext({ tokenLimit: 8192 });
            console.log('[getContextCompatible] TavernHelper.getContext() 成功:', result);
            return result;
        } catch (error) {
            console.error('[getContextCompatible] TavernHelper.getContext() 失败:', error);
            // 降级到DOM解析
            console.log('[getContextCompatible] 降级到DOM解析...');
        }
    } else {
        console.log('[getContextCompatible] TavernHelper.getContext() 不可用，尝试其他方法...');
        
        // 尝试其他可能的接口
        if (typeof window.TavernHelper?.getChat === 'function') {
            console.log('[getContextCompatible] 尝试使用 TavernHelper.getChat()');
            try {
                const result = await window.TavernHelper.getChat();
                console.log('[getContextCompatible] TavernHelper.getChat() 成功:', result);
                return { messages: result };
            } catch (error) {
                console.error('[getContextCompatible] TavernHelper.getChat() 失败:', error);
            }
        }
        
        // 尝试SillyTavern原生接口
        if (window.SillyTavern?.chat) {
            console.log('[getContextCompatible] 尝试使用 SillyTavern.chat');
            try {
                const messages = window.SillyTavern.chat.map(msg => ({
                    role: msg.is_user ? 'user' : 'assistant',
                    content: msg.mes
                }));
                console.log('[getContextCompatible] SillyTavern.chat 解析成功:', messages);
                return { messages: messages.slice(-limit) };
            } catch (error) {
                console.error('[getContextCompatible] SillyTavern.chat 解析失败:', error);
            }
        }
        
        // 尝试通过酒馆助手的其他方法获取消息
        if (typeof window.TavernHelper?.getMessages === 'function') {
            console.log('[getContextCompatible] 尝试使用 TavernHelper.getMessages()');
            try {
                const result = await window.TavernHelper.getMessages();
                console.log('[getContextCompatible] TavernHelper.getMessages() 成功:', result);
                return { messages: result };
            } catch (error) {
                console.error('[getContextCompatible] TavernHelper.getMessages() 失败:', error);
            }
        }
    }
    
    // DOM fallback
    console.log('[getContextCompatible] 开始DOM解析...');
    const messageElements = document.querySelectorAll('#chat .mes');
    console.log('[getContextCompatible] 找到消息元素数量:', messageElements.length);
    
    const messages = [];
    messageElements.forEach((el, index) => {
        const contentEl = el.querySelector('.mes_text');
        if (contentEl) {
            let role = 'system';
            const isUserAttr = el.getAttribute('is_user');
            if (isUserAttr === 'true') role = 'user';
            else if (isUserAttr === 'false') role = 'assistant';
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = contentEl.innerHTML.replace(/<br\s*\/?>/gi, '\n');
            const content = (tempDiv.textContent || tempDiv.innerText || '').trim();
            
            if (content && (role === 'user' || role === 'assistant')) {
                messages.push({ role, content });
                console.log(`[getContextCompatible] 解析消息 ${index}:`, { role, content: content.substring(0, 50) + '...' });
            }
        }
    });
    
    const result = { messages: messages.slice(-limit) };
    console.log('[getContextCompatible] DOM解析完成，消息数量:', result.messages.length);
    console.log('[getContextCompatible] 最终结果:', result);
    return result;
}

// 在建议生成/选择后定期分析
async function generateOptions() {
    console.log('[generateOptions] 开始生成选项...');
    const settings = getSettings();
    if (OptionsGenerator.isGenerating) {
        console.log('[generateOptions] 正在生成中，跳过...');
        return;
    }
    OptionsGenerator.isManuallyStopped = false;
    if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
        console.log('[generateOptions] 选项生成未启用或缺少API密钥');
        return;
    }
    
    console.log('[generateOptions] 设置检查通过，开始生成...');
    OptionsGenerator.isGenerating = true;
    
    try {
        // 根据推进节奏选择提示模板
        const paceMode = settings.paceMode || 'normal';
        console.log('[generateOptions] 当前推进节奏:', paceMode);
        let promptTemplate;
        
        // 根据推进节奏选择模板
        promptTemplate = PACE_PROMPTS[paceMode] || PACE_PROMPTS.normal;
        
        // 组装合并prompt
        console.log('[generateOptions] 开始获取上下文...');
        const context = await getContextCompatible();
        console.log('[generateOptions] 上下文获取完成，消息数量:', context.messages.length);
        
        const prompt = promptTemplate
            .replace(/{{context}}/g, context.messages.map(m => `[${m.role}] ${m.content}`).join('\n'));
        console.log('[generateOptions] 提示词组装完成，长度:', prompt.length);
        
        const finalMessages = [{ role: 'user', content: prompt }];
        let content = '';
        const apiUrl = `${settings.optionsBaseUrl.replace(/\/$/, '')}/chat/completions`;
        console.log('[generateOptions] API URL:', apiUrl);
        console.log('[generateOptions] 模型:', settings.optionsApiModel);
        
        if (settings.streamOptions) {
            console.log('[generateOptions] 使用流式生成...');
            // 流式生成
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.optionsApiKey}`,
                },
                body: JSON.stringify({
                    model: settings.optionsApiModel,
                    messages: finalMessages,
                    temperature: 0.8,
                    stream: true,
                }),
            });
            
            console.log('[generateOptions] API响应状态:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[generateOptions] API响应错误:', errorText);
                logger.error('API 响应错误 (raw):', errorText);
                throw new Error('API 请求失败');
            }
            
            console.log('[generateOptions] 开始处理流式响应...');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta?.content || '';
                            content += delta;
                            
                            // 实时更新选项显示
                            await displayOptionsStreaming(content);
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
            
            console.log('[generateOptions] 流式生成完成，总内容长度:', content.length);
            // 流式生成完成
            // 解析建议
            const suggestions = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim()).filter(Boolean);
            console.log('[generateOptions] 解析到选项数量:', suggestions.length);
            console.log('[generateOptions] 选项内容:', suggestions);
            
            // 等待选项完全显示后再隐藏loading
            await displayOptions(suggestions, true); // true表示流式显示
            hidePacePanelLoading();
        } else {
            console.log('[generateOptions] 使用非流式生成...');
            // 非流式生成
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.optionsApiKey}`,
                },
                body: JSON.stringify({
                    model: settings.optionsApiModel,
                    messages: finalMessages,
                    temperature: 0.8,
                    stream: false,
                }),
            });
            
            console.log('[generateOptions] API响应状态:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[generateOptions] API响应错误:', errorText);
                logger.error('API 响应错误 (raw):', errorText);
                throw new Error('API 请求失败');
            }
            
            const data = await response.json();
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || '';
            console.log('[generateOptions] 非流式生成完成，内容长度:', content.length);
            
            // 解析建议
            const suggestions = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim()).filter(Boolean);
            console.log('[generateOptions] 解析到选项数量:', suggestions.length);
            console.log('[generateOptions] 选项内容:', suggestions);
            
            // 等待选项完全显示后再隐藏loading
            await displayOptions(suggestions, false); // false表示非流式显示
            hidePacePanelLoading();
        }
    } catch (error) {
        console.error('[generateOptions] 生成选项时出错:', error);
        logger.error('生成选项时出错:', error);
        hidePacePanelLoading();
    } finally {
        console.log('[generateOptions] 生成完成，重置状态');
        OptionsGenerator.isGenerating = false;
    }
}

/**
 * 测试API连接并获取模型列表
 * @returns {Promise<Object>} 包含连接状态、错误信息和模型列表的对象
 */
async function testApiConnection() {
    const settings = getSettings();
    try {
        // 获取当前设置
        const apiKey = settings.optionsApiKey;
        const apiType = settings.optionsApiType;
        const model = settings.optionsApiModel;
        const baseUrl = settings.optionsBaseUrl || 'https://api.openai.com/v1';
        
        // 验证API密钥
        if (!apiKey) {
            return {
                success: false,
                message: '请输入API密钥'
            };
        }
        
        // 根据API类型构建不同的请求
        if (apiType === 'gemini') {
            // Google Gemini API
            try {
                // 构建Gemini API URL
                const geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1';
                
                // 获取模型列表
                const modelsResponse = await fetch(`${geminiBaseUrl}/models?key=${apiKey}`);
                
                if (!modelsResponse.ok) {
                    const errorData = await modelsResponse.json();
                    return {
                        success: false,
                        message: `连接失败: ${errorData.error?.message || '未知错误'}`
                    };
                }
                
                const modelsData = await modelsResponse.json();
                
                // 过滤出Gemini模型
                const geminiModels = modelsData.models.filter(m => 
                    m.name.includes('gemini') || 
                    m.displayName?.includes('Gemini')
                );
                
                // 查找当前设置的模型
                const currentModel = geminiModels.find(m => m.name === model) || 
                                    geminiModels.find(m => m.name.includes(model)) || 
                                    geminiModels[0];
                
                // 获取API实际返回的模型名称，而不是用户设置的模型名称
                const actualModelName = currentModel?.displayName || currentModel?.name || '未知模型';
                return {
                    success: true,
                    message: '连接成功!',
                    models: geminiModels,
                    currentModel: currentModel?.name,
                    actualModelName: actualModelName
                };
            } catch (error) {
                logger.error('Gemini API连接测试失败:', error);
                return {
                    success: false,
                    message: `连接失败: ${error.message}`
                };
            }
        } else {
            // OpenAI兼容API
            try {
                // 构建请求URL
                const modelsUrl = `${baseUrl}/models`;
                
                // 发送请求获取模型列表
                const response = await fetch(modelsUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: { message: '未知错误' } }));
                    return {
                        success: false,
                        message: `连接失败: ${errorData.error?.message || '未知错误'}`
                    };
                }
                
                const data = await response.json();
                
                // 查找当前设置的模型
                const currentModel = data.data.find(m => m.id === model) || data.data[0];
                
                // 获取API实际返回的模型名称，而不是用户设置的模型名称
                const actualModelName = currentModel?.id || '未知模型';
                return {
                    success: true,
                    message: '连接成功!',
                    models: data.data,
                    currentModel: currentModel?.id,
                    actualModelName: actualModelName
                };
            } catch (error) {
                logger.error('OpenAI API连接测试失败:', error);
                return {
                    success: false,
                    message: `连接失败: ${error.message}`
                };
            }
        }
    } catch (error) {
        logger.error('API连接测试失败:', error);
        return {
            success: false,
            message: `连接失败: ${error.message}`
        };
    }
}

export class OptionsGenerator {
    static isManuallyStopped = false;
    static isGenerating = false;
    
    static showGeneratingUI = showGeneratingUI;
    static hideGeneratingUI = hideGeneratingUI;
    static displayOptions = displayOptions;
    static displayOptionsStreaming = displayOptionsStreaming;
    static generateOptions = generateOptions;
    static testApiConnection = testApiConnection;
    
    // 测试TavernHelper接口
    static async testTavernHelper() {
        console.log('=== 开始测试TavernHelper接口 ===');
        console.log('window.TavernHelper:', window.TavernHelper);
        console.log('window.SillyTavern:', window.SillyTavern);
        
        if (typeof window.TavernHelper !== 'undefined') {
            console.log('TavernHelper 可用，测试其方法...');
            
            // 测试可用的方法
            const methods = [
                'getContext',
                'getCharAvatarPath',
                'getWorldBooks',
                'getVariables'
            ];
            
            for (const method of methods) {
                if (typeof window.TavernHelper[method] === 'function') {
                    console.log(`TavernHelper.${method} 可用`);
                    try {
                        if (method === 'getContext') {
                            const result = await window.TavernHelper[method]({ tokenLimit: 1000 });
                            console.log(`${method} 结果:`, result);
                        } else {
                            const result = window.TavernHelper[method]();
                            console.log(`${method} 结果:`, result);
                        }
                    } catch (error) {
                        console.error(`${method} 调用失败:`, error);
                    }
                } else {
                    console.log(`TavernHelper.${method} 不可用`);
                }
            }
        } else {
            console.log('TavernHelper 不可用');
        }
        
        console.log('=== TavernHelper接口测试完成 ===');
    }
    
    // 详细诊断接口问题
    static async diagnoseInterfaces() {
        console.log('=== 开始诊断接口问题 ===');
        
        // 检查所有可能的全局对象
        const globalObjects = [
            'TavernHelper',
            'SillyTavern',
            'window.TavernHelper',
            'window.SillyTavern'
        ];
        
        for (const objName of globalObjects) {
            try {
                const obj = eval(objName);
                console.log(`${objName}:`, obj);
                if (obj && typeof obj === 'object') {
                    console.log(`${objName} 属性:`, Object.keys(obj));
                }
            } catch (error) {
                console.log(`${objName}: 未定义`);
            }
        }
        
        // 检查页面上的脚本标签
        const scripts = document.querySelectorAll('script');
        console.log('页面上的脚本数量:', scripts.length);
        for (let i = 0; i < Math.min(scripts.length, 10); i++) {
            const script = scripts[i];
            if (script.src) {
                console.log(`脚本 ${i}:`, script.src);
            }
        }
        
        // 检查扩展相关的元素
        const extensionElements = document.querySelectorAll('[id*="tavern"], [class*="tavern"], [id*="helper"], [class*="helper"]');
        console.log('可能的扩展元素:', extensionElements.length);
        
        console.log('=== 接口诊断完成 ===');
    }
}

// 将OptionsGenerator导出到全局作用域，以便在控制台中调用
window.OptionsGenerator = OptionsGenerator;