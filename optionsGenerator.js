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

// 简化上下文提取 - 只使用SillyTavern.getContext()
async function getContextCompatible(limit = 5) {
    console.log('=== 开始获取SillyTavern上下文数据 ===');
    
    // 获取SillyTavern原生上下文
    console.log('\n--- 获取SillyTavern上下文 ---');
    if (typeof window.SillyTavern?.getContext === 'function') {
        try {
            const result = await window.SillyTavern.getContext({ tokenLimit: 8192 });
            console.log('✅ SillyTavern.getContext() 成功');
            console.log('📄 内容类型:', typeof result);
            console.log('📄 内容结构:', Object.keys(result || {}));
            console.log('📄 完整返回数据:', JSON.stringify(result, null, 2));
            
            // 检查角色设定信息
            console.log('\n--- 检查角色设定信息 ---');
            console.log('📄 result.character 存在:', !!result?.character);
            console.log('📄 result.character 类型:', typeof result?.character);
            if (result?.character) {
                console.log('📄 角色设定字段:', Object.keys(result.character));
                console.log('📄 角色名称:', result.character.name || '未设置');
                console.log('📄 角色描述:', result.character.description || '未设置');
                console.log('📄 角色人格:', result.character.personality || '未设置');
                console.log('📄 角色场景:', result.character.scenario || '未设置');
                console.log('📄 角色第一印象:', result.character.first_mes || '未设置');
                console.log('📄 角色消息示例:', result.character.mes_example || '未设置');
                console.log('📄 完整角色信息:', JSON.stringify(result.character, null, 2));
            } else {
                console.log('❌ 未找到角色设定信息');
            }
            
            // 检查世界书信息
            console.log('\n--- 检查世界书信息 ---');
            console.log('📄 result.world_info 存在:', !!result?.world_info);
            console.log('📄 result.world_info 类型:', typeof result?.world_info);
            if (result?.world_info) {
                console.log('📄 世界书数量:', result.world_info.length || 0);
                if (result.world_info.length > 0) {
                    result.world_info.forEach((world, index) => {
                        console.log(`📄 世界书 ${index + 1}:`);
                        console.log(`   名称: ${world.title || '未命名'}`);
                        console.log(`   内容: ${world.content || '无内容'}`);
                        console.log(`   关键词: ${world.keys || '无关键词'}`);
                        console.log(`   优先级: ${world.priority || '默认'}`);
                    });
                }
                console.log('📄 完整世界书信息:', JSON.stringify(result.world_info, null, 2));
            } else {
                console.log('❌ 未找到世界书信息');
            }
            
            // 备用方案：尝试其他方式获取角色卡和世界书
            let characterInfo = result?.character;
            let worldInfo = result?.world_info;
            
            // 如果SillyTavern没有返回角色卡，尝试其他方式
            if (!characterInfo) {
                console.log('\n--- 尝试备用方案获取角色卡 ---');
                
                // 备用方案1: 尝试从DOM获取角色卡
                const characterCard = document.querySelector('#character_info, .character_info, [data-character]');
                if (characterCard) {
                    console.log('✅ 从DOM找到角色卡元素');
                    const charName = characterCard.querySelector('.char_name, .character_name')?.textContent?.trim();
                    const charDesc = characterCard.querySelector('.char_desc, .character_description')?.textContent?.trim();
                    if (charName || charDesc) {
                        characterInfo = {
                            name: charName || '未知角色',
                            description: charDesc || '无描述'
                        };
                        console.log('📄 从DOM获取的角色卡:', characterInfo);
                    }
                }
                
                // 备用方案2: 尝试TavernHelper
                if (!characterInfo && typeof window.TavernHelper?.getCharacter === 'function') {
                    try {
                        console.log('🔍 尝试使用TavernHelper.getCharacter()...');
                        const charData = window.TavernHelper.getCharacter();
                        if (charData) {
                            characterInfo = charData;
                            console.log('✅ TavernHelper.getCharacter() 成功:', characterInfo);
                        }
                    } catch (error) {
                        console.error('❌ TavernHelper.getCharacter() 失败:', error);
                    }
                }
            }
            
            // 如果SillyTavern没有返回世界书，尝试其他方式
            if (!worldInfo) {
                console.log('\n--- 尝试备用方案获取世界书 ---');
                
                // 备用方案1: 尝试TavernHelper
                if (typeof window.TavernHelper?.getWorldBooks === 'function') {
                    try {
                        console.log('🔍 尝试使用TavernHelper.getWorldBooks()...');
                        const worldBooks = window.TavernHelper.getWorldBooks();
                        if (worldBooks && worldBooks.length > 0) {
                            worldInfo = worldBooks;
                            console.log('✅ TavernHelper.getWorldBooks() 成功，数量:', worldBooks.length);
                        }
                    } catch (error) {
                        console.error('❌ TavernHelper.getWorldBooks() 失败:', error);
                    }
                }
                
                // 备用方案2: 尝试从DOM获取世界书
                if (!worldInfo) {
                    const worldBookElements = document.querySelectorAll('.world_book, [data-world-book], .world_info');
                    if (worldBookElements.length > 0) {
                        console.log('✅ 从DOM找到世界书元素，数量:', worldBookElements.length);
                        worldInfo = [];
                        worldBookElements.forEach((element, index) => {
                            const title = element.querySelector('.title, .world_title')?.textContent?.trim() || `世界书${index + 1}`;
                            const content = element.querySelector('.content, .world_content')?.textContent?.trim() || '';
                            if (content) {
                                worldInfo.push({
                                    title: title,
                                    content: content,
                                    keys: '',
                                    priority: 'default'
                                });
                            }
                        });
                        console.log('📄 从DOM获取的世界书:', worldInfo);
                    }
                }
            }
            
            // 处理消息，只保留最近5条
            if (result && result.messages) {
                const recentMessages = result.messages.slice(-limit);
                console.log('\n--- 最近对话消息 ---');
                console.log('📄 原始消息数量:', result.messages.length);
                console.log('📄 截取最近消息数量:', recentMessages.length);
                console.log('📄 最近消息内容:');
                recentMessages.forEach((msg, i) => {
                    console.log(`   ${i+1}. [${msg.role}] ${msg.content.substring(0, 100)}...`);
                });
                console.log('📄 完整最近消息:', JSON.stringify(recentMessages, null, 2));
                
                // 返回简化后的上下文
                const simplifiedContext = {
                    messages: recentMessages,
                    character: characterInfo,
                    world_info: worldInfo,
                    system_prompt: result.system_prompt,
                    original_message_count: result.messages.length
                };
                
                console.log('\n=== 上下文数据获取完成 ===');
                console.log('📊 返回消息数量:', recentMessages.length);
                console.log('📊 包含角色设定:', !!characterInfo);
                console.log('📊 包含世界书:', !!worldInfo);
                console.log('📊 包含系统提示词:', !!result.system_prompt);
                
                return simplifiedContext;
            } else {
                console.log('❌ SillyTavern.getContext() 未返回消息数据');
                console.log('🔍 尝试备用方案获取消息...');
                
                // 备用方案1: 尝试从DOM获取消息
                const chatMessages = document.querySelectorAll('#chat .mes');
                if (chatMessages.length > 0) {
                    console.log('✅ 从DOM获取到消息，数量:', chatMessages.length);
                    const messages = [];
                    chatMessages.forEach((mes, index) => {
                        // 更精确的角色判断
                        let role = 'user';
                        if (mes.classList.contains('swiper-slide') || 
                            mes.classList.contains('assistant') || 
                            mes.querySelector('.avatar') ||
                            mes.getAttribute('data-is-user') === 'false') {
                            role = 'assistant';
                        }
                        
                        // 获取消息内容
                        const contentElement = mes.querySelector('.mes_text') || mes.querySelector('.message') || mes;
                        const content = contentElement.textContent?.trim() || '';
                        
                        if (content && content.length > 0) {
                            messages.push({ role, content });
                            console.log(`📄 消息 ${index + 1}: [${role}] ${content.substring(0, 50)}...`);
                        }
                    });
                    
                    if (messages.length > 0) {
                        const recentMessages = messages.slice(-limit);
                        console.log('📄 从DOM获取的最近消息:', recentMessages);
                        
                        return {
                            messages: recentMessages,
                            character: characterInfo,
                            world_info: worldInfo,
                            system_prompt: result?.system_prompt,
                            original_message_count: messages.length
                        };
                    } else {
                        console.log('❌ DOM消息内容为空');
                    }
                } else {
                    console.log('❌ 未找到DOM消息元素');
                }
                
                // 备用方案2: 尝试TavernHelper
                if (typeof window.TavernHelper?.getMessages === 'function') {
                    try {
                        console.log('🔍 尝试使用TavernHelper.getMessages()...');
                        const messages = window.TavernHelper.getMessages();
                        if (messages && messages.length > 0) {
                            console.log('✅ TavernHelper.getMessages() 成功，数量:', messages.length);
                            const recentMessages = messages.slice(-limit);
                            return {
                                messages: recentMessages,
                                character: characterInfo,
                                world_info: worldInfo,
                                system_prompt: result?.system_prompt,
                                original_message_count: messages.length
                            };
                        }
                    } catch (error) {
                        console.error('❌ TavernHelper.getMessages() 失败:', error);
                    }
                }
                
                console.log('❌ 所有备用方案都失败，返回空消息数组');
                return { messages: [] };
            }
        } catch (error) {
            console.error('❌ SillyTavern.getContext() 失败:', error);
            return { messages: [] };
        }
    } else {
        console.log('❌ SillyTavern.getContext() 不可用');
        return { messages: [] };
    }
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
        if (context.world_info && context.world_info.length > 0) {
            fullContextText += '## 世界书信息\n';
            context.world_info.forEach((world, index) => {
                fullContextText += `世界书 ${index + 1}:\n`;
                fullContextText += `名称: ${world.title || '未命名'}\n`;
                fullContextText += `内容: ${world.content || '无内容'}\n`;
                fullContextText += `关键词: ${world.keys || '无关键词'}\n`;
                fullContextText += `优先级: ${world.priority || '默认'}\n\n`;
            });
        }
        
        // 3. 添加系统提示词
        if (context.system_prompt) {
            fullContextText += '## 系统提示词\n';
            fullContextText += context.system_prompt + '\n\n';
        }
        
        // 4. 添加最近对话消息
        if (context.messages && context.messages.length > 0) {
            fullContextText += '## 最近对话历史\n';
            fullContextText += context.messages.map(m => `[${m.role}] ${m.content}`).join('\n');
            fullContextText += '\n\n';
        }
        
        // 5. 添加统计信息
        fullContextText += '## 上下文统计\n';
        fullContextText += `原始消息总数: ${context.original_message_count || 0}\n`;
        fullContextText += `当前使用消息数: ${context.messages ? context.messages.length : 0}\n`;
        fullContextText += `包含角色设定: ${!!context.character}\n`;
        fullContextText += `包含世界书: ${!!(context.world_info && context.world_info.length > 0)}\n`;
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
        
        // 测试TavernHelper
        if (typeof window.TavernHelper !== 'undefined') {
            console.log('\n🔍 测试 TavernHelper...');
            console.log('📄 TavernHelper 方法:', Object.keys(window.TavernHelper));
            
            if (typeof window.TavernHelper.getCharacter === 'function') {
                try {
                    const charData = window.TavernHelper.getCharacter();
                    console.log('✅ TavernHelper.getCharacter() 成功:', charData);
                } catch (error) {
                    console.error('❌ TavernHelper.getCharacter() 失败:', error);
                }
            }
            
            if (typeof window.TavernHelper.getWorldBooks === 'function') {
                try {
                    const worldBooks = window.TavernHelper.getWorldBooks();
                    console.log('✅ TavernHelper.getWorldBooks() 成功:', worldBooks);
                } catch (error) {
                    console.error('❌ TavernHelper.getWorldBooks() 失败:', error);
                }
            }
        } else {
            console.log('❌ TavernHelper 不可用');
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
    
    // 诊断SillyTavern API问题
    static async diagnoseSillyTavernAPI() {
        console.log('=== 开始诊断SillyTavern API问题 ===');
        
        // 1. 测试代理服务器连接
        console.log('\n🔍 测试代理服务器连接...');
        const settings = getSettings();
        const apiType = settings.optionsApiType || 'openai';
        const modelName = settings.optionsApiModel || 'gpt-3.5-turbo';
        
        try {
            let testBody;
            if (apiType === 'gemini') {
                // 使用Gemini格式的测试请求
                testBody = {
                    contents: [{
                        parts: [{
                            text: 'test'
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 10,
                    }
                };
            } else {
                // 使用OpenAI格式的测试请求
                testBody = {
                    model: modelName,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 10
                };
            }
            
            const testResponse = await fetch('http://127.0.0.1:8001/api/backends/chat-completions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testBody)
            });
            console.log('✅ 代理服务器连接成功，状态:', testResponse.status);
            const testText = await testResponse.text();
            console.log('📄 测试响应:', testText.substring(0, 200));
        } catch (error) {
            console.error('❌ 代理服务器连接失败:', error);
        }
        
        // 2. 检查SillyTavern设置
        console.log('\n🔍 检查SillyTavern设置...');
        console.log('📄 当前API设置:');
        console.log('  - API类型:', settings.optionsApiType);
        console.log('  - 模型:', settings.optionsApiModel);
        console.log('  - 基础URL:', settings.optionsBaseUrl);
        console.log('  - 是否启用:', settings.optionsGenEnabled);
        
        // 3. 检查全局SillyTavern对象
        console.log('\n🔍 检查SillyTavern全局对象...');
        if (window.SillyTavern) {
            console.log('✅ SillyTavern对象存在');
            console.log('📄 可用方法:', Object.keys(window.SillyTavern));
            
            // 检查是否有API相关设置
            if (window.SillyTavern.settings) {
                console.log('📄 SillyTavern设置:', window.SillyTavern.settings);
            }
        } else {
            console.log('❌ SillyTavern对象不存在');
        }
        
        // 4. 检查网络请求
        console.log('\n🔍 检查网络请求配置...');
        const originalFetch = window.fetch;
        let requestCount = 0;
        
        window.fetch = function(...args) {
            requestCount++;
            console.log(`📄 网络请求 ${requestCount}:`, args[0]);
            if (args[1] && args[1].body) {
                try {
                    const body = JSON.parse(args[1].body);
                    console.log(`📄 请求体大小:`, JSON.stringify(body).length, '字符');
                    if (JSON.stringify(body).length > 10000) {
                        console.log('⚠️ 请求体过大，可能导致500错误');
                    }
                } catch (e) {
                    console.log('📄 请求体解析失败');
                }
            }
            return originalFetch.apply(this, args);
        };
        
        console.log('✅ 已安装网络请求监听器');
        console.log('📄 请尝试发送一条消息，然后查看控制台输出');
        
        console.log('\n=== SillyTavern API诊断完成 ===');
        console.log('💡 建议:');
        console.log('1. 检查代理服务器是否正常运行');
        console.log('2. 检查SillyTavern的API配置');
        console.log('3. 尝试减少上下文长度');
        console.log('4. 检查代理服务器的token限制');
        if (apiType === 'gemini') {
            console.log('5. 对于Gemini模型，检查API密钥是否正确');
            console.log('6. 确认代理服务器支持Gemini API格式');
            console.log('7. 检查gemini-2.5-pro模型是否在代理服务器中可用');
        }
    }
    
    // 详细诊断SillyTavern内部API调用
    static async diagnoseSillyTavernInternalAPI() {
        console.log('=== 开始详细诊断SillyTavern内部API调用 ===');
        
        const settings = getSettings();
        const apiType = settings.optionsApiType || 'openai';
        const modelName = settings.optionsApiModel || 'gpt-3.5-turbo';
        
        console.log('📄 当前扩展设置:');
        console.log('  - API类型:', apiType);
        console.log('  - 模型:', modelName);
        console.log('  - 基础URL:', settings.optionsBaseUrl);
        
        // 1. 检查SillyTavern的内部API配置
        console.log('\n🔍 检查SillyTavern内部API配置...');
        if (window.SillyTavern && window.SillyTavern.settings) {
            const stSettings = window.SillyTavern.settings;
            console.log('📄 SillyTavern API设置:');
            console.log('  - 后端类型:', stSettings.api_backend);
            console.log('  - API URL:', stSettings.api_url);
            console.log('  - 模型:', stSettings.api_model);
            console.log('  - 最大上下文:', stSettings.max_context);
            console.log('  - 最大新token:', stSettings.max_new_tokens);
            
            // 检查是否有冲突
            if (stSettings.api_model !== modelName) {
                console.log('⚠️ 模型不匹配: SillyTavern使用', stSettings.api_model, '，扩展使用', modelName);
            }
            if (stSettings.api_url !== settings.optionsBaseUrl) {
                console.log('⚠️ API URL不匹配: SillyTavern使用', stSettings.api_url, '，扩展使用', settings.optionsBaseUrl);
            }
        } else {
            console.log('❌ 无法获取SillyTavern设置');
        }
        
        // 2. 模拟SillyTavern的完整请求
        console.log('\n🔍 模拟SillyTavern的完整请求...');
        try {
            // 获取完整的上下文
            const context = await this.getContextCompatible(5);
            console.log('📄 获取到的上下文长度:', JSON.stringify(context).length, '字符');
            
            // 构建SillyTavern风格的请求
            let requestBody;
            if (apiType === 'gemini') {
                requestBody = {
                    contents: [{
                        parts: [{
                            text: `角色设定：${context.characterInfo || '无'}\n\n世界设定：${context.worldInfo || '无'}\n\n系统提示：${context.systemPrompt || '无'}\n\n对话历史：${context.messages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n用户：请回复`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 100,
                        temperature: 0.7
                    }
                };
            } else {
                const messages = [];
                
                // 添加系统消息
                if (context.systemPrompt) {
                    messages.push({ role: 'system', content: context.systemPrompt });
                }
                
                // 添加角色和世界信息
                if (context.characterInfo || context.worldInfo) {
                    let assistantInfo = '';
                    if (context.characterInfo) assistantInfo += `角色设定：${context.characterInfo}\n\n`;
                    if (context.worldInfo) assistantInfo += `世界设定：${context.worldInfo}`;
                    if (assistantInfo) {
                        messages.push({ role: 'assistant', content: assistantInfo });
                    }
                }
                
                // 添加对话历史
                messages.push(...context.messages);
                
                // 添加用户消息
                messages.push({ role: 'user', content: '请回复' });
                
                requestBody = {
                    model: modelName,
                    messages: messages,
                    max_tokens: 100,
                    temperature: 0.7
                };
            }
            
            console.log('📄 请求体大小:', JSON.stringify(requestBody).length, '字符');
            if (JSON.stringify(requestBody).length > 15000) {
                console.log('⚠️ 请求体过大，可能导致500错误');
            }
            
            // 3. 发送测试请求
            console.log('\n🔍 发送测试请求...');
            const response = await fetch('http://127.0.0.1:8001/api/backends/chat-completions/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📄 响应状态:', response.status);
            console.log('📄 响应头:', Object.fromEntries(response.headers.entries()));
            
            const responseText = await response.text();
            console.log('📄 响应内容:', responseText.substring(0, 500));
            
            if (response.ok) {
                console.log('✅ 测试请求成功');
            } else {
                console.log('❌ 测试请求失败');
                if (response.status === 500) {
                    console.log('💡 500错误通常表示:');
                    console.log('  1. 请求体过大或格式错误');
                    console.log('  2. 代理服务器内部错误');
                    console.log('  3. 模型不支持或配置错误');
                    console.log('  4. API密钥问题');
                }
            }
            
        } catch (error) {
            console.error('❌ 测试请求异常:', error);
        }
        
        // 4. 检查SillyTavern的事件系统
        console.log('\n🔍 检查SillyTavern事件系统...');
        if (window.eventSource) {
            console.log('✅ 事件源存在');
            console.log('📄 事件类型:', Object.keys(window.eventSource._events || {}));
        } else {
            console.log('❌ 事件源不存在');
        }
        
        // 5. 提供解决建议
        console.log('\n=== 详细诊断完成 ===');
        console.log('💡 解决建议:');
        console.log('1. 检查代理服务器日志获取详细错误信息');
        console.log('2. 确认SillyTavern和扩展使用相同的API配置');
        console.log('3. 尝试减少上下文长度（减少max_context设置）');
        console.log('4. 检查代理服务器是否支持当前模型');
        console.log('5. 验证API密钥的有效性');
        if (apiType === 'gemini') {
            console.log('6. 确认代理服务器正确配置了Gemini API');
            console.log('7. 检查gemini-2.5-pro模型是否在代理服务器中可用');
        }
        console.log('8. 尝试重启代理服务器');
        console.log('9. 检查代理服务器的token限制设置');
    }
}

// 将OptionsGenerator导出到全局作用域，以便在控制台中调用
window.OptionsGenerator = OptionsGenerator;