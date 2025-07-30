import { getSettings } from './common.js';
import { saveSettingsDebounced, eventSource, event_types, name2, isStreamingEnabled, selected_group, TavernHelper } from '../../../../script.js';

const settings = getSettings();
const MODULE_NAME = 'AI导演';

// A helper function to create settings elements
function createSetting(type, key, label, options = {}) {
    const settingContainer = document.createElement('div');
    settingContainer.classList.add('form-group');

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    settingContainer.appendChild(labelElement);

    let inputElement;
    switch (type) {
        case 'checkbox':
            inputElement = document.createElement('input');
            inputElement.type = 'checkbox';
            inputElement.checked = settings[key];
            inputElement.addEventListener('change', () => {
                settings[key] = inputElement.checked;
                saveSettingsDebounced();
                if (options.onChange) options.onChange(inputElement.checked);
            });
            // Align checkbox with label
            settingContainer.style.display = 'flex';
            settingContainer.style.alignItems = 'center';
            labelElement.style.flexGrow = '1';
            inputElement.style.width = 'auto';
            break;
        case 'select':
            inputElement = document.createElement('select');
            inputElement.classList.add('text_pole');
            options.choices.forEach(choice => {
                const optionElement = document.createElement('option');
                optionElement.value = choice.value;
                optionElement.textContent = choice.label;
                inputElement.appendChild(optionElement);
            });
            inputElement.value = settings[key];
            inputElement.addEventListener('change', () => {
                settings[key] = inputElement.value;
                saveSettingsDebounced();
                if (options.onChange) options.onChange(inputElement.value);
            });
            break;
        case 'textarea':
            inputElement = document.createElement('textarea');
            inputElement.classList.add('text_pole');
            inputElement.value = settings[key];
            inputElement.rows = options.rows || 5;
            inputElement.addEventListener('input', () => {
                settings[key] = inputElement.value;
                saveSettingsDebounced();
            });
            break;
        default: // 'text', 'password', 'color'
            inputElement = document.createElement('input');
            inputElement.type = type;
            inputElement.classList.add('text_pole');
            inputElement.value = settings[key];
            inputElement.addEventListener('input', () => {
                settings[key] = inputElement.value;
                saveSettingsDebounced();
            });
            break;
    }
    settingContainer.appendChild(inputElement);
    return { container: settingContainer, input: inputElement };
}


// ----------------- Typing Indicator Logic -----------------
const typingIndicator = document.createElement('div');
typingIndicator.id = 'typing_indicator';
typingIndicator.style.display = 'none';
typingIndicator.innerHTML = `
    <div class="typing-indicator-text"></div>
    <div class="typing-ellipsis">
        <span>.</span><span>.</span><span>.</span>
    </div>
`;

function applyTheme(themeName) {
    const themeStyle = document.getElementById('ti-theme-style');
    const theme = settings.ti_themes[themeName];
    if (themeStyle && theme) {
        themeStyle.innerHTML = theme.css;
    }
}

function injectGlobalStyles() {
    if (document.getElementById('ti-global-style')) return;
    const style = document.createElement('style');
    style.id = 'ti-global-style';
    style.innerHTML = `
        #typing_indicator {
            align-items: center;
            color: var(--text_color);
            display: flex;
            gap: 4px;
            margin: 0 var(--margin) 0.5rem;
            padding: 0.5rem;
        }
        #typing_indicator .typing-ellipsis span {
            animation: typing-indicator-blink 1.4s infinite;
            animation-fill-mode: both;
        }
        #typing_indicator .typing-ellipsis span:nth-child(2) { animation-delay: .2s; }
        #typing_indicator .typing-ellipsis span:nth-child(3) { animation-delay: .4s; }
        @keyframes typing-indicator-blink {
            0% { opacity: .2; }
            20% { opacity: 1; }
            100% { opacity: .2; }
        }
    `;
    document.head.appendChild(style);

    const themeStyle = document.createElement('style');
    themeStyle.id = 'ti-theme-style';
    document.head.appendChild(themeStyle);
}

