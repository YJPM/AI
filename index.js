// 代理系统 - 基于dark-browser.js适配
// 用于绕过CORS限制，通过本地代理服务器发送API请求

// 调试输出模块
const ProxyLogger = {
    enabled: true,
    
    output(...messages) {
        if (!this.enabled) return;
        
        const timestamp = this._getTimestamp();
        console.log(`[${timestamp}] [ProxySystem] ${messages.join(' ')}`);
    },
    
    _getTimestamp() {
        const now = new Date();
        const time = now.toLocaleTimeString('zh-CN', { hour12: false });
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        return `${time}.${ms}`;
    }
};

// WebSocket连接管理器
class ProxyConnectionManager extends EventTarget {
    constructor(endpoint = 'ws://127.0.0.1:9998') {
        super();
        this.endpoint = endpoint;
        this.socket = null;
        this.isConnected = false;
        this.reconnectDelay = 5000;
        this.maxReconnectAttempts = Infinity;
        this.reconnectAttempts = 0;
    }
    
    async establish() {
        if (this.isConnected) {
            ProxyLogger.output('[ConnectionManager] 连接已存在');
            return Promise.resolve();
        }
        
        ProxyLogger.output('[ConnectionManager] 建立连接:', this.endpoint);
        
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.endpoint);
            
            this.socket.addEventListener('open', () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                ProxyLogger.output('[ConnectionManager] 连接建立成功');
                this.dispatchEvent(new CustomEvent('connected'));
                resolve();
            });
            
            this.socket.addEventListener('close', () => {
                this.isConnected = false;
                ProxyLogger.output('[ConnectionManager] 连接断开，准备重连');
                this.dispatchEvent(new CustomEvent('disconnected'));
                this._scheduleReconnect();
            });
            
            this.socket.addEventListener('error', (error) => {
                ProxyLogger.output('[ConnectionManager] 连接错误:', error);
                this.dispatchEvent(new CustomEvent('error', { detail: error }));
                if (!this.isConnected) reject(error);
            });
            
            this.socket.addEventListener('message', (event) => {
                this.dispatchEvent(new CustomEvent('message', { detail: event.data }));
            });
        });
    }
    
    transmit(data) {
        if (!this.isConnected || !this.socket) {
            ProxyLogger.output('[ConnectionManager] 无法发送数据：连接未建立');
            return false;
        }
        
        this.socket.send(JSON.stringify(data));
        return true;
    }
    
    _scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            ProxyLogger.output('[ConnectionManager] 达到最大重连次数');
            return;
        }
        
        this.reconnectAttempts++;
        setTimeout(() => {
            ProxyLogger.output(`[ConnectionManager] 重连尝试 ${this.reconnectAttempts}`);
            this.establish().catch(() => {});
        }, this.reconnectDelay);
    }
}

// HTTP请求处理器
class ProxyRequestProcessor {
    constructor() {
        this.activeOperations = new Map();
    }
    
    async execute(requestSpec, operationId) {
        ProxyLogger.output('[RequestProcessor] 执行请求:', requestSpec.method, requestSpec.path);
        
        try {
            const abortController = new AbortController();
            this.activeOperations.set(operationId, abortController);
            
            const requestUrl = this._constructUrl(requestSpec);
            const requestConfig = this._buildRequestConfig(requestSpec, abortController.signal);
            
            const response = await fetch(requestUrl, requestConfig);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            ProxyLogger.output('[RequestProcessor] 请求执行失败:', error.message);
            throw error;
        } finally {
            this.activeOperations.delete(operationId);
        }
    }
    
    cancelOperation(operationId) {
        const controller = this.activeOperations.get(operationId);
        if (controller) {
            controller.abort();
            this.activeOperations.delete(operationId);
            ProxyLogger.output('[RequestProcessor] 操作已取消:', operationId);
        }
    }
    
