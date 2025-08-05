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



async function displayOptions(options, isStreaming = false) {
    const oldContainer = document.getElementById('ti-options-container');
    if (oldContainer) oldContainer.remove();
    const sendForm = document.getElementById('send_form');
    if (!sendForm || !options || options.length === 0) {
        if (!options || options.length === 0) {
            // 只有在没有其他提示时才显示错误提示
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
    
    // 获取当前发送模式
    const settings = getSettings();
    const sendMode = settings.sendMode || 'manual';
    
    // 在手动模式下，记录已选择的选项
    if (sendMode === 'manual') {
        // 重置选中的选项
        OptionsGenerator.selectedOptions = [];
    }
    
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
            cursor: pointer;
            transition: none;
            word-wrap: break-word;
            white-space: normal;
        `;
        
        // 添加轻微的hover效果
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
                if (sendMode === 'manual') {
                    // 手动模式：多选功能
                    const isSelected = OptionsGenerator.selectedOptions.includes(text);
                    
                    if (isSelected) {
                        // 取消选择
                        OptionsGenerator.selectedOptions = OptionsGenerator.selectedOptions.filter(option => option !== text);
                        btn.style.background = 'var(--SmartThemeBackgroundColor, #fff)';
                        btn.style.color = 'var(--SmartThemeBodyColor, #222)';
                        btn.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
                    } else {
                        // 添加选择
                        OptionsGenerator.selectedOptions.push(text);
                        btn.style.background = 'var(--SmartThemeBlurple, #007bff)';
                        btn.style.color = 'white';
                        btn.style.borderColor = 'var(--SmartThemeBlurple, #007bff)';
                    }
                    
                    // 拼接选中的选项到输入框
                    if (OptionsGenerator.selectedOptions.length > 0) {
                        textarea.value = OptionsGenerator.selectedOptions.join(' ');
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        textarea.focus();
                    } else {
                        textarea.value = '';
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        textarea.focus();
                    }
                    
                    // 手动模式下不清除选项容器
                } else {
                    // 自动模式：原有行为
                    textarea.value = text;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.focus();
                    
                    // 根据发送模式决定是否自动发送
                    if (sendMode === 'auto' && sendButton) {
                        sendButton.click();
                    }
                    container.remove();
                }
            }
        };
    }
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

// ===== 上下文可视化组件 =====
class ContextVisualization {
    constructor() {
        this.currentContext = null;
        this.visualizationContainer = null;
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    createMainVisualization() {
        const container = document.createElement('div');
        container.className = 'context-visualization';
        container.innerHTML = `
            <div class="viz-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="viz-title">🎯 AI场景分析</div>
                <div class="viz-controls" style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
                    <button class="viz-refresh" title="刷新分析">🔄</button>
                    <button class="viz-toggle" title="切换显示">👁️</button>
                </div>
            </div>
            <div class="viz-content">
                <div class="viz-section scene-analysis">
                    <h4>📊 场景分析</h4>
                    <div class="analysis-grid"></div>
                </div>
                <div class="viz-section option-reasoning">
                    <h4>💡 选项推理</h4>
                    <div class="reasoning-list"></div>
                </div>
            </div>
        `;
        this.visualizationContainer = container;
        this.setupEventListeners();
        this.setupDrag();
        return container;
    }
    setupDrag() {
        const header = this.visualizationContainer.querySelector('.viz-header');
        let startX, startY, startLeft, startBottom;
        let dragging = false;
        const onMouseMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let newLeft = startLeft + dx;
            let newBottom = startBottom - dy;
            // 限制在窗口内
            const minLeft = 0;
            const minBottom = 0;
            const maxLeft = window.innerWidth - this.visualizationContainer.offsetWidth;
            const maxBottom = window.innerHeight - this.visualizationContainer.offsetHeight;
            newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
            newBottom = Math.max(minBottom, Math.min(newBottom, maxBottom));
            this.visualizationContainer.style.left = newLeft + 'px';
            this.visualizationContainer.style.bottom = newBottom + 'px';
            this.visualizationContainer.style.right = 'auto';
            this.visualizationContainer.style.top = 'auto';
        };
        header.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = this.visualizationContainer.getBoundingClientRect();
            startLeft = rect.left;
            startBottom = window.innerHeight - rect.bottom;
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMouseMove);
        });
        document.addEventListener('mouseup', () => {
            if (dragging) {
                dragging = false;
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', onMouseMove);
            }
        });
    }
    updateSceneAnalysis(analysis) {
        const analysisGrid = this.visualizationContainer.querySelector('.analysis-grid');
        const analysisItems = [
            { key: 'scene_type', label: '场景类型', icon: '🎭' },
            { key: 'user_mood', label: '我的情绪', icon: '😊' },
            { key: 'narrative_focus', label: '叙事重点', icon: '🎯' },
            { key: 'character_motivation', label: '我的动机', icon: '💪' },
            { key: 'relationship_dynamics', label: '关系状态', icon: '🤝' },
            { key: 'story_direction', label: '故事方向', icon: '📈' },
            { key: 'time_progression', label: '时间推进', icon: '⏩' },
            { key: 'scene_transition', label: '场景转换', icon: '🚪' }
        ];
        analysisGrid.innerHTML = analysisItems.filter(item => analysis[item.key]).map(item => `
            <div class="analysis-item">
                <div class="analysis-icon">${item.icon}</div>
                <div class="analysis-content">
                    <div class="analysis-label">${item.label}</div>
                    <div class="analysis-value" data-key="${item.key}">
                        ${analysis[item.key] || '未分析'}
                    </div>
                </div>
            </div>
        `).join('');
    }
    updateOptionReasoning(options, analysis) {
        const reasoningList = this.visualizationContainer.querySelector('.reasoning-list');
        const reasoningItems = options.map((option, index) => {
            const explanation = this.generateExplanation(option, analysis);
            return `
                <div class="reasoning-item" data-option="${index}" style="cursor:pointer;">
                    <div class="reasoning-header">
                        <span class="reasoning-number">选项 ${index + 1}</span>
                    </div>
                    <div class="reasoning-content">
                        <div class="reasoning-text">${option}</div>
                        <div class="reasoning-explanation">
                            <div class="explanation-icon">💡</div>
                            <div class="explanation-text">${explanation}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        reasoningList.innerHTML = reasoningItems;
        // 绑定点击事件：点击填入输入框
        reasoningList.querySelectorAll('.reasoning-item').forEach((item, idx) => {
            item.addEventListener('click', () => {
                const inputEl = document.querySelector('#send_textarea, .send_textarea, textarea[name="send_textarea"]');
                if (inputEl) {
                    inputEl.value = options[idx];
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                    inputEl.focus();
                }
            });
        });
    }
    generateExplanation(option, analysis) {
        // 简单推理示例，可扩展为更复杂的逻辑
        if (option.includes('出发') || option.includes('到达')) {
            return '该选项体现了场景的推进或转换，有助于推动故事发展。';
        }
        if (option.includes('问') || option.includes('说')) {
            return '该选项有助于对话深入，推动人物关系。';
        }
        if (option.includes('检查') || option.includes('准备')) {
            return '该选项有助于任务或行动的顺利进行。';
        }
        return '该选项与当前场景分析相关，有助于剧情自然发展。';
    }
    setupEventListeners() {
        const toggleBtn = this.visualizationContainer.querySelector('.viz-toggle');
        const refreshBtn = this.visualizationContainer.querySelector('.viz-refresh');
        toggleBtn.addEventListener('click', () => {
            this.visualizationContainer.classList.toggle('collapsed');
            toggleBtn.textContent = this.visualizationContainer.classList.contains('collapsed') ? '🔍' : '👁️';
        });
        refreshBtn.addEventListener('click', () => {
            if (typeof window.OptionsGenerator?.generateOptions === 'function') {
                window.OptionsGenerator.generateOptions();
            } else {
                this.refreshVisualization();
            }
        });
    }
    refreshVisualization() {
        if (this.currentContext) {
            this.updateSceneAnalysis(this.currentContext.analysis);
            this.updateOptionReasoning(this.currentContext.options, this.currentContext.analysis);
        }
    }
    updateVisualization(context, options) {
        this.currentContext = { ...context, options };
        this.updateSceneAnalysis(context.analysis);
        this.updateOptionReasoning(options, context.analysis);
    }
    clear() {
        if (this.visualizationContainer && this.visualizationContainer.parentNode) {
            this.visualizationContainer.parentNode.removeChild(this.visualizationContainer);
        }
        this.visualizationContainer = null;
        this.currentContext = null;
    }
    clearContent() {
        if (this.visualizationContainer) {
            // 只清空内容，不移除面板和header，header和👁️按钮始终可见
            const analysisGrid = this.visualizationContainer.querySelector('.analysis-grid');
            if (analysisGrid) analysisGrid.innerHTML = '';
            const reasoningList = this.visualizationContainer.querySelector('.reasoning-list');
            if (reasoningList) reasoningList.innerHTML = '';
            // 内容区显示暂无数据（可选）
            const vizContent = this.visualizationContainer.querySelector('.viz-content');
            if (vizContent) {
                vizContent.classList.add('empty');
            }
        }
        this.currentContext = null;
    }
}

let contextVisualization = null;
function initContextVisualization() {
    if (!contextVisualization) {
        contextVisualization = new ContextVisualization();
        const vizContainer = contextVisualization.createMainVisualization();
        document.body.appendChild(vizContainer);
    }
}
function clearContextVisualization() {
    if (contextVisualization) {
        contextVisualization.clear();
        contextVisualization = null;
    }
}

// 修改 generateOptions 集成可视化
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
        
        // 解析AI返回内容，提取场景分析和建议
        const suggestions = (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim()).filter(Boolean);
        console.log('[generateOptions] 解析到选项数量:', suggestions.length);
        console.log('[generateOptions] 选项内容:', suggestions);
        
        // 新增：解析场景分析
        let analysis = {};
        const analysisMatch = content.match(/场景分析[：:][\s\S]*?\{([\s\S]*?)\}/);
        if (analysisMatch) {
            try {
                analysis = JSON.parse('{' + analysisMatch[1] + '}');
            } catch (e) {
                analysis = {};
            }
        }
        // 初始化并更新可视化
        initContextVisualization();
        contextVisualization.updateVisualization({
            analysis,
            messages: context.messages
        }, suggestions);
        
        // 等待选项完全显示后再隐藏loading
        await displayOptions(suggestions, false); // false表示非流式显示
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

// 输入消息后自动清除面板和选项
if (typeof eventSource !== 'undefined' && eventSource.on) {
    eventSource.on(event_types.MESSAGE_SENT, () => {
        clearContextVisualization();
        // 选项清除已由原有逻辑处理
        if (contextVisualization) contextVisualization.clearContent();
    });
}