function showTypingIndicator() {
    if (!settings.ti_enabled) return;
    if (settings.ti_streaming && isStreamingEnabled()) return;
    const chat = document.getElementById('chat');
    if (chat) chat.append(typingIndicator);
    typingIndicator.style.display = 'flex';
    const textElement = typingIndicator.querySelector('.typing-indicator-text');
    textElement.textContent = settings.ti_showCharName ? `${name2} ${settings.ti_customText}` : settings.ti_customText;
    typingIndicator.querySelector('.typing-ellipsis').style.display = settings.ti_animationEnabled ? 'block' : 'none';
    const indicatorColor = settings.ti_fontColor;
    if (indicatorColor) {
        textElement.style.color = indicatorColor;
        typingIndicator.querySelectorAll('.typing-ellipsis span').forEach(span => span.style.color = indicatorColor);
    } else {
        textElement.style.color = '';
        typingIndicator.querySelectorAll('.typing-ellipsis span').forEach(span => span.style.color = '');
    }
    chat.scrollTop = chat.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
    typingIndicator.remove();
}


// ----------------- AI Director Logic -----------------
const AIDirector = {
    state: 'IDLE',
    lastMessageId: -1,
    readyStateTimeout: null,
    suggestionsContainer: null,
    statusWidget: null,

    start() {
        if (!settings.ad_enabled) return;
        console.log(`[${MODULE_NAME}] v2.0 初始化中...`);

        this.injectUI();
        if (typeof getLastMessageId === 'function') {
            this.lastMessageId = getLastMessageId();
        } else {
            this.setState('ERROR', '核心函数 (getLastMessageId) 未找到');
            return;
        }
        this.mainLoopInterval = setInterval(() => this.mainLoop(), 500);
        this.bindEvents();
        console.log(`[${MODULE_NAME}] 初始化完成。`);
    },

    stop() {
        clearInterval(this.mainLoopInterval);
        this.statusWidget?.remove();
        this.suggestionsContainer?.remove();
        // Unbind events if necessary
    },
    
    injectUI() {
        this.statusWidget = document.createElement('div');
        this.statusWidget.id = 'ai-director-status';
        this.statusWidget.style.display = 'none';
        const sendForm = document.getElementById('send_form');
        sendForm.before(this.statusWidget);
    },

    bindEvents() {
        // Since the panel is now separate, we only bind chat-related events here
        const originalSend = window.send;
        window.send = (...args) => {
            this.cleanupSuggestions();
            this.setState('IDLE');
            return originalSend(...args);
        };

        const originalMessageSwipe = window.messageFormating.messageSwipe;
        window.messageFormating.messageSwipe = (...args) => {
             this.cleanupSuggestions();
             this.setState('IDLE');
             return originalMessageSwipe(...args);
        };

        this.statusWidget.addEventListener('click', (e) => {
            if (e.target.id === 'ai-director-retry') {
                this.setState('ANALYZING');
                this.runSuggestionLogic();
            }
        });
    },

    mainLoop() {
        if (!settings.ad_enabled) return;
        if (typeof getLastMessageId !== 'function' || typeof getChatMessages !== 'function') return;

        const currentLastMessageId = getLastMessageId();
        if (currentLastMessageId === this.lastMessageId || currentLastMessageId < 0) return;

        const lastMessage = getChatMessages(currentLastMessageId)[0];
        if(!lastMessage) return;

        const isUser = lastMessage.is_user;
        switch (this.state) {
            case 'IDLE':
            case 'READY':
            case 'ERROR':
                if (isUser) this.setState('AWAITING_AI');
                break;
            case 'AWAITING_AI':
                if (!isUser && !isStreamingEnabled()) {
                    this.setState('ANALYZING');
                    this.runSuggestionLogic();
                }
                break;
        }
        this.lastMessageId = currentLastMessageId;
    },

    setState(newState, payload = null) {
        if (this.state === newState) return;
        clearTimeout(this.readyStateTimeout);
        this.state = newState;
        this.updateStatusWidget(payload);
        if (newState === 'READY') {
            this.readyStateTimeout = setTimeout(() => {
                this.setState('IDLE');
            }, 5000);
        }
    },

    updateStatusWidget(payload) {
        if (!this.statusWidget) return;
        if (this.state === 'IDLE') {
            this.statusWidget.style.display = 'none';
            return;
        }
        this.statusWidget.style.display = 'block';
        this.statusWidget.classList.remove('error');
        let content = '';
        switch (this.state) {
            case 'AWAITING_AI': content = `<span>等待AI回复...</span>`; break;
            case 'ANALYZING': content = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${payload || '导演思考中...'}</span>`; break;
            case 'RENDERING': content = `<i class="fa-solid fa-spinner fa-spin"></i> <span>生成建议...</span>`; break;
            case 'READY': content = `<i class="fa-solid fa-check-circle"></i> <span>建议已就绪</span>`; break;
            case 'ERROR':
                this.statusWidget.classList.add('error');
                content = `<i class="fa-solid fa-exclamation-triangle"></i> <span>错误: ${payload}</span> <button id="ai-director-retry">重试</button>`;
                break;
        }
        this.statusWidget.innerHTML = content;
    },
    
    async runSuggestionLogic() {
        let finalPrompt = '';
        let analysisDataForLogging = null;
        try {
            if (settings.ad_enableDynamicDirector && settings.ad_analysisModel) {
                this.updateStatusWidget('场景分析中...');
                const analysisResult = await this.analyzeContext();
                if (analysisResult) {
                    finalPrompt = this.assembleDynamicPrompt(analysisResult);
                    analysisDataForLogging = analysisResult;
                } else {
                    finalPrompt = settings.ad_promptContent;
                }
            } else {
                finalPrompt = settings.ad_promptContent;
            }
            this.updateStatusWidget('导演思考中...');
            const isStreamAuto = settings.ad_sendMode === 'stream_auto_send';
            const apiContent = await this.callDirectorAPI(finalPrompt, isStreamAuto);
            
            if (apiContent) {
                const suggestions = this.parseSuggestions(apiContent);
                if (suggestions.length > 0) {
                    if (isStreamAuto) {
                        await this.handleSuggestionClick(suggestions[0], analysisDataForLogging, true);
                        this.setState('IDLE');
                    } else {
                        this.setState('RENDERING');
                        await this.renderSuggestions(suggestions, analysisDataForLogging);
                        this.setState('READY');
                    }
                } else { throw new Error('AI返回内容格式不正确'); }
            } else { throw new Error('API未返回有效内容'); }
        } catch (error) {
            console.error(`[${MODULE_NAME}] 核心逻辑出错:`, error);
            this.setState('ERROR', error.message);
        }
    },

    async callDirectorAPI(prompt, stream) {
        const context = await TavernHelper.getContext({ tokenLimit: 8192 });
        if (!context) throw new Error('无法获取上下文');
        const finalMessages = [...context.messages, { role: 'user', content: prompt }];

        if (settings.ad_apiType === 'gemini') {
            return this.callGeminiAPI(finalMessages);
        } else {
            return this.callOpenAIAPI(finalMessages, stream, settings.ad_model);
        }
    },
    
    async callOpenAIAPI(messages, stream, overrideModel = null, overrideTemp = 0.8) {
        const { ad_apiKey, ad_baseUrl, ad_model } = settings;
        const response = await fetch(`${ad_baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ad_apiKey}` },
            body: JSON.stringify({ model: overrideModel || ad_model, messages, temperature: overrideTemp, stream }),
        });
        if (!response.ok) { throw new Error(`API请求失败, ${response.status}: ${await response.text()}`); }
        if (stream) {
            let fullResponseText = '';
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read(); if (done) break;
                decoder.decode(value, { stream: true }).split('\n\n').filter(l => l.startsWith('data: ')).forEach(l => {
                    const jsonStr = l.substring(6); if (jsonStr === '[DONE]') return;
                    try { fullResponseText += JSON.parse(jsonStr).choices?.[0]?.delta?.content || ''; } catch (e) {}
                });
            }
            return fullResponseText;
        } else {
            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        }
    },
    
    async callGeminiAPI(messages) {
        const { ad_apiKey, ad_model } = settings;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${ad_model}:generateContent?key=${ad_apiKey}`;
        const body = { contents: this.transformMessagesForGemini(messages) };
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!response.ok) { throw new Error(`Gemini API请求失败, ${response.status}: ${await response.text()}`); }
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },
    
    transformMessagesForGemini(messages) {
        const contents = [];
        let lastRole = '';
        messages.forEach(msg => {
            if (msg.role === 'user' && lastRole === 'user') {
                contents[contents.length - 1].parts[0].text += `\n\n${msg.content}`;
            } else {
                contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] });
            }
            lastRole = msg.role;
        });
        return contents;
    },

    parseSuggestions(content) {
        return (content.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, '').trim()).filter(Boolean);
    },

    async handleSuggestionClick(text, analysisData, isAuto = false) {
        await this.sendSuggestion(text, isAuto);
        if (settings.ad_enableDynamicDirector && analysisData) {
            await this.logChoice(analysisData);
        }
    },

    async sendSuggestion(text, isAuto = false) {
        const send_textarea = document.getElementById('send_textarea');
        if (!isAuto && settings.ad_sendMode === 'manual') {
            send_textarea.value = text;
            send_textarea.dispatchEvent(new Event('input'));
        } else {
            const tempVarName = `sg_pro_text_${Date.now()}`;
            await TavernHelper.executeSlashCommands(`/setvar key=${tempVarName} ${JSON.stringify(text)} | /send {{getvar::${tempVarName}}} | /trigger | /flushvar ${tempVarName}`);
        }
        this.cleanupSuggestions();
        this.setState('IDLE');
    },

    cleanupSuggestions() {
        this.suggestionsContainer?.remove();
        this.suggestionsContainer = null;
    },

    async renderSuggestions(suggestions, analysisData) {
        this.cleanupSuggestions();
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.id = 'ai-director-suggestions';
        const sendForm = document.getElementById('send_form');
        sendForm.before(this.suggestionsContainer);

        const sleep = ms => new Promise(res => setTimeout(res, ms));
        for (const text of suggestions) {
            const capsule = document.createElement('button');
            capsule.classList.add('qr--button', 'menu_button', 'interactable', 'ai-director-capsule');
            this.suggestionsContainer.appendChild(capsule);
            
            for (let i = 0; i < text.length; i++) {
                capsule.textContent = text.substring(0, i + 1);
                await sleep(15);
            }
            capsule.addEventListener('click', () => this.handleSuggestionClick(text, analysisData));
        }
    },
    
    // Dynamic Director / Memory functions
    async analyzeContext() {
        const context = await TavernHelper.getContext({ tokenLimit: 2000 });
        if (!context || context.messages.length === 0) return null;
        const analysisPrompt = `分析以下最新的对话片段，严格以JSON格式返回当前情境。JSON必须包含 scene_type(场景类型), user_mood(我的情绪), 和 narrative_focus(当前叙事焦点) 三个键。\n\n对话片段:\n${JSON.stringify(context.messages)}\n\n你的JSON输出:`;
        try {
            const responseText = await this.callOpenAIAPI([{ role: 'user', content: analysisPrompt }], false, settings.ad_analysisModel, 0.2);
            const jsonMatch = responseText.match(/\{.*\}/s);
            if (!jsonMatch) return null;
            return JSON.parse(jsonMatch[0]);
        } catch (error) { console.error(`[${MODULE_NAME}] 分析API调用失败:`, error); return null; }
    },
    
    assembleDynamicPrompt(analysisResult) {
        let prompt = settings.ad_dynamicPromptTemplate;
        prompt = prompt.replace(/\{\{scene_type\}\}/g, analysisResult.scene_type || '未知');
        prompt = prompt.replace(/\{\{user_mood\}\}/g, analysisResult.user_mood || '未知');
        prompt = prompt.replace(/\{\{narrative_focus\}\}/g, analysisResult.narrative_focus || '未知');
        prompt = prompt.replace(/\{\{learned_style\}\}/g, settings.ad_learnedStyle || '无特定偏好');
        return prompt;
    },

    async logChoice(analysisData) {
        if (!analysisData) return;
        settings.ad_choiceLog.push(analysisData);
        if (settings.ad_choiceLog.length >= settings.ad_logTriggerCount) {
            await this.reflectOnChoices();
        }
        saveSettingsDebounced();
        this.updateMemoryPanel();
    },

    async reflectOnChoices() {
        const reflectionPrompt = `这里是一个用户在不同叙事场景下的情境分析日志（JSON数组）。请分析这些数据，用一句话总结出该用户的核心创作偏好或“玩家风格”。你的回答必须简洁、精炼、如同一个资深编辑的评语。\n\n情境日志:\n${JSON.stringify(settings.ad_choiceLog)}\n\n你的总结评语:`;
        try {
            const reflection = await this.callOpenAIAPI([{ role: 'user', content: reflectionPrompt }], false, settings.ad_analysisModel, 0.5);
            if (reflection) {
                settings.ad_learnedStyle = reflection;
                settings.ad_choiceLog = []; // Clear log after reflection
                saveSettingsDebounced();
                this.updateMemoryPanel();
            }
        } catch (error) { console.error(`[${MODULE_NAME}] “自我反思”失败:`, error); }
    },

    updateMemoryPanel() {
        const learnedStyleEl = document.getElementById('ad-learned-style');
        const progressEl = document.getElementById('ad-log-progress');
        if(learnedStyleEl) learnedStyleEl.textContent = settings.ad_learnedStyle || '无';
        if(progressEl) progressEl.textContent = `${settings.ad_choiceLog.length}/${settings.ad_logTriggerCount}`;
    }
};



