import { getSettings, PACE_PROMPTS, CONSTANTS } from './settings.js';
import { logger } from './logger.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { showPacePanelLoading, hidePacePanelLoading } from './ui.js';

// 常量定义
const OPTIONS_CONSTANTS = {
    CONTAINER_ID: 'ti-loading-container',
    OPTIONS_CONTAINER_ID: 'ti-options-container',
    CHAT_SELECTOR: '#chat',
    SEND_FORM_SELECTOR: '#send_form',
    OPTION_BUTTON_CLASS: 'qr--button menu_button interactable ti-options-capsule',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    STREAM_CHUNK_SIZE: 1024,
    API_TIMEOUT: 30000
};

// 工具函数
const Utils = {
    safeQuerySelector(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            return null;
        }
    },
    
    safeCreateElement(tagName, attributes = {}) {
        try {
            const element = document.createElement(tagName);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            return element;
        } catch (error) {
            return null;
        }
    },
    
    extractSuggestions(content) {
        try {
            return (content.match(/【(.*?)】/g) || [])
                .map(m => m.replace(/[【】]/g, '').trim())
                .filter(Boolean);
        } catch (error) {
            return [];
        }
    }
};

// UI管理类
class UIManager {
    static showGeneratingUI(message, duration = null) {
        const chat = Utils.safeQuerySelector(OPTIONS_CONSTANTS.CHAT_SELECTOR);
        if (!chat) return;
        
        let container = document.getElementById(OPTIONS_CONSTANTS.CONTAINER_ID);
        if (!container) {
            container = Utils.safeCreateElement('div', {
                id: OPTIONS_CONSTANTS.CONTAINER_ID,
                className: 'typing_indicator'
            });
            
            if (!container) return;
            
            Object.assign(container.style, {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                padding: '8px 16px',
                margin: '8px auto',
                maxWidth: '90%',
                textAlign: 'center',
                color: 'var(--text_color)',
                backgroundColor: 'transparent'
            });
            
            chat.appendChild(container);
        }
        
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                <div>${message}</div>
            </div>
        `;
        container.style.display = 'flex';
        
        if (duration) {
            setTimeout(() => {
                UIManager.hideGeneratingUI();
            }, duration);
        }
    }
    
    static hideGeneratingUI() {
        const container = document.getElementById(OPTIONS_CONSTANTS.CONTAINER_ID);
        if (container) {
            container.remove();
        }
    }
    
    static createOptionsContainer() {
        const oldContainer = document.getElementById(OPTIONS_CONSTANTS.OPTIONS_CONTAINER_ID);
        if (oldContainer) {
            oldContainer.remove();
        }
        
        const sendForm = Utils.safeQuerySelector(OPTIONS_CONSTANTS.SEND_FORM_SELECTOR);
        if (!sendForm) return null;
        
        const container = Utils.safeCreateElement('div', {
            id: OPTIONS_CONSTANTS.OPTIONS_CONTAINER_ID
        });
        
        if (!container) return null;
        
        Object.assign(container.style, {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            margin: '10px'
        });
        
        sendForm.insertAdjacentElement('beforebegin', container);
        return container;
    }
    
    static createOptionButton(text, index, sendMode) {
        const btn = Utils.safeCreateElement('button', {
            className: OPTIONS_CONSTANTS.OPTION_BUTTON_CLASS,
            'data-option-index': index
        });
        
        if (!btn) return null;
        
        btn.textContent = text;
        
        Object.assign(btn.style, {
            flex: '1',
            whiteSpace: 'normal',
            textAlign: 'center',
            margin: '0',
            height: 'auto',
            minWidth: '140px',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#333',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)'
        });
        
        btn.addEventListener('mouseover', () => {
            btn.style.background = '#f8f9fa';
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
            btn.style.transform = 'translateY(-1px)';
        });
        
        btn.addEventListener('mouseout', () => {
            btn.style.background = 'rgba(255, 255, 255, 0.9)';
            btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
            btn.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('click', () => {
            UIManager.handleOptionClick(btn, text, sendMode);
        });
        
        return btn;
    }
    
    static handleOptionClick(btn, text, sendMode) {
        const settings = getSettings();
        
        if (sendMode === 'manual') {
            const isSelected = btn.classList.contains('selected');
            if (isSelected) {
                btn.classList.remove('selected');
                btn.style.background = 'rgba(255, 255, 255, 0.9)';
                btn.style.color = '#333';
                OptionsGenerator.selectedOptions = OptionsGenerator.selectedOptions.filter(option => option !== text);
            } else {
                btn.classList.add('selected');
                btn.style.background = 'var(--SmartThemeBlurple, #007bff)';
                btn.style.color = 'white';
                OptionsGenerator.selectedOptions.push(text);
            }
        } else {
            const textarea = Utils.safeQuerySelector('#send_textarea, .send_textarea');
            if (textarea) {
                textarea.value = text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                
                const sendButton = Utils.safeQuerySelector('#send_but, .send_but');
                if (sendButton) {
                    sendButton.click();
                }
            }
        }
    }
}

async function displayOptions(options, isStreaming = false) {
    const oldContainer = document.getElementById('ti-options-container');
    if (oldContainer) oldContainer.remove();
    const sendForm = document.getElementById('send_form');
    if (!sendForm || !options || options.length === 0) {
        if (!options || options.length === 0) {
            const loadingContainer = document.getElementById('ti-loading-container');
            if (!loadingContainer) {
                UIManager.showGeneratingUI('未能生成有效选项', 3000);
            }
        }
        return;
    }
    const container = document.createElement('div');
    container.id = 'ti-options-container';
    sendForm.insertAdjacentElement('beforebegin', container);
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    
    const settings = getSettings();
    const sendMode = settings.sendMode || 'manual';
    
    if (sendMode === 'manual') {
        OptionsGenerator.selectedOptions = [];
    }
    
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
            cursor: pointer;
            transition: none;
            word-wrap: break-word;
            white-space: normal;
        `;
        
        btn.addEventListener('mouseover', () => {
            btn.style.borderColor = 'rgb(28 35 48)';
            btn.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        });
        
        btn.addEventListener('mouseout', () => {
            btn.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
            btn.style.boxShadow = 'none';
        });
        container.appendChild(btn);
        
        if (isStreaming) {
            for (let i = 0; i < text.length; i++) {
                btn.textContent = text.substring(0, i + 1);
                await sleep(1);
            }
        } else {
            btn.textContent = text;
        }
        
        btn.onclick = () => {
            const textarea = document.querySelector('#send_textarea, .send_textarea');
            const sendButton = document.querySelector('#send_but, .send_but, button[onclick*="send"], button[onclick*="Send"]');
            
            if (textarea) {
                if (sendMode === 'manual') {
                    const isSelected = OptionsGenerator.selectedOptions.includes(text);
                    
                    if (isSelected) {
                        OptionsGenerator.selectedOptions = OptionsGenerator.selectedOptions.filter(option => option !== text);
                        btn.style.background = 'var(--SmartThemeBackgroundColor, #fff)';
                        btn.style.color = 'var(--SmartThemeBodyColor, #222)';
                        btn.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
                    } else {
                        OptionsGenerator.selectedOptions.push(text);
                        btn.style.background = 'var(--SmartThemeBlurple, #007bff)';
                        btn.style.color = 'white';
                        btn.style.borderColor = 'var(--SmartThemeBlurple, #007bff)';
                    }
                    
                    if (OptionsGenerator.selectedOptions.length > 0) {
                        textarea.value = OptionsGenerator.selectedOptions.join(' ');
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        textarea.focus();
                    } else {
                        textarea.value = '';
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        textarea.focus();
                    }
                } else {
                    textarea.value = text;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.focus();
                    
                    if (sendMode === 'auto' && sendButton) {
                        sendButton.click();
                    }
                    container.remove();
                }
            }
        };
    }
}

