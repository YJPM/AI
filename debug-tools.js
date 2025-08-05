/**
 * AI智能助手 - 调试工具
 * 用于诊断SillyTavern的API和DOM结构问题
 */

// 调试工具类
export class DebugTools {
    
    // 检查所有可用的API
    static checkAvailableAPIs() {
        console.log('🔍 === 检查可用API ===');
        
        const apis = [
            'window.SillyTavern',
            'window.CharacterHelper',
            'window.ChatHelper',
            'window.ContextHelper',
            'window.getContext',
            'window.getCharacter',
            'window.getMessages'
        ];
        
        apis.forEach(apiName => {
            try {
                const api = eval(apiName);
                if (api) {
                    console.log(`✅ ${apiName}:`, typeof api);
                    if (typeof api === 'object') {
                        const methods = Object.keys(api).filter(key => typeof api[key] === 'function');
                        if (methods.length > 0) {
                            console.log(`   📄 可用方法: ${methods.join(', ')}`);
                        }
                    }
                } else {
                    console.log(`❌ ${apiName}: 未定义`);
                }
            } catch (error) {
                console.log(`❌ ${apiName}: 访问失败 - ${error.message}`);
            }
        });
    }
    
    // 检查DOM结构
    static checkDOMStructure() {
        console.log('🔍 === 检查DOM结构 ===');
        
        // 检查角色相关元素
        const characterSelectors = [
            '#character_info',
            '.character_info',
            '[data-character]',
            '.char_name',
            '.character_name',
            '#char_name',
            '.char_info',
            '.character-card',
            '.char-card'
        ];
        
        console.log('📄 角色相关元素:');
        characterSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`   ✅ ${selector}: ${elements.length}个元素`);
                elements.forEach((el, index) => {
                    console.log(`      ${index + 1}. 文本: "${el.textContent?.substring(0, 50)}..."`);
                    console.log(`         类名: ${el.className}`);
                    console.log(`         属性: ${Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')}`);
                });
            } else {
                console.log(`   ❌ ${selector}: 未找到`);
            }
        });
        
        // 检查世界书相关元素
        const worldBookSelectors = [
            '.world_book',
            '[data-world-book]',
            '.world_info',
            '.worldbook',
            '.world-info',
            '.world-book',
            '.world_book_info'
        ];
        
        console.log('📄 世界书相关元素:');
        worldBookSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`   ✅ ${selector}: ${elements.length}个元素`);
                elements.forEach((el, index) => {
                    console.log(`      ${index + 1}. 文本: "${el.textContent?.substring(0, 50)}..."`);
                });
            } else {
                console.log(`   ❌ ${selector}: 未找到`);
            }
        });
        
        // 检查消息相关元素
        const messageSelectors = [
            '#chat .mes',
            '.chat .message',
            '.message',
            '.mes',
            '[data-message]',
            '.chat-message',
            '.message-container'
        ];
        
        console.log('📄 消息相关元素:');
        messageSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`   ✅ ${selector}: ${elements.length}个元素`);
                if (elements.length <= 3) {
                    elements.forEach((el, index) => {
                        console.log(`      ${index + 1}. 文本: "${el.textContent?.substring(0, 100)}..."`);
                        console.log(`         类名: ${el.className}`);
                    });
                } else {
                    console.log(`      (显示前3个元素)`);
                    for (let i = 0; i < 3; i++) {
                        const el = elements[i];
                        console.log(`      ${i + 1}. 文本: "${el.textContent?.substring(0, 100)}..."`);
                    }
                }
            } else {
                console.log(`   ❌ ${selector}: 未找到`);
            }
        });
        
        // 新增：详细检查角色卡状态
        console.log('\n📄 === 详细角色卡检查 ===');
        this.checkCharacterCardStatus();
        
        // 新增：检查页面状态
        console.log('\n📄 === 页面状态检查 ===');
        this.checkPageStatus();
    }
    
    // 新增：详细检查角色卡状态
    static checkCharacterCardStatus() {
        // 检查是否在角色选择页面
        const isCharacterSelectPage = document.querySelector('#character_select, .character_select, .character-list');
        console.log('📄 是否在角色选择页面:', !!isCharacterSelectPage);
        
        // 检查是否在聊天页面
        const isChatPage = document.querySelector('#chat, .chat, #send_textarea');
        console.log('📄 是否在聊天页面:', !!isChatPage);
        
        // 检查角色卡是否已加载
        const characterLoaded = document.querySelector('#character_info, .character_info, .char_name');
        console.log('📄 角色卡是否已加载:', !!characterLoaded);
        
        // 检查当前角色名称
        const charNameElements = document.querySelectorAll('.char_name, .character_name, h1, h2, h3');
        console.log('📄 可能的角色名称元素:');
        charNameElements.forEach((el, index) => {
            const text = el.textContent?.trim();
            if (text && text.length > 0 && text.length < 100) {
                console.log(`   ${index + 1}. "${text}" (${el.tagName}.${el.className})`);
            }
        });
        
        // 检查角色描述
        const charDescElements = document.querySelectorAll('.char_desc, .character_description, .description, p');
        console.log('📄 可能的角色描述元素:');
        charDescElements.forEach((el, index) => {
            const text = el.textContent?.trim();
            if (text && text.length > 10 && text.length < 500) {
                console.log(`   ${index + 1}. "${text.substring(0, 100)}..." (${el.tagName}.${el.className})`);
            }
        });
    }
    
    // 新增：检查页面状态
    static checkPageStatus() {
        // 检查URL信息
        console.log('📄 当前URL:', window.location.href);
        console.log('📄 页面标题:', document.title);
        
        // 检查页面类型
        const pageType = this.detectPageType();
        console.log('📄 检测到的页面类型:', pageType);
        
        // 检查SillyTavern版本
        const versionElement = document.querySelector('.version, .st-version, [data-version]');
        if (versionElement) {
            console.log('📄 SillyTavern版本:', versionElement.textContent || versionElement.getAttribute('data-version'));
        }
        
        // 检查扩展状态
        const extensionsElement = document.querySelector('.extensions, .extensions-list');
        if (extensionsElement) {
            console.log('📄 扩展管理区域:', '已找到');
        }
    }
    
    // 新增：检测页面类型
    static detectPageType() {
        if (document.querySelector('#character_select, .character_select')) {
            return '角色选择页面';
        } else if (document.querySelector('#chat, .chat')) {
            return '聊天页面';
        } else if (document.querySelector('#settings, .settings')) {
            return '设置页面';
        } else if (document.querySelector('#extensions, .extensions')) {
            return '扩展管理页面';
        } else {
            return '未知页面';
        }
    }
    
    // 测试SillyTavern API
    static async testSillyTavernAPI() {
        console.log('🔍 === 测试SillyTavern API ===');
        
        if (typeof window.SillyTavern?.getContext === 'function') {
            try {
                console.log('📄 调用 SillyTavern.getContext()...');
                const result = await window.SillyTavern.getContext({ tokenLimit: 8192 });
                console.log('✅ API调用成功');
                console.log('📄 返回类型:', typeof result);
                console.log('📄 返回结构:', Object.keys(result || {}));
                
                if (result) {
                    console.log('📄 详细内容:');
                    Object.entries(result).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            console.log(`   ${key}: 数组，长度 ${value.length}`);
                        } else if (typeof value === 'object' && value !== null) {
                            console.log(`   ${key}: 对象，键 ${Object.keys(value).length}个`);
                        } else {
                            console.log(`   ${key}: ${typeof value} - ${String(value).substring(0, 100)}`);
                        }
                    });
                }
                
                return result;
            } catch (error) {
                console.error('❌ API调用失败:', error);
                return null;
            }
        } else {
            console.log('❌ SillyTavern.getContext() 不可用');
            return null;
        }
    }
    

    
    // 生成诊断报告
    static generateDiagnosticReport() {
        console.log('📊 === 生成诊断报告 ===');
        
        const report = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            apis: {},
            dom: {},
            recommendations: []
        };
        
        // 检查API可用性
        const apis = ['SillyTavern'];
        apis.forEach(apiName => {
            const api = window[apiName];
            if (api) {
                report.apis[apiName] = {
                    available: true,
                    methods: Object.keys(api).filter(key => typeof api[key] === 'function')
                };
            } else {
                report.apis[apiName] = { available: false };
            }
        });
        
        // 检查DOM元素
        const domChecks = [
            { name: 'character', selector: '#character_info, .character_info' },
            { name: 'worldbook', selector: '.world_book, .world_info' },
            { name: 'messages', selector: '#chat .mes, .message' }
        ];
        
        domChecks.forEach(check => {
            const elements = document.querySelectorAll(check.selector);
            report.dom[check.name] = {
                found: elements.length > 0,
                count: elements.length
            };
        });
        
        // 生成建议
        if (!report.apis.SillyTavern?.available) {
            report.recommendations.push('建议确保SillyTavern正常运行');
        }
        
        if (!report.dom.character.found) {
            report.recommendations.push('未找到角色信息，请确保已加载角色卡');
        }
        
        if (!report.dom.messages.found) {
            report.recommendations.push('未找到消息元素，请确保在聊天界面中运行');
        }
        
        console.log('📄 诊断报告:', report);
        return report;
    }
    
    // 运行完整诊断
    static async runFullDiagnostic() {
        console.log('🚀 === 开始完整诊断 ===');
        
        // 1. 检查API
        this.checkAvailableAPIs();
        
        // 2. 检查DOM结构
        this.checkDOMStructure();
        
        // 3. 测试SillyTavern API
        await this.testSillyTavernAPI();
        
        // 4. 生成报告
        const report = this.generateDiagnosticReport();
        
        console.log('✅ === 诊断完成 ===');
        return report;
    }
}

// 全局调试函数
window.debugAIAssistant = {
    runDiagnostic: () => DebugTools.runFullDiagnostic(),
    checkAPIs: () => DebugTools.checkAvailableAPIs(),
    checkDOM: () => DebugTools.checkDOMStructure(),
    testSillyTavern: () => DebugTools.testSillyTavernAPI(),
    generateReport: () => DebugTools.generateDiagnosticReport()
};

// 自动运行诊断（仅在调试模式下）
if (window.location.search.includes('debug=true') || window.location.hash.includes('debug')) {
    console.log('🔧 检测到调试模式，自动运行诊断...');
    setTimeout(() => {
        DebugTools.runFullDiagnostic();
    }, 2000);
} 