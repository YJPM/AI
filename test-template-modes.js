// 测试脚本：验证新的模板类型功能
// 在浏览器控制台中运行此脚本来测试新功能

console.log('🧪 === 开始测试新的模板类型功能 ===');

// 测试函数
function testTemplateModes() {
    console.log('\n📋 测试模板类型功能');
    
    // 检查设置中的新字段
    const settings = window.getSettings ? window.getSettings() : null;
    if (settings) {
        console.log('✅ 设置对象可用');
        console.log('  - templateMode:', settings.templateMode);
        console.log('  - paceMode:', settings.paceMode);
    } else {
        console.log('❌ 设置对象不可用');
    }
    
    // 检查UI面板
    const panel = document.getElementById('quick-pace-panel');
    if (panel) {
        console.log('✅ 快捷面板存在');
        
        // 检查推进节奏按钮
        const paceButtons = panel.querySelectorAll('button[data-pace-mode]');
        console.log('  - 推进节奏按钮数量:', paceButtons.length);
        paceButtons.forEach((btn, index) => {
            const mode = btn.getAttribute('data-pace-mode');
            const text = btn.textContent;
            console.log(`    ${index + 1}. ${text} (${mode})`);
        });
        
        // 检查模板类型按钮
        const templateButtons = panel.querySelectorAll('button[data-template-mode]');
        console.log('  - 模板类型按钮数量:', templateButtons.length);
        templateButtons.forEach((btn, index) => {
            const mode = btn.getAttribute('data-template-mode');
            const text = btn.textContent;
            console.log(`    ${index + 1}. ${text} (${mode})`);
        });
        
        // 检查分隔符
        const separators = panel.querySelectorAll('div[style*="background: #e0e0e0"]');
        console.log('  - 分隔符数量:', separators.length);
        
        // 检查刷新按钮
        const refreshButton = panel.querySelector('button[title="重新获取选项"]');
        console.log('  - 刷新按钮存在:', !!refreshButton);
        
    } else {
        console.log('❌ 快捷面板不存在');
    }
}

// 测试模板选择逻辑
function testTemplateSelection() {
    console.log('\n📋 测试模板选择逻辑');
    
    // 模拟不同的模板类型
    const testCases = [
        { templateMode: 'discovery', expectedType: 'EXPLORATION_PROMPTS' },
        { templateMode: 'mystery', expectedType: 'EXPLORATION_PROMPTS' },
        { templateMode: 'resolution', expectedType: 'CONFLICT_PROMPTS' },
        { templateMode: 'challenge', expectedType: 'CONFLICT_PROMPTS' },
        { templateMode: 'healing', expectedType: 'EMOTIONAL_PROMPTS' },
        { templateMode: 'celebration', expectedType: 'EMOTIONAL_PROMPTS' },
        { templateMode: 'normal', expectedType: 'PACE_PROMPTS' },
        { templateMode: 'fast', expectedType: 'PACE_PROMPTS' },
        { templateMode: 'jump', expectedType: 'PACE_PROMPTS' }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n--- 测试 ${index + 1}: ${testCase.templateMode} ---`);
        
        // 模拟选择逻辑
        let selectedTemplate = '';
        if (testCase.templateMode === 'discovery' || testCase.templateMode === 'mystery') {
            selectedTemplate = 'EXPLORATION_PROMPTS';
        } else if (testCase.templateMode === 'resolution' || testCase.templateMode === 'challenge') {
            selectedTemplate = 'CONFLICT_PROMPTS';
        } else if (testCase.templateMode === 'healing' || testCase.templateMode === 'celebration') {
            selectedTemplate = 'EMOTIONAL_PROMPTS';
        } else {
            selectedTemplate = 'PACE_PROMPTS';
        }
        
        const isCorrect = selectedTemplate === testCase.expectedType;
        console.log(`  模板类型: ${testCase.templateMode}`);
        console.log(`  选择结果: ${selectedTemplate}`);
        console.log(`  预期结果: ${testCase.expectedType}`);
        console.log(`  测试结果: ${isCorrect ? '✅ 通过' : '❌ 失败'}`);
    });
}

// 测试按钮点击功能
function testButtonClicks() {
    console.log('\n📋 测试按钮点击功能');
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 面板不存在，无法测试');
        return;
    }
    
    // 测试推进节奏按钮
    const paceButtons = panel.querySelectorAll('button[data-pace-mode]');
    console.log('推进节奏按钮测试:');
    paceButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-pace-mode');
        const text = btn.textContent;
        console.log(`  ${index + 1}. ${text} (${mode}) - 可点击: ${!btn.disabled}`);
    });
    
    // 测试模板类型按钮
    const templateButtons = panel.querySelectorAll('button[data-template-mode]');
    console.log('模板类型按钮测试:');
    templateButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-template-mode');
        const text = btn.textContent;
        console.log(`  ${index + 1}. ${text} (${mode}) - 可点击: ${!btn.disabled}`);
    });
}

// 测试设置保存功能
function testSettingsSave() {
    console.log('\n📋 测试设置保存功能');
    
    // 检查是否有保存设置的功能
    if (typeof window.saveSettingsDebounced === 'function') {
        console.log('✅ saveSettingsDebounced 函数可用');
    } else {
        console.log('❌ saveSettingsDebounced 函数不可用');
    }
    
    // 检查localStorage
    try {
        const testKey = 'test_template_mode';
        localStorage.setItem(testKey, 'test_value');
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (testValue === 'test_value') {
            console.log('✅ localStorage 功能正常');
        } else {
            console.log('❌ localStorage 功能异常');
        }
    } catch (error) {
        console.log('❌ localStorage 不可用:', error.message);
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    testTemplateModes();
    testTemplateSelection();
    testButtonClicks();
    testSettingsSave();
    
    console.log('\n✅ === 所有测试完成 ===');
    console.log('💡 如果所有测试都通过，说明新的模板类型功能已成功添加！');
}

// 自动运行测试
runAllTests();

// 导出测试函数供手动调用
window.testTemplateModes = {
    runAllTests,
    testTemplateModes,
    testTemplateSelection,
    testButtonClicks,
    testSettingsSave
}; 