    cancelAllOperations() {
        this.activeOperations.forEach((controller, id) => {
            controller.abort();
            ProxyLogger.output('[RequestProcessor] 取消操作:', id);
        });
        this.activeOperations.clear();
    }
    
    _constructUrl(requestSpec) {
        const pathSegment = requestSpec.path.startsWith('/') ? 
            requestSpec.path.substring(1) : requestSpec.path;
        
        const queryParams = new URLSearchParams(requestSpec.query_params);
        const queryString = queryParams.toString();
        
        // 从请求头中获取目标域名，如果没有则使用默认值
        const host = requestSpec.headers['x-target-host'] || 'generativelanguage.googleapis.com';
        const protocol = requestSpec.headers['x-target-protocol'] || 'https';
        
        return `${protocol}://${host}/${pathSegment}${queryString ? '?' + queryString : ''}`;
    }
    
    _buildRequestConfig(requestSpec, signal) {
        const config = {
            method: requestSpec.method,
            headers: this._sanitizeHeaders(requestSpec.headers),
            signal
        };
        
        if (['POST', 'PUT', 'PATCH'].includes(requestSpec.method) && requestSpec.body) {
            config.body = requestSpec.body;
        }
        
        return config;
    }
    
    _sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const forbiddenHeaders = [
            'host', 'connection', 'content-length', 'origin',
            'referer', 'user-agent', 'sec-fetch-mode',
            'sec-fetch-site', 'sec-fetch-dest', 'x-target-host', 'x-target-protocol'
        ];
        
        forbiddenHeaders.forEach(header => delete sanitized[header]);
        return sanitized;
    }
}

// 流式响应处理器
class ProxyStreamHandler {
    constructor(communicator) {
        this.communicator = communicator;
    }
    
    async processStream(response, operationId) {
        ProxyLogger.output('[StreamHandler] 开始处理流式响应');
        
        // 发送响应头信息
        this._transmitHeaders(response, operationId);
        
        const reader = response.body.getReader();
        const textDecoder = new TextDecoder();
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    ProxyLogger.output('[StreamHandler] 流处理完成');
                    this._transmitStreamEnd(operationId);
                    break;
                }
                
                const textChunk = textDecoder.decode(value, { stream: true });
                this._transmitChunk(textChunk, operationId);
            }
        } catch (error) {
            ProxyLogger.output('[StreamHandler] 流处理错误:', error.message);
            throw error;
        }
    }
    
    _transmitHeaders(response, operationId) {
        const headerMap = {};
        response.headers.forEach((value, key) => {
            headerMap[key] = value;
        });
        
        const headerMessage = {
            request_id: operationId,
            event_type: 'response_headers',
            status: response.status,
            headers: headerMap
        };
        
        this.communicator.transmit(headerMessage);
        ProxyLogger.output('[StreamHandler] 响应头已传输');
    }
    
    _transmitChunk(chunk, operationId) {
        const chunkMessage = {
            request_id: operationId,
            event_type: 'chunk',
            data: chunk
        };
        
        this.communicator.transmit(chunkMessage);
    }
    
    _transmitStreamEnd(operationId) {
        const endMessage = {
            request_id: operationId,
            event_type: 'stream_close'
        };
        
        this.communicator.transmit(endMessage);
    }
}

// 主代理系统
class ProxySystem extends EventTarget {
    constructor(websocketEndpoint) {
        super();
        this.connectionManager = new ProxyConnectionManager(websocketEndpoint);
        this.requestProcessor = new ProxyRequestProcessor();
        this.streamHandler = new ProxyStreamHandler(this.connectionManager);
        
        this._setupEventHandlers();
    }
    
    async initialize() {
        ProxyLogger.output('[ProxySystem] 系统初始化中...');
        
        try {
            await this.connectionManager.establish();
            ProxyLogger.output('[ProxySystem] 系统初始化完成');
            this.dispatchEvent(new CustomEvent('ready'));
        } catch (error) {
            ProxyLogger.output('[ProxySystem] 系统初始化失败:', error.message);
            this.dispatchEvent(new CustomEvent('error', { detail: error }));
            throw error;
        }
    }
    
