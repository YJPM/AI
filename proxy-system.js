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

// 导出类
window.ProxySystem = ProxySystem;
window.ProxyConnectionManager = ProxyConnectionManager;
window.ProxyRequestProcessor = ProxyRequestProcessor;
window.ProxyStreamHandler = ProxyStreamHandler;
window.ProxyLogger = ProxyLogger; 