// 简化的上下文提取 - 只获取最近10条消息
async function getContextCompatible(limit = 10) {
    let messages = [];
    
    try {
        if (typeof window.messages === 'function') {
            const messageHistory = window.messages();
            if (messageHistory && Array.isArray(messageHistory) && messageHistory.length > 0) {
                messages = messageHistory.slice(-limit);
            }
        }
        
        if (messages.length === 0 && window.chat && Array.isArray(window.chat)) {
            messages = window.chat.slice(-limit);
        }
        
        if (messages.length === 0) {
            const messageSelectors = [
                '#chat .mes',
                '.chat .message',
                '.message',
                '.mes',
                '[data-message]'
            ];
            
            for (const selector of messageSelectors) {
                const messageElements = document.querySelectorAll(selector);
                if (messageElements.length > 0) {
                    messageElements.forEach((mes) => {
                        let role = 'user';
                        if (mes.classList.contains('swiper-slide') || 
                            mes.classList.contains('assistant') || 
                            mes.classList.contains('ai') ||
                            mes.querySelector('.avatar') ||
                            mes.getAttribute('data-is-user') === 'false' ||
                            mes.getAttribute('data-role') === 'assistant') {
                            role = 'assistant';
                        }
                        
                        const contentSelectors = ['.mes_text', '.message', '.text', '.content'];
                        let content = null;
                        for (const contentSelector of contentSelectors) {
                            const contentElement = mes.querySelector(contentSelector);
                            if (contentElement && contentElement.textContent.trim()) {
                                content = contentElement.textContent.trim();
                                break;
                            }
                        }
                        
                        if (!content) {
                            content = mes.textContent.trim();
                        }
                        
                        if (content && content.length > 0) {
                            messages.push({ role, content });
                        }
                    });
                    
                    if (messages.length > 0) {
                        messages = messages.slice(-limit);
                        break;
                    }
                }
            }
        }
    } catch (error) {
        // 静默处理错误
    }
    
    return {
        messages: messages,
        original_message_count: messages.length
    };
}

