// AI助手扩展 - API配置快速修复脚本
// 在浏览器控制台中运行此脚本来修复API配置问题

(function() {
    console.log('🔧 AI助手扩展 - API配置修复工具');
    console.log('=====================================');
    
    // 获取当前设置
    function getCurrentSettings() {
        try {
            // 尝试从扩展设置中获取
            if (window.extension_settings && window.extension_settings.typing_indicator) {
                return window.extension_settings.typing_indicator;
            }
            
            // 尝试从localStorage获取
            const stored = localStorage.getItem('extension-settings-typing_indicator');
            if (stored) {
                return JSON.parse(stored);
            }
            
            return null;
        } catch (error) {
            console.error('获取设置失败:', error);
            return null;
        }
    }
    
    // 保存设置
    function saveSettings(settings) {
        try {
            if (window.extension_settings) {
                window.extension_settings.typing_indicator = settings;
            }
            
            localStorage.setItem('extension-settings-typing_indicator', JSON.stringify(settings));
            console.log('✅ 设置已保存');
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }
    
    // 修复API配置
    function fixApiConfig() {
        console.log('🔍 检查当前API配置...');
        
        const settings = getCurrentSettings();
        if (!settings) {
            console.log('❌ 无法获取当前设置，请确保扩展已正确加载');
            return false;
        }
        
        console.log('📋 当前配置:');
        console.log('  - API类型:', settings.optionsApiType);
        console.log('  - 模型:', settings.optionsApiModel);
        console.log('  - API密钥:', settings.optionsApiKey ? '已设置' : '未设置');
        console.log('  - 基础URL:', settings.optionsBaseUrl);
        
        let needsFix = false;
        const fixes = [];
        
        // 检查模型名称
        if (!settings.optionsApiModel || settings.optionsApiModel === 'undefined' || settings.optionsApiModel.trim() === '') {
            console.log('❌ 问题: 模型名称无效');
            needsFix = true;
            
            // 根据API类型设置默认模型
            if (settings.optionsApiType === 'gemini') {
                settings.optionsApiModel = 'gemini-2.5-flash-free';
                fixes.push('设置Gemini默认模型: gemini-2.5-flash-free');
            } else {
                settings.optionsApiModel = 'gpt-3.5-turbo';
                fixes.push('设置OpenAI默认模型: gpt-3.5-turbo');
            }
        }
        
        // 检查API密钥
        if (!settings.optionsApiKey || settings.optionsApiKey.trim() === '') {
            console.log('❌ 问题: API密钥未设置');
            needsFix = true;
            fixes.push('请手动设置API密钥');
        }
        
        // 检查基础URL
        if (!settings.optionsBaseUrl || settings.optionsBaseUrl.trim() === '') {
            console.log('❌ 问题: 基础URL未设置');
            needsFix = true;
            settings.optionsBaseUrl = 'https://newapi.sisuo.de/v1';
            fixes.push('设置默认基础URL: https://newapi.sisuo.de/v1');
        }
        
        if (needsFix) {
            console.log('\n🔧 应用修复...');
            fixes.forEach(fix => console.log('  - ' + fix));
            
            if (saveSettings(settings)) {
                console.log('\n✅ 配置修复完成！');
                console.log('📋 修复后的配置:');
                console.log('  - API类型:', settings.optionsApiType);
                console.log('  - 模型:', settings.optionsApiModel);
                console.log('  - 基础URL:', settings.optionsBaseUrl);
                console.log('  - API密钥:', settings.optionsApiKey ? '已设置' : '需要手动设置');
                
                console.log('\n💡 下一步:');
                console.log('1. 如果API密钥未设置，请在扩展设置中手动输入');
                console.log('2. 刷新页面以应用新配置');
                console.log('3. 在扩展设置中点击"测试连接"验证配置');
                
                return true;
            } else {
                console.log('❌ 保存设置失败');
                return false;
            }
        } else {
            console.log('✅ 配置看起来正常，无需修复');
            return true;
        }
    }
    
    // 重置为默认配置
    function resetToDefaults() {
        console.log('🔄 重置为默认配置...');
        
        const defaultSettings = {
            optionsGenEnabled: true,
            optionsApiType: 'openai',
            optionsApiKey: '',
            optionsApiModel: 'gpt-3.5-turbo',
            optionsBaseUrl: 'https://newapi.sisuo.de/v1',
            sendMode: 'auto',
            streamOptions: false,
            paceMode: 'normal',
            autoGenMode: 'auto',
            showQuickPanel: true,
            debug: true,
            enableApiInterception: true,
            enableProxySystem: true
        };
        
        if (saveSettings(defaultSettings)) {
            console.log('✅ 已重置为默认配置');
            console.log('📋 默认配置:');
            console.log('  - API类型: OpenAI兼容');
            console.log('  - 模型: gpt-3.5-turbo');
            console.log('  - 基础URL: https://newapi.sisuo.de/v1');
            console.log('  - API密钥: 需要手动设置');
            
            console.log('\n💡 下一步:');
            console.log('1. 在扩展设置中输入您的API密钥');
            console.log('2. 根据需要调整API类型和模型');
            console.log('3. 点击"测试连接"验证配置');
            
            return true;
        } else {
            console.log('❌ 重置配置失败');
            return false;
        }
    }
    
    // 测试当前配置
    function testCurrentConfig() {
        console.log('🧪 测试当前配置...');
        
        const settings = getCurrentSettings();
        if (!settings) {
            console.log('❌ 无法获取配置');
            return;
        }
        
        console.log('📋 测试配置:');
        console.log('  - API类型:', settings.optionsApiType);
        console.log('  - 模型:', settings.optionsApiModel);
        console.log('  - 基础URL:', settings.optionsBaseUrl);
        
        // 构造测试URL
        let testUrl;
        if (settings.optionsApiType === 'gemini') {
            testUrl = `https://generativelanguage.googleapis.com/v1/models/${settings.optionsApiModel}:generateContent`;
        } else {
            testUrl = `${settings.optionsBaseUrl}/chat/completions`;
        }
        
        console.log('🔗 测试URL:', testUrl);
        
        // 检查URL是否包含undefined
        if (testUrl.includes('undefined')) {
            console.log('❌ URL包含undefined，配置有问题');
            console.log('💡 建议运行 fixApiConfig() 修复配置');
        } else {
            console.log('✅ URL格式正确');
        }
    }
    
    // 导出函数到全局作用域
    window.AIAssistantFix = {
        fixApiConfig: fixApiConfig,
        resetToDefaults: resetToDefaults,
        testCurrentConfig: testCurrentConfig,
        getCurrentSettings: getCurrentSettings
    };
    
    console.log('\n📚 可用命令:');
    console.log('  AIAssistantFix.fixApiConfig()     - 修复API配置问题');
    console.log('  AIAssistantFix.resetToDefaults()  - 重置为默认配置');
    console.log('  AIAssistantFix.testCurrentConfig() - 测试当前配置');
    console.log('  AIAssistantFix.getCurrentSettings() - 获取当前设置');
    
    console.log('\n🚀 开始自动修复...');
    fixApiConfig();
    
})(); 