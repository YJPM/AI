/**
 * AI导演 - UI界面模块
 * 包含设置面板和事件绑定
 */

import { AIDirectorSystem } from './core.js';

/**
 * UI界面管理
 */
export const AIDirectorUI = {
    /**
     * 注入UI元素
     */
    injectUI() {
        this.parent$(this.parent$.parseHTML(`
            <style id="ai-director-styles">
                #ai-director-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(5px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    display: none;
                }
                #ai-director-panel {
                    flex-shrink: 0;
                    width: 90%;
                    max-width: 550px;
                    background: var(--SmartThemeBlurTintColor, #1e1e1e);
                    color: var(--SmartThemeBodyColor, #e0e0e0);
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    border: 1px solid var(--SmartThemeBorderColor);
                    animation: ai-director-fade-in 0.2s ease-out;
                }
                #ai-director-panel h4 {
                    margin: 0 0 20px 0;
                }
                #ai-director-panel .form-group {
                    margin-bottom: 15px;
                }
                #ai-director-panel label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 0.9em;
                }
                #ai-director-panel input, #ai-director-panel select, #ai-director-panel textarea {
                    width: 100%;
                    box-sizing: border-box;
                    background: rgba(255,255,255,0.05);
                    color: inherit;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 10px;
                }
                #ai-director-panel textarea {
                    min-height: 120px;
                    resize: vertical;
                    font-size: 0.9em;
                }
                #ai-director-panel .ai-director-buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }
                #ai-director-panel .ai-director-buttons button {
                    flex-grow: 1;
                    padding: 10px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                }
                #ai-director-save {
                    background: var(--SmartThemeQuoteColor, #4a9eff);
                    color: white;
                }
                .ai-director-advanced-toggle {
                    font-size: 0.8em;
                    color: var(--SmartThemeQuoteColor, #4a9eff);
                    cursor: pointer;
                    text-decoration: underline;
                    margin-top: -10px;
                    margin-bottom: 15px;
                }
                #ai-director-status {
                    display: none;
                    margin-bottom: 5px;
                    padding: 5px 10px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    font-size: 0.85em;
                    text-align: center;
                    opacity: 0.8;
                }
                #ai-director-status.error {
                    background: #58181c;
                    color: #ffc2c2;
                }
                #ai-director-suggestions {
                    width: 100%;
                    padding: 8px 0;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .ai-director-capsule {
                    flex: 1;
                    white-space: normal;
                    text-align: center;
                    margin: 0 !important;
                    height: auto;
                    min-width: 120px;
                }
                @keyframes ai-director-fade-in {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
            <div id="ai-director-overlay">
                <div id="ai-director-panel">
                    <h4>AI导演 设置</h4>
                    <div class="form-group">
                        <label>API类型:</label>
                        <select id="ai-director-apitype">
                            <option value="openai">OpenAI兼容</option>
                            <option value="gemini">Google Gemini</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>导演(主)模型:</label>
                        <input type="text" id="ai-director-model">
                    </div>
                    <div class="form-group">
                        <label>API Key:</label>
                        <input type="password" id="ai-director-apikey">
                    </div>
                    <div class="form-group" id="ai-director-baseurl-group">
                        <label>Base URL:</label>
                        <input type="text" id="ai-director-baseurl">
                    </div>
                    <div class="form-group">
                        <label>发送模式:</label>
                        <select id="ai-director-sendmode">
                            <option value="auto">自动发送</option>
                            <option value="manual">手动发送</option>
                            <option value="stream_auto_send">全自动导演模式</option>
                        </select>
                    </div>
                    <hr style="border-color:var(--SmartThemeBorderColor, #444); margin: 20px 0;">
                    <div class="form-group" style="display:flex; align-items:center; gap:10px;">
                        <input type="checkbox" id="ai-director-dynamic-toggle" style="width:auto;">
                        <label for="ai-director-dynamic-toggle" style="margin:0;">启用动态导演 (高级)</label>
                    </div>
                    <div id="ai-director-advanced-settings" style="display:none;">
                        <div class="form-group">
                            <label>分析模型 (快速&廉价):</label>
                            <input type="text" id="ai-director-analysis-model">
                        </div>
                        <div class="form-group">
                            <label>动态指令模板:</label>
                            <textarea id="ai-director-dynamic-template"></textarea>
                        </div>
                        <hr style="border-color:var(--SmartThemeBorderColor, #444); margin: 20px 0;">
                        <label>长期记忆 (自我进化):</label>
                        <div style="font-size:0.85em; background: rgba(0,0,0,0.2); padding:10px; border-radius: 8px;">
                           <p>当前习得风格: <b id="ai-director-learned-style">无</b></p>
                           <p>学习进度: <span id="ai-director-log-progress">0/20</span></p>
                           <a href="#" id="ai-director-clear-memory" style="color: #f08080; font-size:0.9em;">清空记忆</a>
                        </div>
                    </div>
                    <div class="ai-director-buttons">
                        <button id="ai-director-save">保存并关闭</button>
                    </div>
                </div>
            </div>
        `)).appendTo('body');
        
        this.parent$('<div id="ai-director-status"></div>').insertBefore('#send_form');
        this.injectExtensionButtonWithRetry();
    },

    /**
     * 注入扩展按钮
     */
    injectExtensionButtonWithRetry() {
        let retries = 0;
        const maxRetries = 25;
        const interval = setInterval(() => {
            const $menu = this.parent$('#extensionsMenu');
            if ($menu.length > 0) {
                if (this.parent$('#ai-director-ext-button').length === 0) {
                    this.parent$('<div/>', {
                        id: 'ai-director-ext-button',
                        class: 'list-group-item flex-container flexGap5 interactable',
                        html: `<i class="fa-solid fa-lightbulb"></i><span>AI导演</span>`
                    }).appendTo($menu);
                }
                clearInterval(interval);
            } else {
                if (++retries > maxRetries) clearInterval(interval);
            }
        }, 200);
    },

    /**
     * 绑定UI事件
     */
    bindEvents() {
        window.addEventListener('beforeunload', () => {
            clearInterval(this.mainLoopInterval);
        });
        
        const parentBody = this.parent$('body');
        
        // 设置面板相关事件
        parentBody.on('click', '#ai-director-ext-button', () => {
            this.updatePanel();
            this.parent$('#ai-director-overlay').css('display', 'flex');
        });
        
        parentBody.on('click', '#ai-director-save', async () => {
            this.settings.apiType = this.parent$('#ai-director-apitype').val();
            this.settings.apiKey = this.parent$('#ai-director-apikey').val();
            this.settings.baseUrl = this.parent$('#ai-director-baseurl').val();
            this.settings.model = this.parent$('#ai-director-model').val();
            this.settings.sendMode = this.parent$('#ai-director-sendmode').val();
            this.settings.enableDynamicDirector = this.parent$('#ai-director-dynamic-toggle').is(':checked');
            this.settings.analysisModel = this.parent$('#ai-director-analysis-model').val();
            this.settings.dynamicPromptTemplate = this.parent$('#ai-director-dynamic-template').val();
            
            await this.saveSettings();
            this.parent$('#ai-director-overlay').hide();
        });
        
        parentBody.on('change', '#ai-director-apitype', () => {
            this.toggleApiSettings();
        });
        
        parentBody.on('change', '#ai-director-dynamic-toggle', () => {
            this.toggleAdvancedSettings();
        });
        
        parentBody.on('click', '#ai-director-clear-memory', async (e) => {
            e.preventDefault();
            if (confirm('确定要清空所有已学习的创作风格和日志吗？')) {
                this.settings.learnedStyle = '';
                this.settings.choiceLog = [];
                await this.saveSettings();
                this.updatePanel();
            }
        });
        
        parentBody.on('click', (e) => {
            if (this.parent$(e.target).is('#ai-director-overlay')) {
                this.parent$('#ai-director-overlay').hide();
            }
        });
        
        parentBody.on('click', '#ai-director-retry', () => {
            this.setState('ANALYZING');
            this.runSuggestionLogic();
        });
        
        // 劫持发送按钮，清理建议UI
        const origSend = window.send;
        window.send = (...args) => {
            this.cleanupSuggestions();
            this.setState('IDLE');
            return origSend(...args);
        };
    },

    /**
     * 更新设置面板
     */
    updatePanel() {
        this.parent$('#ai-director-apitype').val(this.settings.apiType);
        this.parent$('#ai-director-apikey').val(this.settings.apiKey);
        this.parent$('#ai-director-baseurl').val(this.settings.baseUrl);
        this.parent$('#ai-director-model').val(this.settings.model);
        this.parent$('#ai-director-sendmode').val(this.settings.sendMode);
        this.parent$('#ai-director-dynamic-toggle').prop('checked', this.settings.enableDynamicDirector);
        this.parent$('#ai-director-analysis-model').val(this.settings.analysisModel);
        this.parent$('#ai-director-dynamic-template').val(this.settings.dynamicPromptTemplate);
        this.parent$('#ai-director-learned-style').text(this.settings.learnedStyle || '无');
        this.parent$('#ai-director-log-progress').text(`${this.settings.choiceLog.length}/${this.settings.logTriggerCount}`);
        
        this.toggleApiSettings();
        this.toggleAdvancedSettings();
    },

    /**
     * 切换API设置
     */
    toggleApiSettings() {
        const isGemini = this.parent$('#ai-director-apitype').val() === 'gemini';
        this.parent$('#ai-director-baseurl-group').toggle(!isGemini);
    },

    /**
     * 切换高级设置
     */
    toggleAdvancedSettings() {
        const isEnabled = this.parent$('#ai-director-dynamic-toggle').is(':checked');
        this.parent$('#ai-director-advanced-settings').toggle(isEnabled);
    }
};

// 将AIDirectorSystem的方法和属性复制到AIDirectorUI
Object.assign(AIDirectorUI, AIDirectorSystem);

// 绑定方法到对象
for (let key in AIDirectorUI) {
    if (typeof AIDirectorUI[key] === 'function') {
        AIDirectorUI[key] = AIDirectorUI[key].bind(AIDirectorUI);
    }
} 