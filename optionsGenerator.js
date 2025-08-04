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
        `;
        sendForm.insertAdjacentElement('beforebegin', container);
        
        // 在流式生成过程中，不隐藏思考提示
        // 只有在流式生成完成后才隐藏
    }
    
    // 获取当前发送模式
    const settings = getSettings();
    const sendMode = settings.sendMode || 'manual';
    
    // 在手动模式下，记录已选择的选项
    if (sendMode === 'manual') {
        // 重置选中的选项
        OptionsGenerator.selectedOptions = [];
    }
    
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
                cursor: pointer;
                transition: none;
                word-wrap: break-word;
                white-space: normal;
            `;
            container.appendChild(btn);
            
            // 设置点击事件
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

// 兼容型上下文提取 - 获取所有类型的上下文数据
async function getContextCompatible(limit = 20) {
    console.log('=== 开始获取完整上下文数据 ===');
    
    const allContextData = {
        sillyTavernContext: null,
        tavernHelperContext: null,
        tavernHelperChat: null,
        sillyTavernChat: null,
        tavernHelperMessages: null,
        domMessages: null,
        tavernHelperExtras: null
    };
    
    // 1. 获取SillyTavern原生上下文
    console.log('\n--- 1. SillyTavern原生上下文 ---');
    if (typeof window.SillyTavern?.getContext === 'function') {
        try {
            const result = await window.SillyTavern.getContext({ tokenLimit: 8192 });
            allContextData.sillyTavernContext = result;
            console.log('✅ SillyTavern.getContext() 成功');
            console.log('📄 内容类型:', typeof result);
            console.log('📄 内容结构:', Object.keys(result || {}));
            if (result && result.messages) {
                console.log('📄 消息数量:', result.messages.length);
                console.log('📄 前3条消息示例:');
                result.messages.slice(0, 3).forEach((msg, i) => {
                    console.log(`   ${i+1}. [${msg.role}] ${msg.content.substring(0, 100)}...`);
                });
            }
            console.log('📄 完整内容:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('❌ SillyTavern.getContext() 失败:', error);
        }
    } else {
        console.log('❌ SillyTavern.getContext() 不可用');
    }
    
    // 2. 获取TavernHelper上下文
    console.log('\n--- 2. TavernHelper上下文 ---');
    if (typeof window.TavernHelper?.getContext === 'function') {
        try {
            const result = await window.TavernHelper.getContext({ tokenLimit: 8192 });
            allContextData.tavernHelperContext = result;
            console.log('✅ TavernHelper.getContext() 成功');
            console.log('📄 内容类型:', typeof result);
            console.log('📄 内容结构:', Object.keys(result || {}));
            if (result && result.messages) {
                console.log('📄 消息数量:', result.messages.length);
                console.log('📄 前3条消息示例:');
                result.messages.slice(0, 3).forEach((msg, i) => {
                    console.log(`   ${i+1}. [${msg.role}] ${msg.content.substring(0, 100)}...`);
                });
            }
            console.log('📄 完整内容:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('❌ TavernHelper.getContext() 失败:', error);
        }
    } else {
        console.log('❌ TavernHelper.getContext() 不可用');
    }
    
    // 3. 获取TavernHelper聊天数据
    console.log('\n--- 3. TavernHelper聊天数据 ---');
    if (typeof window.TavernHelper?.getChat === 'function') {
        try {
            const result = await window.TavernHelper.getChat();
            allContextData.tavernHelperChat = result;
            console.log('✅ TavernHelper.getChat() 成功');
            console.log('📄 内容类型:', typeof result);
            console.log('📄 内容长度:', Array.isArray(result) ? result.length : '非数组');
            if (Array.isArray(result) && result.length > 0) {
                console.log('📄 前3条消息示例:');
                result.slice(0, 3).forEach((msg, i) => {
                    console.log(`   ${i+1}.`, msg);
                });
            }
            console.log('📄 完整内容:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('❌ TavernHelper.getChat() 失败:', error);
        }
    } else {
        console.log('❌ TavernHelper.getChat() 不可用');
    }
    
    // 4. 获取SillyTavern聊天数组
    console.log('\n--- 4. SillyTavern聊天数组 ---');
    if (window.SillyTavern?.chat) {
        try {
            const messages = window.SillyTavern.chat.map(msg => ({
                role: msg.is_user ? 'user' : 'assistant',
                content: msg.mes,
                timestamp: msg.timestamp,
                id: msg.id
            }));
            allContextData.sillyTavernChat = messages;
            console.log('✅ SillyTavern.chat 解析成功');
            console.log('📄 消息数量:', messages.length);
            console.log('📄 前3条消息示例:');
            messages.slice(0, 3).forEach((msg, i) => {
                console.log(`   ${i+1}. [${msg.role}] ${msg.content.substring(0, 100)}...`);
            });
            console.log('📄 完整内容:', JSON.stringify(messages, null, 2));
        } catch (error) {
            console.error('❌ SillyTavern.chat 解析失败:', error);
        }
    } else {
        console.log('❌ SillyTavern.chat 不可用');
    }
    
    // 5. 获取TavernHelper消息
    console.log('\n--- 5. TavernHelper消息 ---');
    if (typeof window.TavernHelper?.getMessages === 'function') {
        try {
            const result = await window.TavernHelper.getMessages();
            allContextData.tavernHelperMessages = result;
            console.log('✅ TavernHelper.getMessages() 成功');
            console.log('📄 内容类型:', typeof result);
            console.log('📄 内容长度:', Array.isArray(result) ? result.length : '非数组');
            if (Array.isArray(result) && result.length > 0) {
                console.log('📄 前3条消息示例:');
                result.slice(0, 3).forEach((msg, i) => {
                    console.log(`   ${i+1}.`, msg);
                });
            }
            console.log('📄 完整内容:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('❌ TavernHelper.getMessages() 失败:', error);
        }
    } else {
        console.log('❌ TavernHelper.getMessages() 不可用');
    }
    
    // 6. 获取TavernHelper额外信息
    console.log('\n--- 6. TavernHelper额外信息 ---');
    if (window.TavernHelper) {
        try {
            const extras = {};
            
            // 获取角色头像路径
            if (typeof window.TavernHelper.getCharAvatarPath === 'function') {
                extras.charAvatarPath = window.TavernHelper.getCharAvatarPath();
                console.log('✅ 角色头像路径:', extras.charAvatarPath);
            }
            
            // 获取世界书籍
            if (typeof window.TavernHelper.getWorldBooks === 'function') {
                extras.worldBooks = window.TavernHelper.getWorldBooks();
                console.log('✅ 世界书籍:', extras.worldBooks);
            }
            
            // 获取变量
            if (typeof window.TavernHelper.getVariables === 'function') {
                extras.variables = window.TavernHelper.getVariables();
                console.log('✅ 变量:', extras.variables);
            }
            
            allContextData.tavernHelperExtras = extras;
            console.log('📄 完整额外信息:', JSON.stringify(extras, null, 2));
        } catch (error) {
            console.error('❌ 获取TavernHelper额外信息失败:', error);
        }
    }
    
    // 7. DOM解析备用方案
    console.log('\n--- 7. DOM解析备用方案 ---');
    try {
        const messageElements = document.querySelectorAll('#chat .mes');
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
                }
            }
        });
        
        allContextData.domMessages = messages.slice(-limit);
        console.log('✅ DOM解析成功');
        console.log('📄 消息数量:', allContextData.domMessages.length);
        console.log('📄 前3条消息示例:');
        allContextData.domMessages.slice(0, 3).forEach((msg, i) => {
            console.log(`   ${i+1}. [${msg.role}] ${msg.content.substring(0, 100)}...`);
        });
        console.log('📄 完整内容:', JSON.stringify(allContextData.domMessages, null, 2));
    } catch (error) {
        console.error('❌ DOM解析失败:', error);
    }
    
    // 8. 返回所有获取到的上下文数据
    console.log('\n--- 8. 返回所有上下文数据 ---');
    
    // 选择最佳数据源作为主要消息
    let primaryMessages = [];
    if (allContextData.sillyTavernContext && allContextData.sillyTavernContext.messages) {
        primaryMessages = allContextData.sillyTavernContext.messages;
        console.log('✅ 使用 SillyTavern.getContext() 作为主要消息源');
    } else if (allContextData.tavernHelperContext && allContextData.tavernHelperContext.messages) {
        primaryMessages = allContextData.tavernHelperContext.messages;
        console.log('✅ 使用 TavernHelper.getContext() 作为主要消息源');
    } else if (allContextData.sillyTavernChat) {
        primaryMessages = allContextData.sillyTavernChat.slice(-limit);
        console.log('✅ 使用 SillyTavern.chat 作为主要消息源');
    } else if (allContextData.tavernHelperChat) {
        primaryMessages = allContextData.tavernHelperChat;
        console.log('✅ 使用 TavernHelper.getChat() 作为主要消息源');
    } else if (allContextData.tavernHelperMessages) {
        primaryMessages = allContextData.tavernHelperMessages;
        console.log('✅ 使用 TavernHelper.getMessages() 作为主要消息源');
    } else if (allContextData.domMessages) {
        primaryMessages = allContextData.domMessages;
        console.log('✅ 使用 DOM解析 作为主要消息源');
    } else {
        console.log('❌ 所有数据源都失败，使用空消息数组');
    }
    
    // 构建包含所有数据的完整上下文
    const completeContext = {
        messages: primaryMessages,
        allContextData: allContextData, // 包含所有获取到的数据
        summary: {
            sillyTavernContext: !!allContextData.sillyTavernContext,
            tavernHelperContext: !!allContextData.tavernHelperContext,
            tavernHelperChat: !!allContextData.tavernHelperChat,
            sillyTavernChat: !!allContextData.sillyTavernChat,
            tavernHelperMessages: !!allContextData.tavernHelperMessages,
            domMessages: !!allContextData.domMessages,
            tavernHelperExtras: !!allContextData.tavernHelperExtras
        }
    };
    
    console.log('\n=== 上下文数据获取完成 ===');
    console.log('📊 主要消息数量:', primaryMessages.length);
    console.log('📊 数据源可用性:', completeContext.summary);
    console.log('📊 完整上下文结构:', Object.keys(completeContext));
    
    return completeContext;
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
        
        // 构建包含所有上下文数据的完整提示词
        let fullContextText = '';
        
        // 1. 添加主要对话消息
        if (context.messages && context.messages.length > 0) {
            fullContextText += '## 主要对话历史\n';
            fullContextText += context.messages.map(m => `[${m.role}] ${m.content}`).join('\n');
            fullContextText += '\n\n';
        }
        
        // 2. 添加SillyTavern原生上下文数据
        if (context.allContextData.sillyTavernContext) {
            fullContextText += '## SillyTavern原生上下文数据\n';
            fullContextText += JSON.stringify(context.allContextData.sillyTavernContext, null, 2);
            fullContextText += '\n\n';
        }
        
        // 3. 添加TavernHelper上下文数据
        if (context.allContextData.tavernHelperContext) {
            fullContextText += '## TavernHelper上下文数据\n';
            fullContextText += JSON.stringify(context.allContextData.tavernHelperContext, null, 2);
            fullContextText += '\n\n';
        }
        
        // 4. 添加TavernHelper聊天数据
        if (context.allContextData.tavernHelperChat) {
            fullContextText += '## TavernHelper聊天数据\n';
            fullContextText += JSON.stringify(context.allContextData.tavernHelperChat, null, 2);
            fullContextText += '\n\n';
        }
        
        // 5. 添加SillyTavern聊天数组
        if (context.allContextData.sillyTavernChat) {
            fullContextText += '## SillyTavern聊天数组\n';
            fullContextText += JSON.stringify(context.allContextData.sillyTavernChat, null, 2);
            fullContextText += '\n\n';
        }
        
        // 6. 添加TavernHelper消息
        if (context.allContextData.tavernHelperMessages) {
            fullContextText += '## TavernHelper消息\n';
            fullContextText += JSON.stringify(context.allContextData.tavernHelperMessages, null, 2);
            fullContextText += '\n\n';
        }
        
        // 7. 添加TavernHelper额外信息
        if (context.allContextData.tavernHelperExtras) {
            fullContextText += '## TavernHelper额外信息\n';
            fullContextText += JSON.stringify(context.allContextData.tavernHelperExtras, null, 2);
            fullContextText += '\n\n';
        }
        
        // 8. 添加DOM解析消息
        if (context.allContextData.domMessages) {
            fullContextText += '## DOM解析消息\n';
            fullContextText += JSON.stringify(context.allContextData.domMessages, null, 2);
            fullContextText += '\n\n';
        }
        
        // 9. 添加数据源摘要
        fullContextText += '## 数据源摘要\n';
        fullContextText += JSON.stringify(context.summary, null, 2);
        fullContextText += '\n\n';
        
        const prompt = promptTemplate
            .replace(/{{context}}/g, fullContextText);
        console.log('[generateOptions] 提示词组装完成，长度:', prompt.length);
        console.log('[generateOptions] 完整上下文数据已包含在提示词中');
        
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
    static selectedOptions = []; // 手动模式下选中的选项
    
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