    _setupEventHandlers() {
        this.connectionManager.addEventListener('message', (event) => {
            this._handleIncomingMessage(event.detail);
        });
        
        this.connectionManager.addEventListener('disconnected', () => {
            this.requestProcessor.cancelAllOperations();
        });
    }
    
    async _handleIncomingMessage(messageData) {
        try {
            const requestSpec = JSON.parse(messageData);
            ProxyLogger.output('[ProxySystem] 收到请求:', requestSpec.method, requestSpec.path);
            
            await this._processProxyRequest(requestSpec);
        } catch (error) {
            ProxyLogger.output('[ProxySystem] 消息处理错误:', error.message);
            this._sendErrorResponse(error, requestSpec?.request_id);
        }
    }
    
    async _processProxyRequest(requestSpec) {
        const operationId = requestSpec.request_id;
        
        try {
            const response = await this.requestProcessor.execute(requestSpec, operationId);
            await this.streamHandler.processStream(response, operationId);
        } catch (error) {
            if (error.name === 'AbortError') {
                ProxyLogger.output('[ProxySystem] 请求被中止');
            } else {
                this._sendErrorResponse(error, operationId);
            }
        }
    }
    
    _sendErrorResponse(error, operationId) {
        if (!operationId) {
            ProxyLogger.output('[ProxySystem] 无法发送错误响应：缺少操作ID');
            return;
        }
        
        const errorMessage = {
            request_id: operationId,
            event_type: 'error',
            status: 500,
            message: `代理系统错误: ${error.message || '未知错误'}`
        };
        
        this.connectionManager.transmit(errorMessage);
        ProxyLogger.output('[ProxySystem] 错误响应已发送');
    }
}

// 导出代理系统类到全局作用域
window.ProxySystem = ProxySystem;
window.ProxyConnectionManager = ProxyConnectionManager;
window.ProxyRequestProcessor = ProxyRequestProcessor;
window.ProxyStreamHandler = ProxyStreamHandler;
window.ProxyLogger = ProxyLogger;

// 主扩展代码
import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { defaultSettings, getSettings } from './settings.js';
import { logger } from './logger.js';
import { OptionsGenerator } from './optionsGenerator.js';
import { applyBasicStyle, injectGlobalStyles, addExtensionSettings, initQuickPacePanel } from './ui.js';

const MODULE = 'typing_indicator';

