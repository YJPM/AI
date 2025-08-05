import { getSettings, PACE_PROMPTS, PLOT_PROMPTS, CONSTANTS } from './settings.js';
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

// 流式选项显示函数
async function displayOptionsStreaming(content) {
    const suggestions = Utils.extractSuggestions(content);
    
    // 获取或创建容器
    let container = document.getElementById(OPTIONS_CONSTANTS.OPTIONS_CONTAINER_ID);
    if (!container) {
        container = UIManager.createOptionsContainer();
        if (!container) return;
    }
    
    // 获取当前发送模式
    const settings = getSettings();
    const sendMode = settings.sendMode || 'manual';
    
    // 在手动模式下，重置选中的选项
    if (sendMode === 'manual') {
        OptionsGenerator.selectedOptions = [];
    }
    
    // 更新或创建按钮
    suggestions.forEach((text, index) => {
        let btn = container.querySelector(`[data-option-index="${index}"]`);
        if (!btn) {
            btn = UIManager.createOptionButton(text, index, sendMode);
            if (btn) {
                container.appendChild(btn);
            }
        } else {
            btn.textContent = text;
        }
    });
    
    // 移除多余的按钮
    const existingButtons = container.querySelectorAll('button');
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

// 简化上下文提取 - 只使用SillyTavern.getContext()
async function getContextCompatible(limit = 5) {
    console.log('=== 开始获取SillyTavern上下文数据 ===');
    
    // 初始化结果对象
    let characterInfo = null;
    let worldInfo = null;
    let messages = [];
    let systemPrompt = null;
    let chatSummary = null;
    
    // 方案1: 使用SillyTavern脚本命令获取角色信息
    console.log('\n--- 方案1: 使用SillyTavern脚本命令获取角色信息 ---');
    
    // 获取角色信息 - 使用 getcharbook 命令
    try {
        // 尝试获取角色卡信息
        if (typeof window.getcharbook === 'function') {
            console.log('🔍 尝试使用 getcharbook 获取角色信息...');
            const charBook = window.getcharbook();
            if (charBook) {
                characterInfo = {
                    name: charBook.name || '未知角色',
                    description: charBook.description || charBook.personality || '无描述',
                    personality: charBook.personality || charBook.description || '无描述',
                    scenario: charBook.scenario || '无场景',
                    first_mes: charBook.first_mes || '无首条消息',
                    mes_example: charBook.mes_example || '无对话示例'
                };
                console.log('✅ 通过 getcharbook 获取到角色信息');
            }
        }
        
        // 如果 getcharbook 不可用，尝试其他方法
        if (!characterInfo && window.character) {
            console.log('🔍 尝试从 window.character 获取角色信息...');
            const char = window.character;
            characterInfo = {
                name: char.name || '未知角色',
                description: char.description || char.personality || '无描述',
                personality: char.personality || char.description || '无描述',
                scenario: char.scenario || '无场景',
                first_mes: char.first_mes || '无首条消息',
                mes_example: char.mes_example || '无对话示例'
            };
            console.log('✅ 从 window.character 获取到角色信息');
        }
        
    } catch (error) {
        console.error('❌ 获取角色信息失败:', error);
    }
    
    // 获取世界书信息 - 使用多种脚本命令
    try {
        console.log('🔍 尝试获取世界书信息...');
        
        // 检查世界书状态
        if (typeof window.world === 'function') {
            try {
                const worldStatus = window.world();
                console.log('🌍 世界书状态:', worldStatus);
            } catch (error) {
                console.log('⚠️ 无法获取世界书状态:', error.message);
            }
        }
        
        // 尝试获取聊天世界书
        if (typeof window.getchatbook === 'function') {
            const chatBook = window.getchatbook();
            if (chatBook && Array.isArray(chatBook) && chatBook.length > 0) {
                worldInfo = chatBook;
                console.log('✅ 通过 getchatbook 获取到世界书信息，数量:', worldInfo.length);
            }
        }
        
        // 尝试获取角色世界书
        if ((!worldInfo || worldInfo.length === 0) && typeof window.getpersonabook === 'function') {
            const personaBook = window.getpersonabook();
            if (personaBook && Array.isArray(personaBook) && personaBook.length > 0) {
                worldInfo = personaBook;
                console.log('✅ 通过 getpersonabook 获取到世界书信息，数量:', worldInfo.length);
            }
        }
        
        // 尝试获取全局世界书
        if ((!worldInfo || worldInfo.length === 0) && typeof window.getglobalbooks === 'function') {
            const globalBooks = window.getglobalbooks();
            if (globalBooks && Array.isArray(globalBooks) && globalBooks.length > 0) {
                worldInfo = globalBooks;
                console.log('✅ 通过 getglobalbooks 获取到世界书信息，数量:', worldInfo.length);
            }
        }
        
        // 尝试使用 findentry 查找特定条目
        if ((!worldInfo || worldInfo.length === 0) && typeof window.findentry === 'function') {
            try {
                const commonEntries = ['character', 'world', 'setting', 'background', 'location', 'story'];
                for (const entry of commonEntries) {
                    const foundEntry = window.findentry(entry);
                    if (foundEntry) {
                        if (!worldInfo) worldInfo = [];
                        worldInfo.push(foundEntry);
                        console.log(`✅ 通过 findentry 找到条目 "${entry}":`, foundEntry.title || '未命名');
                    }
                }
            } catch (error) {
                console.log('⚠️ findentry 查找失败:', error.message);
            }
        }
        
        // 如果脚本命令不可用，尝试从全局变量获取
        if ((!worldInfo || worldInfo.length === 0) && window.world_info) {
            const worldInfoData = window.world_info;
            if (Array.isArray(worldInfoData)) {
                worldInfo = worldInfoData;
                console.log('✅ 从 window.world_info 获取到世界书信息，数量:', worldInfo.length);
            }
        }
        
    } catch (error) {
        console.error('❌ 获取世界书信息失败:', error);
    }
    
    // 方案2: 尝试其他SillyTavern API
    console.log('\n--- 方案2: 尝试其他SillyTavern API ---');
    
    // 尝试其他可能的SillyTavern方法
    if (!characterInfo && window.SillyTavern) {
        const stMethods = Object.keys(window.SillyTavern).filter(key => typeof window.SillyTavern[key] === 'function');
        console.log('📄 可用的SillyTavern方法:', stMethods);
        
        // 尝试可能的角色获取方法
        const possibleCharMethods = ['getCharacter', 'getCurrentCharacter', 'getCharacterData', 'character'];
        for (const method of possibleCharMethods) {
            if (typeof window.SillyTavern[method] === 'function') {
                try {
                    console.log(`🔍 尝试SillyTavern.${method}()...`);
                    const charData = window.SillyTavern[method]();
                    if (charData) {
                        characterInfo = charData;
                        console.log(`✅ SillyTavern.${method}() 成功`);
                        break;
                    }
                } catch (error) {
                    console.log(`❌ SillyTavern.${method}() 失败:`, error.message);
                }
            }
        }
    }
    
    // 尝试从SillyTavern全局变量获取角色信息
    if (!characterInfo && window.character) {
        try {
            console.log('🔍 尝试从window.character获取...');
            characterInfo = window.character;
            console.log('✅ 从window.character获取成功');
        } catch (error) {
            console.error('❌ 从window.character获取失败:', error);
        }
    }
    
    // 尝试从SillyTavern全局变量获取世界书信息
    if (!worldInfo && window.world_info) {
        try {
            console.log('🔍 尝试从window.world_info获取...');
            const worldInfoData = window.world_info;
            if (Array.isArray(worldInfoData)) {
                worldInfo = worldInfoData;
                console.log('✅ 从window.world_info获取成功，数量:', worldInfo.length);
            } else {
                console.log('⚠️ window.world_info不是数组格式');
            }
        } catch (error) {
            console.error('❌ 从window.world_info获取失败:', error);
        }
    }
    
    // 方案3: 从DOM获取信息
    console.log('\n--- 方案3: 从DOM获取信息 ---');
    
    // 从DOM获取角色信息
    if (!characterInfo) {
        console.log('🔍 从DOM查找角色信息...');
        const characterSelectors = [
            '#character_info',
            '.character_info', 
            '[data-character]',
            '.char_name',
            '.character_name',
            '#char_name',
            '.char_info',
            '.character-card',
            '.char-card',
            '.character_info_wrapper',
            '.character_info_container',
            '[id*="character"]',
            '[class*="character"]',
            '[class*="char"]'
        ];
        
        for (const selector of characterSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`✅ 找到角色元素: ${selector} (${elements.length}个)`);
                
                for (const element of elements) {
                    // 尝试获取角色名称
                    const nameSelectors = [
                        '.char_name', '.character_name', '.name', 'h1', 'h2', 'h3', 
                        '.char-title', '.character-title', '.title',
                        '[data-name]', '[data-character-name]'
                    ];
                    let charName = null;
                    for (const nameSelector of nameSelectors) {
                        const nameElement = element.querySelector(nameSelector);
                        if (nameElement && nameElement.textContent.trim()) {
                            charName = nameElement.textContent.trim();
                            break;
                        }
                    }
                    
                    // 如果没有找到名称，尝试从元素本身获取
                    if (!charName && element.textContent.trim()) {
                        const text = element.textContent.trim();
                        // 如果文本长度适中且不包含太多特殊字符，可能是角色名
                        if (text.length > 0 && text.length < 50 && !text.includes('\n')) {
                            charName = text;
                        }
                    }
                    
                    // 尝试获取角色描述
                    const descSelectors = [
                        '.char_desc', '.character_description', '.description', '.desc', 'p',
                        '.char-personality', '.character-personality', '.personality',
                        '.char-scenario', '.character-scenario', '.scenario',
                        '[data-description]', '[data-character-desc]'
                    ];
                    let charDesc = null;
                    for (const descSelector of descSelectors) {
                        const descElement = element.querySelector(descSelector);
                        if (descElement && descElement.textContent.trim()) {
                            const text = descElement.textContent.trim();
                            if (text.length > 10) {
                                charDesc = text;
                                break;
                            }
                        }
                    }
                    
                    // 如果没有找到描述，尝试从父元素或兄弟元素获取
                    if (!charDesc) {
                        const parent = element.parentElement;
                        if (parent) {
                            const parentText = parent.textContent.trim();
                            if (parentText.length > 50 && parentText.length < 1000) {
                                charDesc = parentText;
                            }
                        }
                    }
                    
                    if (charName || charDesc) {
                        characterInfo = {
                            name: charName || '未知角色',
                            description: charDesc || '无描述',
                            personality: charDesc || '无描述',
                            scenario: '从DOM解析获取'
                        };
                        console.log('✅ 从DOM获取到角色信息:', characterInfo);
                        break;
                    }
                }
                
                if (characterInfo) break;
            }
        }
        
        // 如果还是没有找到，尝试从页面标题或其他地方获取
        if (!characterInfo) {
            console.log('🔍 尝试从页面标题获取角色信息...');
            const pageTitle = document.title;
            if (pageTitle && pageTitle !== 'SillyTavern' && pageTitle.length < 100) {
                characterInfo = {
                    name: pageTitle,
                    description: '从页面标题获取',
                    personality: '从页面标题获取',
                    scenario: '从页面标题获取'
                };
                console.log('✅ 从页面标题获取到角色信息:', characterInfo);
            }
        }
    }
    
    // 从DOM获取世界书信息
    if (!worldInfo) {
        console.log('🔍 从DOM查找世界书信息...');
        const worldBookSelectors = [
            '.world_book',
            '[data-world-book]',
            '.world_info',
            '.worldbook',
            '.world-info',
            '.world-book',
            '.world_book_info',
            '.world_info_wrapper',
            '.world_info_container',
            '[id*="world"]',
            '[class*="world"]',
            '[class*="worldbook"]'
        ];
        
        for (const selector of worldBookSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`✅ 找到世界书元素: ${selector}，数量: ${elements.length}`);
                worldInfo = [];
                
                elements.forEach((element, index) => {
                    // 获取标题
                    const titleSelectors = [
                        '.title', '.world_title', '.name', 'h1', 'h2', 'h3',
                        '.world-name', '.worldbook-title', '.world-title',
                        '[data-title]', '[data-world-title]'
                    ];
                    let title = null;
                    for (const titleSelector of titleSelectors) {
                        const titleElement = element.querySelector(titleSelector);
                        if (titleElement && titleElement.textContent.trim()) {
                            title = titleElement.textContent.trim();
                            break;
                        }
                    }
                    
                    // 获取内容
                    const contentSelectors = [
                        '.content', '.world_content', '.text', '.description', 'p',
                        '.world-text', '.worldbook-content', '.world-content',
                        '[data-content]', '[data-world-content]'
                    ];
                    let content = null;
                    for (const contentSelector of contentSelectors) {
                        const contentElement = element.querySelector(contentSelector);
                        if (contentElement && contentElement.textContent.trim()) {
                            content = contentElement.textContent.trim();
                            break;
                        }
                    }
                    
                    // 如果没有找到内容，尝试从元素本身获取
                    if (!content && element.textContent.trim()) {
                        const text = element.textContent.trim();
                        if (text.length > 20) {
                            content = text;
                        }
                    }
                    
                    if (content) {
                        worldInfo.push({
                            title: title || `世界书${index + 1}`,
                            content: content,
                            keys: '',
                            priority: 'default'
                        });
                    }
                });
                
                if (worldInfo.length > 0) {
                    console.log('✅ 从DOM获取到世界书信息，数量:', worldInfo.length);
                    break;
                }
            }
        }
        
        // 如果还是没有找到，尝试从localStorage获取
        if (!worldInfo) {
            console.log('🔍 尝试从localStorage获取世界书信息...');
            try {
                const worldBooksData = localStorage.getItem('world_info') || localStorage.getItem('worldbooks');
                if (worldBooksData) {
                    const parsedData = JSON.parse(worldBooksData);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        worldInfo = parsedData;
                        console.log('✅ 从localStorage获取到世界书信息，数量:', worldInfo.length);
                    }
                }
            } catch (error) {
                console.log('❌ 从localStorage获取世界书失败:', error.message);
            }
        }
    }
    
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
    
    // 尝试获取聊天摘要
    try {
        console.log('🔍 尝试获取聊天摘要...');
        
        // 检查是否有聊天摘要功能
        if (window.summary) {
            chatSummary = window.summary;
            console.log('✅ 获取到聊天摘要:', chatSummary.substring(0, 200) + '...');
        } else if (window.chat_summary) {
            chatSummary = window.chat_summary;
            console.log('✅ 获取到聊天摘要:', chatSummary.substring(0, 200) + '...');
        } else {
            console.log('⚠️ 未找到聊天摘要');
        }
    } catch (error) {
        console.log('⚠️ 获取聊天摘要失败:', error.message);
    }
    
    // 方案4: 尝试其他可能的API
    console.log('\n--- 方案4: 尝试其他API ---');
    
    // 尝试其他可能的全局对象
    const possibleAPIs = [
        'window.SillyTavern',
        'window.CharacterHelper',
        'window.ChatHelper',
        'window.ContextHelper'
    ];
    
    for (const apiName of possibleAPIs) {
        try {
            const api = eval(apiName);
            if (api && typeof api === 'object') {
                console.log(`🔍 检查API: ${apiName}`);
                console.log(`📄 可用方法:`, Object.keys(api).filter(key => typeof api[key] === 'function'));
            }
        } catch (error) {
            // 忽略错误
        }
    }
    
    // 确保 worldInfo 始终是数组
    const safeWorldInfo = Array.isArray(worldInfo) ? worldInfo : [];
    
    // 返回最终结果
    const finalContext = {
        messages: messages,
        character: characterInfo,
        world_info: safeWorldInfo,
        system_prompt: systemPrompt,
        chat_summary: chatSummary,
        original_message_count: messages.length
    };
    
    console.log('\n=== 上下文数据获取完成 ===');
    console.log('📊 最终结果:');
    console.log('  - 消息数量:', messages.length);
    console.log('  - 角色信息:', !!characterInfo);
    console.log('  - 世界书数量:', safeWorldInfo.length);
    console.log('  - 系统提示词:', !!systemPrompt);
    console.log('  - 聊天摘要:', !!chatSummary);
    
    if (characterInfo) {
        console.log('  - 角色名称:', characterInfo.name || '未设置');
    }
    
    if (safeWorldInfo.length > 0) {
        console.log('  - 世界书标题:', safeWorldInfo.map(w => w.title || '未命名').join(', '));
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
        // 根据推进节奏和模板类型选择提示模板
        const paceMode = settings.paceMode || 'normal';
        const templateMode = settings.templateMode || 'discovery';
        console.log('[generateOptions] 当前推进节奏:', paceMode);
        console.log('[generateOptions] 当前模板类型:', templateMode);
        let promptTemplate;
        
        // 根据推进节奏和剧情走向组合选择模板
        const plotMode = settings.plotMode || 'normal';
        
        // 获取推进节奏模板
        const paceTemplate = PACE_PROMPTS[paceMode] || PACE_PROMPTS.normal;
        
        // 获取剧情走向模板
        const plotTemplate = PLOT_PROMPTS[plotMode] || PLOT_PROMPTS.normal;
        
        // 组合模板：推进节奏 + 剧情走向
        promptTemplate = `
${paceTemplate}

## 剧情走向要求
${plotTemplate.split('## 核心要求')[1].split('## 最近对话')[0]}

## 最近对话
{{context}}
        `.trim();
        
        // 组装合并prompt
        console.log('[generateOptions] 开始获取上下文...');
        const context = await getContextCompatible();
        console.log('[generateOptions] 上下文获取完成，消息数量:', context.messages.length);
        
        // 构建简化的上下文提示词
        let fullContextText = '';
        
        // 1. 添加角色设定信息
        if (context.character) {
            fullContextText += '## 角色设定\n';
            fullContextText += `角色名称: ${context.character.name || '未设置'}\n`;
            fullContextText += `角色描述: ${context.character.description || '未设置'}\n`;
            fullContextText += `角色人格: ${context.character.personality || '未设置'}\n`;
            fullContextText += `角色场景: ${context.character.scenario || '未设置'}\n`;
            fullContextText += `角色第一印象: ${context.character.first_mes || '未设置'}\n`;
            fullContextText += `角色消息示例: ${context.character.mes_example || '未设置'}\n\n`;
        }
        
        // 2. 添加世界书信息
        if (context.world_info && Array.isArray(context.world_info) && context.world_info.length > 0) {
            fullContextText += '## 世界书信息\n';
            context.world_info.forEach((world, index) => {
                fullContextText += `世界书 ${index + 1}:\n`;
                fullContextText += `名称: ${world.title || '未命名'}\n`;
                fullContextText += `内容: ${world.content || '无内容'}\n`;
                fullContextText += `关键词: ${world.keys || '无关键词'}\n`;
                fullContextText += `优先级: ${world.priority || '默认'}\n\n`;
            });
        }
        
        // 3. 添加聊天摘要
        if (context.chat_summary) {
            fullContextText += '## 聊天摘要\n';
            fullContextText += context.chat_summary + '\n\n';
        }
        
        // 4. 添加系统提示词
        if (context.system_prompt) {
            fullContextText += '## 系统提示词\n';
            fullContextText += context.system_prompt + '\n\n';
        }
        
        // 5. 添加最近对话消息
        if (context.messages && context.messages.length > 0) {
            fullContextText += '## 最近对话历史\n';
            fullContextText += context.messages.map(m => `[${m.role}] ${m.content}`).join('\n');
            fullContextText += '\n\n';
        }
        
        // 6. 添加统计信息
        fullContextText += '## 上下文统计\n';
        fullContextText += `原始消息总数: ${context.original_message_count || 0}\n`;
        fullContextText += `当前使用消息数: ${context.messages ? context.messages.length : 0}\n`;
        fullContextText += `包含角色设定: ${!!context.character}\n`;
        fullContextText += `包含世界书: ${!!(context.world_info && Array.isArray(context.world_info) && context.world_info.length > 0)}\n`;
        fullContextText += `包含聊天摘要: ${!!context.chat_summary}\n`;
        fullContextText += `包含系统提示词: ${!!context.system_prompt}\n\n`;
        
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
            
            if (settings.streamOptions) {
                // 流式生成使用streamGenerateContent
                apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:streamGenerateContent?key=${settings.optionsApiKey}`;
            } else {
                // 非流式生成使用generateContent
                apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${settings.optionsApiKey}`;
            }
            
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
            console.log('[generateOptions] 流式模式:', settings.streamOptions);
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
                stream: settings.streamOptions,
            };
            
            console.log('[generateOptions] 使用OpenAI兼容API');
            console.log('[generateOptions] API URL:', apiUrl);
            console.log('[generateOptions] 模型:', settings.optionsApiModel);
        }
        
        if (settings.streamOptions) {
            console.log('[generateOptions] 使用流式生成...');
            // 流式生成
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
            
            console.log('[generateOptions] 开始处理流式响应...');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            if (apiType === 'gemini') {
                // Gemini API的流式响应处理
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
                                const delta = parsed.candidates[0].content.parts[0]?.text || '';
                                content += delta;
                                
                                // 实时更新选项显示
                                await displayOptionsStreaming(content);
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            } else {
                // OpenAI兼容API的流式响应处理
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
    static selectedOptions = []; // 手动模式下选中的选项
    
    static showGeneratingUI = UIManager.showGeneratingUI;
    static hideGeneratingUI = UIManager.hideGeneratingUI;
    static displayOptions = displayOptions;
    static displayOptionsStreaming = displayOptionsStreaming;
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
        console.log('=== 开始测试上下文获取 ===');
        
        try {
            const context = await getContextCompatible(5);
            console.log('✅ 上下文获取测试完成');
            console.log('📊 获取到的消息数量:', context.messages?.length || 0);
            console.log('📊 包含角色设定:', !!context.character);
            console.log('📊 包含世界书:', !!context.world_info);
            console.log('📊 包含系统提示词:', !!context.system_prompt);
            
            if (context.messages && context.messages.length > 0) {
                console.log('📄 消息示例:');
                context.messages.forEach((msg, i) => {
                    console.log(`   ${i+1}. [${msg.role}] ${msg.content.substring(0, 100)}...`);
                });
            }
            
            if (context.character) {
                console.log('📄 角色设定详情:');
                console.log(`   名称: ${context.character.name || '未设置'}`);
                console.log(`   描述: ${context.character.description || '未设置'}`);
                console.log(`   人格: ${context.character.personality || '未设置'}`);
            }
            
            if (context.world_info && context.world_info.length > 0) {
                console.log('📄 世界书详情:');
                context.world_info.forEach((world, i) => {
                    console.log(`   世界书 ${i+1}: ${world.title || '未命名'}`);
                    console.log(`   内容: ${world.content?.substring(0, 100) || '无内容'}...`);
                });
            }
            
            return context;
        } catch (error) {
            console.error('❌ 上下文获取测试失败:', error);
            return null;
        }
    }
    
    // 专门测试角色卡和世界书获取
    static async testCharacterAndWorldInfo() {
        console.log('=== 开始测试角色卡和世界书获取 ===');
        
        // 测试SillyTavern.getContext()
        if (typeof window.SillyTavern?.getContext === 'function') {
            try {
                console.log('🔍 测试 SillyTavern.getContext()...');
                const result = await window.SillyTavern.getContext({ tokenLimit: 8192 });
                console.log('✅ SillyTavern.getContext() 成功');
                console.log('📄 返回数据字段:', Object.keys(result || {}));
                console.log('📄 角色卡存在:', !!result?.character);
                console.log('📄 世界书存在:', !!result?.world_info);
                
                if (result?.character) {
                    console.log('📄 角色卡字段:', Object.keys(result.character));
                }
                if (result?.world_info) {
                    console.log('📄 世界书数量:', result.world_info.length);
                }
            } catch (error) {
                console.error('❌ SillyTavern.getContext() 失败:', error);
            }
        } else {
            console.log('❌ SillyTavern.getContext() 不可用');
        }
        
        // 测试DOM元素
        console.log('\n🔍 测试DOM元素...');
        const characterElements = document.querySelectorAll('#character_info, .character_info, [data-character]');
        const worldBookElements = document.querySelectorAll('.world_book, [data-world-book], .world_info');
        
        console.log('📄 角色卡DOM元素数量:', characterElements.length);
        console.log('📄 世界书DOM元素数量:', worldBookElements.length);
        
        if (characterElements.length > 0) {
            console.log('📄 第一个角色卡元素:', characterElements[0]);
        }
        if (worldBookElements.length > 0) {
            console.log('📄 第一个世界书元素:', worldBookElements[0]);
        }
        
        console.log('=== 角色卡和世界书测试完成 ===');
    }
}

// 将OptionsGenerator导出到全局作用域，以便在控制台中调用
window.OptionsGenerator = OptionsGenerator;