// ----------------- UI Population -----------------
function populateUI() {
    const container = document.getElementById('ai-director-content-container');
    if (!container) {
        console.error(`[${MODULE_NAME}] Could not find content container!`);
        return;
    }
    container.innerHTML = ''; // Clear previous content

    // Create Tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('ai-director-tabs');
    const tiTabButton = document.createElement('button');
    tiTabButton.classList.add('ai-director-tab-button', 'active');
    tiTabButton.textContent = '打字指示器';
    const adTabButton = document.createElement('button');
    adTabButton.classList.add('ai-director-tab-button');
    adTabButton.textContent = 'AI导演';
    tabsContainer.append(tiTabButton, adTabButton);

    const tiContent = document.createElement('div');
    tiContent.classList.add('ai-director-tab-content', 'active');
    const adContent = document.createElement('div');
    adContent.classList.add('ai-director-tab-content');

    container.append(tabsContainer, tiContent, adContent);

    // Tab switching logic
    tiTabButton.addEventListener('click', () => {
        tiTabButton.classList.add('active');
        adTabButton.classList.remove('active');
        tiContent.classList.add('active');
        adContent.classList.remove('active');
    });
    adTabButton.addEventListener('click', () => {
        adTabButton.classList.add('active');
        tiTabButton.classList.remove('active');
        adContent.classList.add('active');
        tiContent.classList.remove('active');
    });

    // Populate Typing Indicator Tab
    tiContent.append(
        createSetting('checkbox', 'ti_enabled', '启用打字指示器', { onChange: (val) => val ? initTypingIndicator() : hideTypingIndicator() }).container,
        createSetting('checkbox', 'ti_streaming', '流式传输时隐藏').container,
        createSetting('checkbox', 'ti_showCharName', '显示角色名称').container,
        createSetting('checkbox', 'ti_animationEnabled', '启用省略号动画').container,
        createSetting('text', 'ti_customText', '自定义文本').container,
        createSetting('color', 'ti_fontColor', '自定义字体颜色').container,
        createSetting('select', 'ti_activeTheme', '主题', {
            choices: Object.keys(settings.ti_themes).map(name => ({ value: name, label: name })),
            onChange: applyTheme
        }).container
    );

    // Populate AI Director Tab
    const { container: adEnabledContainer, input: adEnabledInput } = createSetting('checkbox', 'ad_enabled', '启用AI导演', { onChange: (val) => val ? AIDirector.start() : AIDirector.stop() });
    const { container: apiTypeContainer, input: apiTypeInput } = createSetting('select', 'ad_apiType', 'API 类型', {
        choices: [
            { value: 'openai', label: 'OpenAI兼容' },
            { value: 'gemini', label: 'Google Gemini' }
        ]
    });
    const { container: modelContainer, input: modelInput } = createSetting('text', 'ad_model', '导演 (主) 模型');
    const { container: apiKeyContainer, input: apiKeyInput } = createSetting('password', 'ad_apiKey', 'API Key');
    const { container: baseUrlContainer, input: baseUrlInput } = createSetting('text', 'ad_baseUrl', 'Base URL');
    const { container: sendModeContainer, input: sendModeInput } = createSetting('select', 'ad_sendMode', '发送模式', {
        choices: [
            { value: 'auto', label: '自动发送' },
            { value: 'manual', label: '手动发送' },
            { value: 'stream_auto_send', label: '全自动导演模式' }
        ]
    });
    
    // Dynamic Director section
    const { container: dynamicToggleContainer, input: dynamicToggleInput } = createSetting('checkbox', 'ad_enableDynamicDirector', '启用动态导演 (高级)');
    const advancedContainer = document.createElement('div');
    advancedContainer.style.display = settings.ad_enableDynamicDirector ? 'block' : 'none';
    
    dynamicToggleInput.addEventListener('change', () => {
        advancedContainer.style.display = dynamicToggleInput.checked ? 'block' : 'none';
    });

    const { container: analysisModelContainer } = createSetting('text', 'ad_analysisModel', '分析模型 (快速 & 廉价)');
    const { container: dynamicPromptContainer } = createSetting('textarea', 'ad_dynamicPromptTemplate', '动态指令模板', { rows: 8 });

    // Memory section
    const memoryContainer = document.createElement('div');
    memoryContainer.innerHTML = `
        <hr>
        <label>长期记忆 (自我进化)</label>
        <div style="font-size:0.85em; background: rgba(0,0,0,0.2); padding:10px; border-radius: 8px;">
           <p>当前习得风格: <b id="ad-learned-style">${settings.ad_learnedStyle || '无'}</b></p>
           <p>学习进度: <span id="ad-log-progress">${settings.ad_choiceLog.length}/${settings.ad_logTriggerCount}</span></p>
           <a href="#" id="ad-clear-memory" style="color: #f08080; font-size:0.9em;">清空记忆</a>
        </div>
    `;
    memoryContainer.querySelector('#ad-clear-memory').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('确定要清空所有已学习的创作风格和日志吗？')) {
            settings.ad_learnedStyle = '';
            settings.ad_choiceLog = [];
            saveSettingsDebounced();
            AIDirector.updateMemoryPanel();
        }
    });

    advancedContainer.append(analysisModelContainer, dynamicPromptContainer, memoryContainer);
    adContent.append(adEnabledContainer, apiTypeContainer, modelContainer, apiKeyContainer, baseUrlContainer, sendModeContainer, dynamicToggleContainer, advancedContainer);
    
    // Show/hide base URL based on API type
    const toggleBaseUrl = () => { baseUrlContainer.style.display = apiTypeInput.value === 'openai' ? 'block' : 'none'; };
    apiTypeInput.addEventListener('change', toggleBaseUrl);
    toggleBaseUrl();

    // Check for updates button
    const updateButton = document.createElement('button');
    updateButton.classList.add('menu_button');
    updateButton.textContent = '检查更新';
    updateButton.addEventListener('click', async () => {
        try {
            const res = await fetch(`https://raw.githubusercontent.com/YJPM/AI/main/manifest.json?t=${Date.now()}`);
            if (!res.ok) throw new Error('无法获取远程版本信息');
            const remoteManifest = await res.json();
            const localVersion = TavernHelper.extensions.find(e => e.id === 'AI')?.version || '0.0.0';
            if (remoteManifest.version > localVersion) {
                toastr.success(`发现新版本 ${remoteManifest.version}！请在扩展管理器中更新。`);
            } else {
                toastr.info('您当前已是最新版本。');
            }
        } catch (err) {
            toastr.error(`检查更新失败: ${err.message}`);
        }
    });
    container.append(updateButton);
}


// ----------------- Initialization -----------------
function init() {
    // Inject styles and create the main settings UI
    injectGlobalStyles();
    populateUI();
    
    // Set initial theme for TI
    applyTheme(settings.ti_activeTheme);

    // Start TI if enabled
    if (settings.ti_enabled) {
        initTypingIndicator();
    }
    
    // Start AD if enabled
    if (settings.ad_enabled) {
        AIDirector.start();
    }
}

function initTypingIndicator() {
     // Register event listeners for TI
     const showIndicatorEvents = [event_types.GENERATION_AFTER_COMMANDS];
     const hideIndicatorEvents = [event_types.GENERATION_STOPPED, event_types.GENERATION_ENDED, event_types.CHAT_CHANGED, event_types.MESSAGE_SWIPED];
 
     showIndicatorEvents.forEach(e => eventSource.on(e, showTypingIndicator));
     hideIndicatorEvents.forEach(e => eventSource.on(e, hideTypingIndicator));
}

init(); 