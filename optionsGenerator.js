import { getSettings, MERGED_DIRECTOR_PROMPT } from './settings.js';
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
    
    for (const text of options) {
        const btn = document.createElement('button');
        btn.className = 'qr--button menu_button interactable ti-options-capsule';
        container.appendChild(btn);
        
        if (isStreaming) {
            // 流式显示：打字机效果
            for (let i = 0; i < text.length; i++) {
                btn.textContent = text.substring(0, i + 1);
                await sleep(15);
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
    // 兼容 TavernHelper 或 DOM
    if (typeof window.TavernHelper?.getContext === 'function') {
        return await window.TavernHelper.getContext({ tokenLimit: 8192 });
    } else {
        // DOM fallback
        const messageElements = document.querySelectorAll('#chat .mes');
        const messages = [];
        messageElements.forEach((el) => {
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
                }
            }
        });
        return { messages: messages.slice(-limit) };
    }
}

// 在建议生成/选择后定期分析
async function generateOptions() {
    const settings = getSettings();
    if (OptionsGenerator.isGenerating) return;
    OptionsGenerator.isManuallyStopped = false;
    if (!settings.optionsGenEnabled || !settings.optionsApiKey) return;
    
    OptionsGenerator.isGenerating = true;
    
    try {
        // 根据推进节奏选择提示模板
        const paceMode = settings.paceMode || 'balanced';
        let promptTemplate;
        
        if (paceMode === 'slow') {
            promptTemplate = `
你是我的AI叙事导演。分析最近对话，为我生成3-5个深度行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 深入分析我的心理状态和处境

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹）

## 开始
`.trim();
        } else if (paceMode === 'fast') {
            promptTemplate = `
你是我的AI叙事导演。分析最近对话，为我生成3-4个时间跨越行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 包含明显时间推进（任务完成、赴约、重要事件）
- 避免当前场景细节，直接推进到下一节点

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹，包含时间跨越）

## 开始
`.trim();
        } else if (paceMode === 'mixed') {
            promptTemplate = `
你是我的AI叙事导演。分析最近对话，为我生成4个混合节奏行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 生成4个选项，包含：
  1. 第1个：慢速深度选项（深入分析心理状态和处境）
  2. 第2个：平衡标准选项（分析场景类型、情绪、叙事焦点）
  3. 第3个：平衡标准选项（分析场景类型、情绪、叙事焦点）
  4. 第4个：快速推进选项（包含明显时间推进，如任务完成、赴约、重要事件）

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹，按上述顺序）

## 开始
`.trim();
        } else {
            // balanced 模式
            promptTemplate = `
你是我的AI叙事导演。分析最近对话，为我生成3-5个戏剧性行动建议（每条用【】包裹）。

要求：
- 始终以我的第一人称视角
- 每条建议不超过50字
- 分析场景类型、我的情绪、叙事焦点

## 最近对话
{{context}}

## 输出格式
- JSON格式分析（scene_type, user_mood, narrative_focus）
- 建议列表（单行、每条用【】包裹）

## 开始
`.trim();
        }
        
        // 组装合并prompt
        const context = await getContextCompatible();
        const prompt = promptTemplate
            .replace(/{{context}}/g, context.messages.map(m => `[${m.role}] ${m.content}`).join('\n'));
        const finalMessages = [{ role: 'user', content: prompt }];
        let content = '';
        const apiUrl = `${settings.optionsBaseUrl.replace(/\/$/, '')}/chat/completions`;
        
        // 隐藏loading状态，开始显示选项
        hidePacePanelLoading();
        
        if (settings.streamOptions) {
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
            
            if (!response.ok) {
                const errorText = await response.text();
                logger.error('API 响应错误 (raw):', errorText);
                throw new Error('API 请求失败');
            }
            
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
            
            // 流式生成完成
        } else {
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
            
            if (!response.ok) {
                const errorText = await response.text();
                logger.error('API 响应错误 (raw):', errorText);
                throw new Error('API 请求失败');
            }
            
            const data = await response.json();
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || '';
        }
        
        // 解析建议
        const suggestions = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim()).filter(Boolean);
        
        await displayOptions(suggestions, false); // false表示非流式显示
    } catch (error) {
        logger.error('生成选项时出错:', error);
    } finally {
        OptionsGenerator.isGenerating = false;
        hidePacePanelLoading(); // 确保隐藏loading状态
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
    
    // 静态方法引用
    static showGeneratingUI = showGeneratingUI;
    static hideGeneratingUI = hideGeneratingUI;
    static displayOptions = displayOptions;
    static displayOptionsStreaming = displayOptionsStreaming;
    static generateOptions = generateOptions;
    static testApiConnection = testApiConnection;
}