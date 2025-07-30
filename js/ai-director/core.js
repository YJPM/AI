/**
 * AI导演 - 核心功能模块
 * 包含场景分析、建议生成等核心功能
 */

import { DEFAULT_PROMPTS } from './prompts/templates.js';
import { callDirectorAPI, callOpenAIAPI } from './api.js';

// 常量定义
const LOG_PREFIX = '[AI导演]';
const SETTINGS_KEY = 'AIDirector_Settings';

/**
 * AI导演系统
 */
export const AIDirectorSystem = {
    // 系统状态
    state: 'IDLE',
    lastMessageId: -1,
    parent$: null,
    readyStateTimeout: null,
    
    // 默认设置
    settings: {
        apiType: 'openai',
        apiKey: 'YOUR_API_KEY_HERE',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        sendMode: 'auto',
        promptContent: DEFAULT_PROMPTS.simple,
        enableDynamicDirector: false,
        analysisModel: 'gpt-3.5-turbo',
        dynamicPromptTemplate: DEFAULT_PROMPTS.dynamicTemplate,
        choiceLog: [],
        learnedStyle: '',
        logTriggerCount: 20,
    },

    /**
     * 初始化AI导演系统
     * @param {Object} parentQuery - jQuery对象
     */
    async init(parentQuery) {
        this.parent$ = parentQuery;
        console.log(`${LOG_PREFIX} 初始化中...`);
        this.cleanupOldUI();
        await this.loadSettings();
        this.injectUI();
        this.bindEvents();
        
        if (typeof getLastMessageId === 'function') {
            this.lastMessageId = getLastMessageId();
        } else {
            this.setState('ERROR', '核心函数未找到');
            return;
        }
        
        setInterval(() => this.mainLoop(), 500);
        console.log(`${LOG_PREFIX} 初始化完成。`);
    },

    /**
     * 主循环，监控消息变化
     */
    mainLoop() {
        if (typeof getLastMessageId !== 'function' || typeof getChatMessages !== 'function') return;
        
        const currentLastMessageId = getLastMessageId();
        if (currentLastMessageId === this.lastMessageId || currentLastMessageId < 0) return;
        
        const lastMessage = getChatMessages(`${currentLastMessageId}`)[0];
        if (!lastMessage) return;
        
        const isUser = lastMessage.is_user || lastMessage.role === 'user';
        
        switch (this.state) {
            case 'IDLE':
            case 'READY':
            case 'ERROR':
                if (isUser) this.setState('AWAITING_AI');
                break;
            case 'AWAITING_AI':
                if (!isUser && !window.is_generating) {
                    this.setState('ANALYZING');
                    this.runSuggestionLogic();
                }
                break;
        }
        
        this.lastMessageId = currentLastMessageId;
    },
    
    /**
     * 设置系统状态
     * @param {string} newState - 新状态
     * @param {string} payload - 状态负载信息
     */
    setState(newState, payload = null) {
        if (this.state === newState) return;
        
        clearTimeout(this.readyStateTimeout);
        this.state = newState;
        this.updateStatusWidget(payload);
        
        if (newState === 'READY') {
            this.readyStateTimeout = setTimeout(() => {
                this.setState('IDLE');
            }, 2000);
        }
    },

    /**
     * 运行建议生成逻辑
     */
    async runSuggestionLogic() {
        let finalPrompt = '';
        let analysisDataForLogging = null;

        try {
            if (this.settings.enableDynamicDirector && this.settings.analysisModel) {
                this.updateStatusWidget('场景分析中...');
                const analysisResult = await this.analyzeContext();
                
                if (analysisResult) {
                    console.log(`${LOG_PREFIX} 场景分析结果:`, analysisResult);
                    finalPrompt = this.assembleDynamicPrompt(analysisResult);
                    analysisDataForLogging = analysisResult;
                } else {
                    console.warn(`${LOG_PREFIX} 场景分析失败，回退到简单模式。`);
                    finalPrompt = this.settings.promptContent;
                }
            } else {
                finalPrompt = this.settings.promptContent;
            }

            this.updateStatusWidget('导演思考中...');
            const isStreamAuto = this.settings.sendMode === 'stream_auto_send';
            const context = await this.getContext_Compatible();
            const apiContent = await callDirectorAPI(finalPrompt, isStreamAuto, this.settings, context);
            
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
                } else {
                    throw new Error('AI返回内容格式不正确');
                }
            } else {
                throw new Error('API未返回有效内容');
            }
        } catch (error) {
            console.error(`${LOG_PREFIX} 核心逻辑出错:`, error);
            this.setState('ERROR', error.message);
        }
    },

    /**
     * 分析对话上下文
     * @returns {Promise<Object>} - 分析结果
     */
    async analyzeContext() {
        const context = await this.getContext_Compatible(5);
        if (!context || context.messages.length === 0) return null;

        const analysisPrompt = `分析以下最新的对话片段，严格以JSON格式返回当前情境。JSON必须包含 scene_type(场景类型), user_mood(我的情绪), 和 narrative_focus(当前叙事焦点) 三个键。\n\n对话片段:\n${JSON.stringify(context.messages)}\n\n你的JSON输出:`;
        
        try {
            const responseText = await callOpenAIAPI(
                [{role: 'user', content: analysisPrompt}],
                false,
                this.settings.analysisModel,
                0.2,
                this.settings
            );
            
            const jsonMatch = responseText.match(/\{.*\}/s);
            if (!jsonMatch) return null;
            
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error(`${LOG_PREFIX} 分析API调用失败:`, error);
            return null;
        }
    },
    
    /**
     * 组装动态提示
     * @param {Object} analysisResult - 分析结果
     * @returns {string} - 组装后的提示
     */
    assembleDynamicPrompt(analysisResult) {
        let prompt = this.settings.dynamicPromptTemplate;
        prompt = prompt.replace(/\{\{scene_type\}\}/g, analysisResult.scene_type || '未知');
        prompt = prompt.replace(/\{\{user_mood\}\}/g, analysisResult.user_mood || '未知');
        prompt = prompt.replace(/\{\{narrative_focus\}\}/g, analysisResult.narrative_focus || '未知');
        prompt = prompt.replace(/\{\{learned_style\}\}/g, this.settings.learnedStyle || '无特定偏好');
        return prompt;
    },

    /**
     * 记录用户选择
     * @param {Object} analysisData - 分析数据
     */
    async logChoice(analysisData) {
        if (!analysisData) return;
        
        this.settings.choiceLog.push(analysisData);
        console.log(`${LOG_PREFIX} 记录一次选择。当前日志数量: ${this.settings.choiceLog.length}/${this.settings.logTriggerCount}`);
        
        if (this.settings.choiceLog.length >= this.settings.logTriggerCount) {
            await this.reflectOnChoices();
        }
        
        await this.saveSettings();
    },

    /**
     * 反思用户选择，学习用户偏好
     */
    async reflectOnChoices() {
        console.log(`${LOG_PREFIX} 选择日志已满，开始进行"自我反思"...`);
        
        const reflectionPrompt = `这里是一个用户在不同叙事场景下的情境分析日志（JSON数组）。请分析这些数据，用一句话总结出该用户的核心创作偏好或"玩家风格"。你的回答必须简洁、精炼、如同一个资深编辑的评语。\n\n情境日志:\n${JSON.stringify(this.settings.choiceLog)}\n\n你的总结评语:`;
        
        try {
            const reflection = await callOpenAIAPI(
                [{ role: 'user', content: reflectionPrompt }],
                false,
                this.settings.analysisModel,
                0.5,
                this.settings
            );
            
            if (reflection) {
                console.log(`${LOG_PREFIX} 已习得新的创作风格: ${reflection}`);
                this.settings.learnedStyle = reflection;
                this.settings.choiceLog = [];
                await this.saveSettings();
            }
        } catch (error) {
            console.error(`${LOG_PREFIX} "自我反思"失败:`, error);
        }
    },
    
    /**
     * 处理建议点击
     * @param {string} text - 建议文本
     * @param {Object} analysisData - 分析数据
     * @param {boolean} isAuto - 是否自动发送
     */
    async handleSuggestionClick(text, analysisData, isAuto = false) {
        await this.sendSuggestion(text, isAuto);
        
        if (this.settings.enableDynamicDirector && analysisData) {
            await this.logChoice(analysisData);
        }
    },
    
    /**
     * 获取兼容的上下文
     * @param {number} message_count_limit - 消息数量限制
     * @returns {Promise<Object>} - 上下文对象
     */
    async getContext_Compatible(message_count_limit = 20) {
        if (typeof TavernHelper?.getContext === 'function') {
            return await TavernHelper.getContext({ tokenLimit: 8192 });
        } else {
            const lastMessageId = getLastMessageId();
            if (lastMessageId < 0) return null;
            
            const startId = Math.max(0, lastMessageId - message_count_limit);
            const recentMessages = getChatMessages(`${startId}-${lastMessageId}`);
            const extractText = (msgObj) => this.parent$('<div>').html(msgObj.message.replace(/<br\s*\/?>/gi, '\n')).text().trim();
            
            return {
                messages: recentMessages.map(msg => ({
                    role: msg.is_user ? 'user' : 'assistant',
                    content: extractText(msg)
                }))
            };
        }
    },

    /**
     * 解析建议
     * @param {string} content - AI返回的内容
     * @returns {Array} - 解析后的建议数组
     */
    parseSuggestions(content) {
        return (content.match(/【(.*?)】/g) || [])
            .map(m => m.replace(/[【】]/g, '').trim())
            .filter(Boolean);
    },

    /**
     * 发送建议
     * @param {string} text - 建议文本
     * @param {boolean} isAuto - 是否自动发送
     */
    async sendSuggestion(text, isAuto = false) {
        if (!isAuto && this.settings.sendMode === 'manual') {
            this.parent$('#send_textarea').val(text).trigger('input');
        } else {
            const tempVarName = `ai_director_text_${Date.now()}`;
            await TavernHelper.triggerSlash(`/setvar key=${tempVarName} ${JSON.stringify(text)} | /send {{getvar::${tempVarName}}} | /trigger | /flushvar ${tempVarName}`);
        }
        
        this.cleanupSuggestions();
        this.setState('IDLE');
    },

    /**
     * 清理建议UI
     */
    cleanupSuggestions() {
        this.parent$('#ai-director-suggestions').remove();
    },

    /**
     * 渲染建议
     * @param {Array} suggestions - 建议数组
     * @param {Object} analysisData - 分析数据
     */
    async renderSuggestions(suggestions, analysisData) {
        this.cleanupSuggestions();
        
        const $container = this.parent$(`<div id="ai-director-suggestions"></div>`)
            .prependTo(this.parent$('#send_form'));
        
        const sleep = ms => new Promise(res => setTimeout(res, ms));
        
        for (const text of suggestions) {
            const $capsule = this.parent$(
                `<button class="qr--button menu_button interactable ai-director-capsule"></button>`
            ).appendTo($container);
            
            for (let i = 0; i < text.length; i++) {
                $capsule.text(text.substring(0, i + 1));
                await sleep(20);
            }
            
            $capsule.on('click', () => this.handleSuggestionClick(text, analysisData));
        }
    },
    
    /**
     * 更新状态小部件
     * @param {string} payload - 状态信息
     */
    updateStatusWidget(payload) {
        const $widget = this.parent$('#ai-director-status');
        
        if (this.state === 'IDLE') {
            $widget.hide();
            return;
        }
        
        $widget.show().removeClass('error').empty();
        let content = '';
        
        switch (this.state) {
            case 'AWAITING_AI':
                content = `<span>等待AI回复...</span>`;
                break;
            case 'ANALYZING':
                content = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${payload || '导演思考中...'}</span>`;
                break;
            case 'RENDERING':
                content = `<i class="fa-solid fa-spinner fa-spin"></i> <span>生成建议...</span>`;
                break;
            case 'READY':
                content = `<i class="fa-solid fa-check-circle"></i> <span>建议已就绪</span>`;
                break;
            case 'ERROR':
                $widget.addClass('error');
                content = `<i class="fa-solid fa-exclamation-triangle"></i> <span>错误: ${payload}</span> <button id="ai-director-retry">重试</button>`;
                break;
        }
        
        $widget.html(content);
    },
    
    /**
     * 清理旧UI
     */
    cleanupOldUI() {
        this.parent$('[id*="ai-director-"]').not('#chat, #sheld').remove();
    },

    /**
     * 加载设置
     */
    async loadSettings() {
        if (typeof TavernHelper?.getVariables === 'function') {
            const globalVars = await TavernHelper.getVariables({ type: 'global' }) || {};
            const loaded = globalVars[SETTINGS_KEY] || {};
            this.settings = {
                ...this.settings,
                ...loaded,
                choiceLog: loaded.choiceLog || []
            };
        }
    },
    
    /**
     * 保存设置
     */
    async saveSettings() {
        if (typeof TavernHelper?.updateVariablesWith === 'function') {
            await TavernHelper.updateVariablesWith(vars => {
                vars[SETTINGS_KEY] = this.settings;
                return vars;
            }, { type: 'global' });
        }
    }
};

// 绑定方法到对象
for (let key in AIDirectorSystem) {
    if (typeof AIDirectorSystem[key] === 'function') {
        AIDirectorSystem[key] = AIDirectorSystem[key].bind(AIDirectorSystem);
    }
} 