async function generateOptions() {
    const settings = getSettings();
    if (OptionsGenerator.isGenerating) {
        return;
    }
    OptionsGenerator.isManuallyStopped = false;
    if (!settings.optionsGenEnabled || !settings.optionsApiKey) {
        return;
    }
    
    OptionsGenerator.isGenerating = true;
    
    try {
        const paceMode = settings.paceMode || 'normal';
        const promptTemplate = PACE_PROMPTS[paceMode] || PACE_PROMPTS.normal;
        
        const context = await getContextCompatible(10);
        
        let fullContextText = '';
        
        if (context.messages && context.messages.length > 0) {
            fullContextText += '## 最近对话历史\n';
            fullContextText += context.messages.map(m => `[${m.role}] ${m.content}`).join('\n');
            fullContextText += '\n\n';
        }
        
        const prompt = promptTemplate.replace(/{{context}}/g, fullContextText);
        
        const finalMessages = [{ role: 'user', content: prompt }];
        let content = '';
        
        const apiType = settings.optionsApiType || 'openai';
        let apiUrl, requestBody, headers;
        
        if (apiType === 'gemini') {
            const modelName = settings.optionsApiModel || 'gemini-pro';
            
            apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${settings.optionsApiKey}`;
            
            headers = {
                'Content-Type': 'application/json',
            };
            
            requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            };
        } else {
            apiUrl = `${settings.optionsBaseUrl.replace(/\/$/, '')}/chat/completions`;
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.optionsApiKey}`,
            };
            
            requestBody = {
                model: settings.optionsApiModel,
                messages: finalMessages,
                temperature: 0.8,
                stream: false,
            };
        }
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
            throw new Error('API 请求失败');
        }
        
        const data = await response.json();
        
        if (apiType === 'gemini') {
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
            content = data.choices?.[0]?.message?.content || '';
        }
        
        const suggestions = Utils.extractSuggestions(content);
        
        await displayOptions(suggestions, false);
        hidePacePanelLoading();
    } catch (error) {
        hidePacePanelLoading();
    } finally {
        OptionsGenerator.isGenerating = false;
    }
}

async function testApiConnection() {
    const settings = getSettings();
    try {
        const apiKey = settings.optionsApiKey;
        const apiType = settings.optionsApiType;
        const model = settings.optionsApiModel;
        const baseUrl = settings.optionsBaseUrl || 'https://api.openai.com/v1';
        
        if (!apiKey) {
            return {
                success: false,
                message: '请输入API密钥'
            };
        }
        
        if (apiType === 'gemini') {
            try {
                const geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1';
                const modelsResponse = await fetch(`${geminiBaseUrl}/models?key=${apiKey}`);
                
                if (!modelsResponse.ok) {
                    const errorData = await modelsResponse.json();
                    return {
                        success: false,
                        message: `连接失败: ${errorData.error?.message || '未知错误'}`
                    };
                }
                
                const modelsData = await modelsResponse.json();
                const geminiModels = modelsData.models.filter(m => 
                    m.name.includes('gemini') || 
                    m.displayName?.includes('Gemini')
                );
                
                const currentModel = geminiModels.find(m => m.name === model) || 
                                    geminiModels.find(m => m.name.includes(model)) || 
                                    geminiModels[0];
                
                const actualModelName = currentModel?.displayName || currentModel?.name || '未知模型';
                return {
                    success: true,
                    message: '连接成功!',
                    models: geminiModels,
                    currentModel: currentModel?.name,
                    actualModelName: actualModelName
                };
            } catch (error) {
                return {
                    success: false,
                    message: `连接失败: ${error.message}`
                };
            }
        } else {
            try {
                const modelsUrl = `${baseUrl}/models`;
                
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
                const currentModel = data.data.find(m => m.id === model) || data.data[0];
                const actualModelName = currentModel?.id || '未知模型';
                return {
                    success: true,
                    message: '连接成功!',
                    models: data.data,
                    currentModel: currentModel?.id,
                    actualModelName: actualModelName
                };
            } catch (error) {
                return {
                    success: false,
                    message: `连接失败: ${error.message}`
                };
            }
        }
    } catch (error) {
        return {
            success: false,
            message: `连接失败: ${error.message}`
        };
    }
}

export class OptionsGenerator {
    static isManuallyStopped = false;
    static isGenerating = false;
    static selectedOptions = [];
    
    static showGeneratingUI = UIManager.showGeneratingUI;
    static hideGeneratingUI = UIManager.hideGeneratingUI;
    static displayOptions = displayOptions;
    static generateOptions = generateOptions;
    static testApiConnection = testApiConnection;
}

window.OptionsGenerator = OptionsGenerator;