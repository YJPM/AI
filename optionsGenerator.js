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
    // 安全的DOM查询
    safeQuerySelector(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            logger.error('DOM查询失败:', selector, error);
            return null;
        }
    },
    
    // 安全的DOM创建
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
            logger.error('DOM元素创建失败:', tagName, error);
            return null;
        }
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 安全的JSON解析
    safeJsonParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            logger.warn('JSON解析失败:', str, error);
            return defaultValue;
        }
    },
    
    // 提取建议选项
    extractSuggestions(content) {
        try {
            return (content.match(/【(.*?)】/g) || [])
                .map(m => m.replace(/[【】]/g, '').trim())
                .filter(Boolean);
        } catch (error) {
            logger.error('提取建议选项失败:', error);
            return [];
        }
    }
};

// UI管理类
class UIManager {
    static showGeneratingUI(message, duration = null) {
        logger.log(`显示生成提示: "${message}"`);
        
        const chat = Utils.safeQuerySelector(OPTIONS_CONSTANTS.CHAT_SELECTOR);
        if (!chat) {
            logger.log('聊天容器未找到，无法显示提示');
            return;
        }
        
        let container = document.getElementById(OPTIONS_CONSTANTS.CONTAINER_ID);
        if (!container) {
            logger.log('创建新的提示容器');
            container = Utils.safeCreateElement('div', {
                id: OPTIONS_CONSTANTS.CONTAINER_ID,
                className: 'typing_indicator'
            });
            
            if (!container) {
                logger.error('无法创建提示容器');
                return;
            }
            
            // 设置样式
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
        
        // 更新内容
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                <div>${message}</div>
            </div>
        `;
        container.style.display = 'flex';
        
        // 设置自动隐藏
        if (duration) {
            logger.log(`将在 ${duration}ms 后自动隐藏提示`);
            setTimeout(() => {
                UIManager.hideGeneratingUI();
            }, duration);
        }
    }
    
    static hideGeneratingUI() {
        const container = document.getElementById(OPTIONS_CONSTANTS.CONTAINER_ID);
        if (container) {
            container.remove();
            logger.log('隐藏生成提示');
        }
    }
    
    static createOptionsContainer() {
        const oldContainer = document.getElementById(OPTIONS_CONSTANTS.OPTIONS_CONTAINER_ID);
        if (oldContainer) {
            oldContainer.remove();
        }
        
        const sendForm = Utils.safeQuerySelector(OPTIONS_CONSTANTS.SEND_FORM_SELECTOR);
        if (!sendForm) {
            logger.error('发送表单未找到');
            return null;
        }
        
        const container = Utils.safeCreateElement('div', {
            id: OPTIONS_CONSTANTS.OPTIONS_CONTAINER_ID
        });
        
        if (!container) {
            logger.error('无法创建选项容器');
            return null;
        }
        
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
        
        if (!btn) {
            logger.error('无法创建选项按钮');
            return null;
        }
        
        btn.textContent = text;
        
        // 设置样式
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
        
        // 添加事件监听器
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
            // 手动模式：切换选中状态
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
            // 自动模式：直接发送
            const textarea = Utils.safeQuerySelector('#send_textarea, .send_textarea');
            if (textarea) {
                textarea.value = text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                
                // 触发发送
                const sendButton = Utils.safeQuerySelector('#send_but, .send_but');
                if (sendButton) {
                    sendButton.click();
                }
            }
        }
    }
}



async function displayOptions(sceneAnalysis, options, isStreaming = false) {
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

    // ===== 上下文可视化区域 =====
    if (sceneAnalysis) {
        const viz = document.createElement('div');
        viz.className = 'context-viz';
        viz.innerHTML = `
            <div class="viz-header">📊 当前场景分析</div>
            <div class="viz-content">
                <div class="viz-item"><span class="label">场景类型:</span><span class="value">${sceneAnalysis.scene_type || ''}</span></div>
                <div class="viz-item"><span class="label">我的情绪:</span><span class="value">${sceneAnalysis.user_mood || sceneAnalysis.my_mood || ''}</span></div>
                <div class="viz-item"><span class="label">叙事重点:</span><span class="value">${sceneAnalysis.narrative_focus || ''}</span></div>
                <div class="viz-item"><span class="label">故事方向:</span><span class="value">${sceneAnalysis.story_direction || ''}</span></div>
            </div>
        `;
        container.appendChild(viz);
    }

    // ===== 选项展示区域 =====
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 10px 0;
    `;
    const optionsRow = document.createElement('div');
    optionsRow.style.display = 'flex';
    optionsRow.style.flexWrap = 'wrap';
    optionsRow.style.gap = '8px';
    container.appendChild(optionsRow);

    // ===== 反馈统计面板（可选） =====
    const feedbackStats = document.createElement('div');
    feedbackStats.className = 'feedback-panel';
    feedbackStats.style.display = 'none'; // 默认隐藏
    feedbackStats.innerHTML = `
        <div class="feedback-header"><b>📊 选项反馈统计</b></div>
        <div class="feedback-stats">
            <span>👍有用: <span id="useful-count">0</span></span>
            <span>👎无用: <span id="useless-count">0</span></span>
            <span>⚠️报告: <span id="report-count">0</span></span>
        </div>
    `;
    container.appendChild(feedbackStats);

    // ===== 选项按钮及反馈 =====
    options.forEach((text, idx) => {
        const btnWrap = document.createElement('div');
        btnWrap.style.display = 'flex';
        btnWrap.style.flexDirection = 'column';
        btnWrap.style.alignItems = 'center';
        btnWrap.style.margin = '4px';
        btnWrap.style.flex = '0 0 calc(25% - 6px)';
        // 选项按钮
        const btn = document.createElement('button');
        btn.className = 'qr--button menu_button interactable ti-options-capsule';
        btn.textContent = text;
        btn.style.cssText = `min-width: 150px; padding: 8px 12px; margin-bottom: 4px;`;
        btn.onclick = () => {
            const textarea = document.querySelector('#send_textarea, .send_textarea');
            const sendButton = document.querySelector('#send_but, .send_but, button[onclick*="send"], button[onclick*="Send"]');
            if (textarea) {
                textarea.value = text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.focus();
                if (sendButton) sendButton.click();
                container.remove();
            }
        };
        btnWrap.appendChild(btn);
        // 反馈按钮
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'option-feedback';
        feedbackDiv.style.display = 'flex';
        feedbackDiv.style.gap = '4px';
        feedbackDiv.innerHTML = `
            <button class="feedback-btn useful" title="有用">👍</button>
            <button class="feedback-btn useless" title="无用">👎</button>
            <button class="feedback-btn report" title="报告">⚠️</button>
        `;
        feedbackDiv.querySelectorAll('button').forEach(btnEl => {
            btnEl.onclick = (e) => {
                const type = btnEl.classList.contains('useful') ? 'useful' : btnEl.classList.contains('useless') ? 'useless' : 'report';
                submitFeedback(idx, text, type, sceneAnalysis);
                btnEl.style.background = type === 'useful' ? '#4CAF50' : type === 'useless' ? '#f44336' : '#ff9800';
                btnEl.style.color = 'white';
                setTimeout(() => {
                    btnEl.style.background = '';
                    btnEl.style.color = '';
                }, 1200);
                updateFeedbackStats(feedbackStats);
            };
        });
        btnWrap.appendChild(feedbackDiv);
        optionsRow.appendChild(btnWrap);
    });
    // 初始统计
    updateFeedbackStats(feedbackStats);
}

// ===== 反馈存储与统计 =====
function submitFeedback(optionIndex, optionText, feedbackType, sceneAnalysis) {
    const feedbackData = {
        timestamp: Date.now(),
        optionIndex,
        optionText,
        feedbackType,
        sceneAnalysis,
        userAgent: navigator.userAgent,
        sessionId: getSessionId()
    };
    // 存储到本地
    saveFeedbackLocally(feedbackData);
    // 预留：可上传到服务器
    // updateUserPreferences(feedbackData); // 预留自适应学习
    console.log('📝 反馈已记录:', feedbackData);
}
function saveFeedbackLocally(feedbackData) {
    const existing = JSON.parse(localStorage.getItem('ai_assistant_feedback') || '[]');
    existing.push(feedbackData);
    if (existing.length > 1000) existing.splice(0, existing.length - 1000);
    localStorage.setItem('ai_assistant_feedback', JSON.stringify(existing));
}
function updateFeedbackStats(panel) {
    if (!panel) return;
    const feedback = JSON.parse(localStorage.getItem('ai_assistant_feedback') || '[]');
    const useful = feedback.filter(f => f.feedbackType === 'useful').length;
    const useless = feedback.filter(f => f.feedbackType === 'useless').length;
    const report = feedback.filter(f => f.feedbackType === 'report').length;
    panel.querySelector('#useful-count').textContent = useful;
    panel.querySelector('#useless-count').textContent = useless;
    panel.querySelector('#report-count').textContent = report;
    panel.style.display = 'block';
}
function getSessionId() {
    let sid = localStorage.getItem('ai_assistant_session_id');
    if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem('ai_assistant_session_id', sid);
    }
    return sid;
}

// 简化上下文提取 - 只获取最近10条消息，不传输角色卡和世界书
async function getContextCompatible(limit = 10) {
    console.log('=== 开始获取最近对话消息 ===');
    
    // 初始化结果对象
    let messages = [];
    
    // 获取消息历史 - 使用多种方法
    try {
        console.log('🔍 尝试获取消息历史...');
        
        // 尝试使用 messages 命令获取消息
        if (typeof window.messages === 'function') {
            console.log('🔍 尝试使用 messages 命令获取消息...');
            const messageHistory = window.messages();
            if (messageHistory && Array.isArray(messageHistory) && messageHistory.length > 0) {
                // 限制消息数量
                messages = messageHistory.slice(-limit);
                console.log('✅ 通过 messages 命令获取到消息，数量:', messages.length);
                
                // 记录最新消息信息
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];
                    console.log('📝 最新消息:', {
                        role: lastMessage.role || '未知',
                        content: lastMessage.content ? lastMessage.content.substring(0, 100) + '...' : '无内容'
                    });
                }
            }
        }
        
