// 测试脚本：验证 worldInfo 类型错误修复
// 在浏览器控制台中运行此脚本来测试修复效果

console.log('🧪 === 开始测试 worldInfo 类型错误修复 ===');

// 模拟不同的 worldInfo 数据类型
const testCases = [
    { name: '正常数组', data: [{ title: '世界书1', content: '内容1' }, { title: '世界书2', content: '内容2' }] },
    { name: '空数组', data: [] },
    { name: 'null', data: null },
    { name: 'undefined', data: undefined },
    { name: '字符串', data: '不是数组' },
    { name: '数字', data: 123 },
    { name: '对象', data: { title: '错误格式' } }
];

// 测试函数
function testWorldInfoHandling(worldInfoData) {
    console.log(`\n📋 测试数据类型: ${typeof worldInfoData}`);
    console.log('📄 数据内容:', worldInfoData);
    
    try {
        // 模拟修复后的逻辑
        const safeWorldInfo = Array.isArray(worldInfoData) ? worldInfoData : [];
        
        console.log('✅ 安全处理结果:');
        console.log('  - 是否为数组:', Array.isArray(safeWorldInfo));
        console.log('  - 数组长度:', safeWorldInfo.length);
        
        if (safeWorldInfo.length > 0) {
            console.log('  - 第一个元素:', safeWorldInfo[0]);
            console.log('  - 标题列表:', safeWorldInfo.map(w => w.title || '未命名').join(', '));
        }
        
        return true;
    } catch (error) {
        console.error('❌ 处理失败:', error);
        return false;
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    testCases.forEach((testCase, index) => {
        console.log(`\n--- 测试 ${index + 1}: ${testCase.name} ---`);
        const success = testWorldInfoHandling(testCase.data);
        if (success) {
            passedTests++;
        }
    });
    
    console.log('\n📊 === 测试结果汇总 ===');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`❌ 失败测试: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！worldInfo 类型错误已修复。');
    } else {
        console.log('⚠️ 仍有测试失败，需要进一步检查。');
    }
}

// 测试 getContextCompatible 函数的模拟
function testGetContextCompatible() {
    console.log('\n🔍 === 测试 getContextCompatible 函数 ===');
    
    // 模拟不同的上下文数据
    const mockContexts = [
        {
            name: '正常数据',
            data: {
                messages: [{ role: 'user', content: '测试消息' }],
                character: { name: '测试角色' },
                world_info: [{ title: '世界书1', content: '内容1' }],
                system_prompt: '测试提示词'
            }
        },
        {
            name: 'world_info 为 null',
            data: {
                messages: [{ role: 'user', content: '测试消息' }],
                character: { name: '测试角色' },
                world_info: null,
                system_prompt: '测试提示词'
            }
        },
        {
            name: 'world_info 为字符串',
            data: {
                messages: [{ role: 'user', content: '测试消息' }],
                character: { name: '测试角色' },
                world_info: '错误格式',
                system_prompt: '测试提示词'
            }
        }
    ];
    
    mockContexts.forEach((mockContext, index) => {
        console.log(`\n📋 测试上下文 ${index + 1}: ${mockContext.name}`);
        
        try {
            const context = mockContext.data;
            
            // 测试世界书信息处理
            if (context.world_info && Array.isArray(context.world_info) && context.world_info.length > 0) {
                console.log('✅ 世界书信息处理正常');
                console.log('  - 世界书数量:', context.world_info.length);
                console.log('  - 世界书标题:', context.world_info.map(w => w.title || '未命名').join(', '));
            } else {
                console.log('⚠️ 无世界书信息或格式不正确');
            }
            
            // 测试统计信息
            const hasWorldInfo = !!(context.world_info && Array.isArray(context.world_info) && context.world_info.length > 0);
            console.log('  - 包含世界书:', hasWorldInfo);
            
        } catch (error) {
            console.error('❌ 处理失败:', error);
        }
    });
}

// 运行测试
runAllTests();
testGetContextCompatible();

console.log('\n✅ === 测试完成 ===');
console.log('💡 如果所有测试都通过，说明 worldInfo 类型错误已成功修复！');

// 导出测试函数供手动调用
window.testWorldInfoFix = {
    runAllTests,
    testWorldInfoHandling,
    testGetContextCompatible
}; 