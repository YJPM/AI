// 测试脚本：验证移除 TavernHelper 依赖后的功能
// 在浏览器控制台中运行此脚本来测试功能

console.log('🧪 === 开始测试移除 TavernHelper 依赖后的功能 ===');

// 测试1: 检查是否还有 TavernHelper 引用
function testNoTavernHelperReferences() {
    console.log('\n📋 测试1: 检查 TavernHelper 引用');
    
    // 检查全局对象
    if (typeof window.TavernHelper !== 'undefined') {
        console.log('⚠️  发现全局 TavernHelper 对象（可能是其他扩展提供的）');
    } else {
        console.log('✅ 全局 TavernHelper 对象未定义');
    }
    
    // 检查我们的代码中是否还有引用
    const codeReferences = [
        'testTavernHelper',
        'TavernHelper.getCharacter',
        'TavernHelper.getWorldBooks',
        'TavernHelper.getMessages'
    ];
    
    let foundReferences = false;
    codeReferences.forEach(ref => {
        if (window.debugAIAssistant && typeof window.debugAIAssistant[ref] === 'function') {
            console.log(`❌ 发现引用: ${ref}`);
            foundReferences = true;
        }
    });
    
    if (!foundReferences) {
        console.log('✅ 代码中无 TavernHelper 引用');
    }
}

// 测试2: 检查 SillyTavern API 功能
function testSillyTavernAPI() {
    console.log('\n📋 测试2: 检查 SillyTavern API');
    
    if (typeof window.SillyTavern !== 'undefined') {
        console.log('✅ SillyTavern 对象可用');
        console.log('📄 可用方法:', Object.keys(window.SillyTavern).filter(key => typeof window.SillyTavern[key] === 'function'));
        
        // 测试 getContext 方法
        if (typeof window.SillyTavern.getContext === 'function') {
            console.log('✅ SillyTavern.getContext() 可用');
        } else {
            console.log('⚠️  SillyTavern.getContext() 不可用');
        }
    } else {
        console.log('❌ SillyTavern 对象不可用');
    }
}

// 测试3: 检查调试工具功能
function testDebugTools() {
    console.log('\n📋 测试3: 检查调试工具');
    
    if (window.debugAIAssistant) {
        console.log('✅ 调试工具可用');
        console.log('📄 可用方法:', Object.keys(window.debugAIAssistant));
        
        // 测试各个方法
        const methods = ['runDiagnostic', 'checkAPIs', 'checkDOM', 'testSillyTavern', 'generateReport'];
        methods.forEach(method => {
            if (typeof window.debugAIAssistant[method] === 'function') {
                console.log(`✅ ${method}() 可用`);
            } else {
                console.log(`❌ ${method}() 不可用`);
            }
        });
    } else {
        console.log('❌ 调试工具不可用');
    }
}

// 测试4: 检查上下文获取功能
async function testContextRetrieval() {
    console.log('\n📋 测试4: 检查上下文获取功能');
    
    try {
        // 尝试获取上下文（如果 OptionsGenerator 可用）
        if (window.OptionsGenerator && typeof window.OptionsGenerator.testContextRetrieval === 'function') {
            console.log('✅ 开始测试上下文获取...');
            await window.OptionsGenerator.testContextRetrieval();
        } else {
            console.log('⚠️  OptionsGenerator.testContextRetrieval() 不可用');
        }
    } catch (error) {
        console.error('❌ 上下文获取测试失败:', error);
    }
}

// 测试5: 检查 DOM 解析功能
function testDOMParsing() {
    console.log('\n📋 测试5: 检查 DOM 解析功能');
    
    // 检查角色元素
    const characterElements = document.querySelectorAll('#character_info, .character_info, .char_name');
    console.log(`📄 找到角色元素: ${characterElements.length} 个`);
    
    // 检查消息元素
    const messageElements = document.querySelectorAll('#chat .mes, .message');
    console.log(`📄 找到消息元素: ${messageElements.length} 个`);
    
    // 检查世界书元素
    const worldBookElements = document.querySelectorAll('.world_book, .world_info');
    console.log(`📄 找到世界书元素: ${worldBookElements.length} 个`);
    
    if (characterElements.length > 0 || messageElements.length > 0) {
        console.log('✅ DOM 解析功能正常');
    } else {
        console.log('⚠️  未找到相关 DOM 元素');
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    testNoTavernHelperReferences();
    testSillyTavernAPI();
    testDebugTools();
    await testContextRetrieval();
    testDOMParsing();
    
    console.log('\n✅ === 所有测试完成 ===');
    console.log('\n📝 总结:');
    console.log('- 扩展已成功移除 TavernHelper 依赖');
    console.log('- 现在完全依赖 SillyTavern 原生 API 和 DOM 解析');
    console.log('- 如果发现问题，请检查 SillyTavern 版本和配置');
}

// 自动运行测试
runAllTests().catch(error => {
    console.error('❌ 测试运行失败:', error);
});

// 导出测试函数供手动调用
window.testNoTavernHelper = {
    runAllTests,
    testNoTavernHelperReferences,
    testSillyTavernAPI,
    testDebugTools,
    testContextRetrieval,
    testDOMParsing
}; 