        // 如果 messages 命令不可用，尝试从全局变量获取
        if (messages.length === 0 && window.chat && Array.isArray(window.chat)) {
            messages = window.chat.slice(-limit);
            console.log('✅ 从 window.chat 获取到消息，数量:', messages.length);
        }
        
        // 如果还是没有消息，尝试从DOM获取
        if (messages.length === 0) {
            console.log('🔍 从DOM查找消息...');
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
                    console.log(`✅ 找到消息元素: ${selector}，数量: ${messageElements.length}`);
                    
                    messageElements.forEach((mes, index) => {
                        // 判断角色
                        let role = 'user';
                        if (mes.classList.contains('swiper-slide') || 
                            mes.classList.contains('assistant') || 
                            mes.classList.contains('ai') ||
                            mes.querySelector('.avatar') ||
                            mes.getAttribute('data-is-user') === 'false' ||
                            mes.getAttribute('data-role') === 'assistant') {
                            role = 'assistant';
                        }
                        
                        // 获取消息内容
                        const contentSelectors = ['.mes_text', '.message', '.text', '.content'];
                        let content = null;
                        for (const contentSelector of contentSelectors) {
                            const contentElement = mes.querySelector(contentSelector);
                            if (contentElement && contentElement.textContent.trim()) {
                                content = contentElement.textContent.trim();
                                break;
                            }
                        }
                        
                        // 如果没有找到内容，使用元素本身的文本
                        if (!content) {
                            content = mes.textContent.trim();
                        }
                        
                        if (content && content.length > 0) {
                            messages.push({ role, content });
                        }
                    });
                    
                    if (messages.length > 0) {
                        messages = messages.slice(-limit);
                        console.log('✅ 从DOM获取到消息，数量:', messages.length);
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ 获取消息历史失败:', error);
    }
    
    // 返回简化的上下文结果 - 只包含最近消息
    const finalContext = {
        messages: messages,
        original_message_count: messages.length
    };
    
    console.log('\n=== 上下文数据获取完成 ===');
    console.log('📊 最终结果:');
    console.log('  - 消息数量:', messages.length);
    console.log('  - 已去除角色卡和世界书信息');
    
    if (messages.length > 0) {
        console.log('📄 最新消息示例:');
        const lastMessage = messages[messages.length - 1];
        console.log(`  - [${lastMessage.role}] ${lastMessage.content.substring(0, 100)}...`);
    }
    
    return finalContext;
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
        
        // 获取推进节奏模板
        const promptTemplate = PACE_PROMPTS[paceMode] || PACE_PROMPTS.normal;
        
        // 组装合并prompt
        console.log('[generateOptions] 开始获取上下文...');
        const context = await getContextCompatible();
        console.log('[generateOptions] 上下文获取完成，消息数量:', context.messages.length);
        
        // 构建简化的上下文提示词 - 只包含最近对话消息
        let fullContextText = '';
        
        // 添加最近对话消息
        if (context.messages && context.messages.length > 0) {
            fullContextText += '## 最近对话历史\n';
            fullContextText += context.messages.map(m => `[${m.role}] ${m.content}`).join('\n');
            fullContextText += '\n\n';
        }
        
        const prompt = promptTemplate
            .replace(/{{context}}/g, fullContextText);
        console.log('[generateOptions] 提示词组装完成，长度:', prompt.length);
        console.log('[generateOptions] 完整上下文数据已包含在提示词中');
        
        const finalMessages = [{ role: 'user', content: prompt }];
        let content = '';
        
        // 根据API类型构建不同的请求
        const apiType = settings.optionsApiType || 'openai';
        let apiUrl, requestBody, headers;
        
        if (apiType === 'gemini') {
            // Google Gemini API
            const modelName = settings.optionsApiModel || 'gemini-pro';
            
            // 非流式生成使用generateContent
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
            
            console.log('[generateOptions] 使用Google Gemini API');
            console.log('[generateOptions] API URL:', apiUrl);
            console.log('[generateOptions] 模型:', modelName);
        } else {
            // OpenAI兼容API
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
            
            console.log('[generateOptions] 使用OpenAI兼容API');
            console.log('[generateOptions] API URL:', apiUrl);
            console.log('[generateOptions] 模型:', settings.optionsApiModel);
        }
        
        console.log('[generateOptions] 使用非流式生成...');
        // 非流式生成
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
        });
        
        console.log('[generateOptions] API响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[generateOptions] API响应错误:', errorText);
            logger.error('API 响应错误 (raw):', errorText);
            throw new Error('API 请求失败');
        }
        
        const data = await response.json();
        
        // 根据API类型解析响应
        if (apiType === 'gemini') {
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
            content = data.choices?.[0]?.message?.content || '';
        }
        
        console.log('[generateOptions] 非流式生成完成，内容长度:', content.length);
        
        // 解析建议和场景分析
        let sceneAnalysis = null;
        let suggestions = [];
        if (apiType === 'gemini') {
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
            content = data.choices?.[0]?.message?.content || '';
        }
        // 尝试提取场景分析（JSON）
        const sceneMatch = content.match(/场景分析[：:]?\s*([\s\S]*?)建议列表[：:]?/);
        if (sceneMatch) {
            try {
                // 兼容多种格式，尝试提取JSON
                const jsonText = sceneMatch[1].trim();
                sceneAnalysis = JSON.parse(jsonText);
            } catch (e) {
                // 解析失败，忽略
            }
        }
        // 提取建议
        suggestions = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim()).filter(Boolean);
        console.log('[generateOptions] 解析到选项数量:', suggestions.length);
        console.log('[generateOptions] 选项内容:', suggestions);
        

        
        // 等待选项完全显示后再隐藏loading
        await displayOptions(sceneAnalysis, suggestions, false); // false表示非流式显示
        hidePacePanelLoading();
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
    static selectedOptions = []; // 手动模式下选中的选项
    
    static showGeneratingUI = UIManager.showGeneratingUI;
    static hideGeneratingUI = UIManager.hideGeneratingUI;
    static displayOptions = displayOptions;

    static generateOptions = generateOptions;
    static testApiConnection = testApiConnection;
    
    // 测试API连接
    static async testApiConnection() {
        console.log('=== 开始测试API连接 ===');
        const settings = getSettings();
        
        if (!settings.optionsApiKey) {
            console.log('❌ 未设置API密钥');
            return false;
        }
        
        try {
            const response = await fetch(`${settings.optionsBaseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${settings.optionsApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API连接成功');
                console.log('📄 可用模型:', data.data?.map(m => m.id) || []);
                return true;
            } else {
                console.log('❌ API连接失败:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.error('❌ API连接错误:', error);
            return false;
        }
    }
    
    // 详细诊断接口问题
    static async diagnoseInterfaces() {
        console.log('=== 开始诊断接口问题 ===');
        
        // 检查SillyTavern原生API
        const globalObjects = [
            'SillyTavern',
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
        const extensionElements = document.querySelectorAll('[id*="tavern"], [class*="tavern"]');
        console.log('可能的扩展元素:', extensionElements.length);
        
        // 检查聊天消息元素
        const chatMessages = document.querySelectorAll('#chat .mes');
        console.log('聊天消息元素数量:', chatMessages.length);
        if (chatMessages.length > 0) {
            console.log('第一个消息元素:', chatMessages[0]);
            console.log('第一个消息元素的类名:', chatMessages[0].className);
            console.log('第一个消息元素的内容:', chatMessages[0].textContent?.substring(0, 100));
        }
        
        console.log('=== 接口诊断完成 ===');
    }
    
    // 测试上下文获取
    static async testContextRetrieval() {
        console.log('=== 开始测试简化上下文获取 ===');
        
        try {
            const context = await getContextCompatible(10);
            console.log('✅ 简化上下文获取测试完成');
            console.log('📊 获取到的消息数量:', context.messages?.length || 0);
            console.log('📊 已去除角色设定和世界书信息');
            console.log('📊 只保留最近对话消息');
            
            if (context.messages && context.messages.length > 0) {
                console.log('📄 消息示例:');
                context.messages.forEach((msg, i) => {
                    console.log(`   ${i+1}. [${msg.role}] ${msg.content.substring(0, 100)}...`);
                });
            } else {
                console.log('⚠️ 未获取到任何消息');
            }
            
            return context;
        } catch (error) {
            console.error('❌ 简化上下文获取测试失败:', error);
            return null;
        }
    }
    
    // 专门测试简化上下文获取（已去除角色卡和世界书）
    static async testCharacterAndWorldInfo() {
        console.log('=== 开始测试简化上下文获取 ===');
        
        // 测试简化后的上下文获取
        try {
            console.log('🔍 测试简化上下文获取...');
            const context = await getContextCompatible(10);
            console.log('✅ 简化上下文获取成功');
            console.log('📄 返回数据字段:', Object.keys(context || {}));
            console.log('📄 只包含消息:', !!context?.messages);
            console.log('📄 已去除角色卡和世界书');
            
            if (context?.messages) {
                console.log('📄 消息数量:', context.messages.length);
                console.log('📄 最新消息:', context.messages[context.messages.length - 1]?.content?.substring(0, 100) + '...');
            }
        } catch (error) {
            console.error('❌ 简化上下文获取失败:', error);
        }
        
        // 测试DOM消息元素
        console.log('\n🔍 测试DOM消息元素...');
        const messageElements = document.querySelectorAll('#chat .mes, .chat .message, .message, .mes');
        
        console.log('📄 消息DOM元素数量:', messageElements.length);
        
        if (messageElements.length > 0) {
            console.log('📄 第一个消息元素:', messageElements[0]);
            console.log('📄 第一个消息内容:', messageElements[0].textContent?.substring(0, 100) + '...');
        }
        
        console.log('=== 简化上下文获取测试完成 ===');
    }
    
    // 测试简化上下文传输情况
    static async testContextTransmission() {
        console.log('=== 开始测试简化上下文传输情况 ===');
        
        try {
            const context = await getContextCompatible(10);
            console.log('📊 简化上下文获取结果:');
            console.log('  - 已去除角色设定和世界书');
            console.log('  - 消息数量:', context.messages?.length || 0);
            console.log('  - 只传输最近对话消息');
            
            if (context.messages && context.messages.length > 0) {
                console.log('📄 消息详情:');
                console.log('  - 最新消息:', context.messages[context.messages.length - 1]?.content?.substring(0, 100) + '...');
                console.log('  - 消息角色分布:', context.messages.map(m => m.role).join(', '));
                console.log('  - 消息时间顺序: 从旧到新');
                
                // 显示所有消息的简要信息
                context.messages.forEach((msg, index) => {
                    console.log(`  - 消息 ${index + 1}: [${msg.role}] ${msg.content.substring(0, 50)}...`);
                });
            } else {
                console.log('⚠️ 未获取到任何消息');
            }
            
            console.log('✅ 简化上下文传输测试完成');
            return context;
        } catch (error) {
            console.error('❌ 简化上下文传输测试失败:', error);
            return null;
        }
    }
}

// 将OptionsGenerator导出到全局作用域，以便在控制台中调用
window.OptionsGenerator = OptionsGenerator;