function initializeTypingIndicator() {
    injectGlobalStyles();
    const settings = getSettings();
    addExtensionSettings(settings);
    applyBasicStyle();
    initQuickPacePanel(); // 初始化快捷操作面板
    
    // 启用API拦截器，让SillyTavern使用扩展的API配置
    if (settings.enableApiInterception !== false) { // 默认启用
        logger.log('启用API拦截器，让SillyTavern使用扩展的API配置');
        
        // 初始化代理系统（如果可用）
        if (window.ProxySystem) {
            logger.log('代理系统可用，初始化代理模式API拦截器');
            OptionsGenerator.interceptSillyTavernAPI();
        } else {
            logger.log('代理系统不可用，使用标准API拦截器');
            OptionsGenerator.interceptSillyTavernAPI();
        }
    }
    
    // 清除选项的函数
    function clearOptions() {
        const settings = getSettings();
        const sendMode = settings.sendMode || 'auto';
        
        // 在手动模式下不清除选项容器
        if (sendMode === 'manual') {
            logger.log('手动模式，不清除选项容器。');
            return;
        }
        
        const oldContainer = document.getElementById('ti-options-container');
        if (oldContainer) {
            logger.log('清除已存在的选项容器。');
            oldContainer.remove();
        }
        OptionsGenerator.hideGeneratingUI();
    }
    
    // 用户发送消息时清除选项
    eventSource.on(event_types.MESSAGE_SENT, () => {
        const settings = getSettings();
        const sendMode = settings.sendMode || 'auto';
        
        if (sendMode === 'manual') {
            logger.log('MESSAGE_SENT event triggered. 手动模式，清除选中的选项状态。');
            // 清除选中的选项状态
            OptionsGenerator.selectedOptions = [];
            // 重置所有选项按钮的样式
            const container = document.getElementById('ti-options-container');
            if (container) {
                const buttons = container.querySelectorAll('button');
                buttons.forEach(btn => {
                    btn.style.background = 'var(--SmartThemeBackgroundColor, #fff)';
                    btn.style.color = 'var(--SmartThemeBodyColor, #222)';
                    btn.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
                });
            }
            return;
        }
        
        logger.log('MESSAGE_SENT event triggered. 清除选项，等待AI回复。');
        clearOptions();
    });
    
    // 用户重新请求时清除选项
    eventSource.on(event_types.GENERATION_STARTED, () => {
        const settings = getSettings();
        const sendMode = settings.sendMode || 'auto';
        
        if (sendMode === 'manual') {
            logger.log('GENERATION_STARTED event triggered. 手动模式，清除选中的选项状态。');
            // 清除选中的选项状态
            OptionsGenerator.selectedOptions = [];
            // 重置所有选项按钮的样式
            const container = document.getElementById('ti-options-container');
            if (container) {
                const buttons = container.querySelectorAll('button');
                buttons.forEach(btn => {
                    btn.style.background = 'var(--SmartThemeBackgroundColor, #fff)';
                    btn.style.color = 'var(--SmartThemeBodyColor, #222)';
                    btn.style.borderColor = 'var(--SmartThemeBorderColor, #ccc)';
                });
            }
            return;
        }
        
        logger.log('GENERATION_STARTED event triggered. 清除选项，等待AI回复。');
        clearOptions();
    });
    
    eventSource.on(event_types.GENERATION_STOPPED, () => {
        logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
        OptionsGenerator.isManuallyStopped = true;
    });
    
    eventSource.on(event_types.GENERATION_ENDED, async () => {
        const settings = getSettings();
        logger.log('GENERATION_ENDED event triggered.', { 
            isManuallyStopped: OptionsGenerator.isManuallyStopped, 
            optionsGenEnabled: settings.optionsGenEnabled,
            autoGenMode: settings.autoGenMode
        });
        
        // 检查是否满足自动生成条件
        const shouldAutoGenerate = settings.optionsGenEnabled && 
            !OptionsGenerator.isManuallyStopped && 
            settings.autoGenMode === 'auto';
            
        if (shouldAutoGenerate) {
            logger.log('GENERATION_ENDED: 自动生成模式，触发选项生成。');
            // 立即显示loading状态
            const { showPacePanelLoading } = await import('./ui.js');
            showPacePanelLoading();
            // 延迟一点再生成选项，确保loading显示
            setTimeout(() => {
                OptionsGenerator.generateOptions();
            }, 100);
        } else {
            logger.log('GENERATION_ENDED: 手动生成模式或不满足生成条件，跳过。');
        }
        OptionsGenerator.isManuallyStopped = false;
    });
    
    eventSource.on(event_types.CHAT_CHANGED, () => {
        const settings = getSettings();
        const sendMode = settings.sendMode || 'auto';
        
        if (sendMode === 'manual') {
            logger.log('CHAT_CHANGED event triggered. 手动模式，不清除选项。');
            return;
        }
        
        logger.log('CHAT_CHANGED event triggered.');
        clearOptions();
    });
}

function waitForCoreSystem() {
    if (typeof eventSource !== 'undefined' && eventSource.on) {
        logger.log('核心事件系统已就绪，初始化插件。');
        initializeTypingIndicator();
    } else {
        logger.log('等待核心事件系统加载...');
        setTimeout(waitForCoreSystem, 200);
    }
}

waitForCoreSystem();
