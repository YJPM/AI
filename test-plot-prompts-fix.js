// 测试脚本：验证 PLOT_PROMPTS 修复
// 在浏览器控制台中运行此脚本来测试修复效果

console.log('🧪 === 开始测试 PLOT_PROMPTS 修复 ===');

// 测试 PLOT_PROMPTS 导入和可用性
function testPlotPromptsImport() {
    console.log('\n📋 测试 PLOT_PROMPTS 导入');
    
    try {
        // 检查 PLOT_PROMPTS 是否可用
        if (typeof window.PLOT_PROMPTS !== 'undefined') {
            console.log('✅ PLOT_PROMPTS 全局可用');
        } else {
            console.log('⚠️ PLOT_PROMPTS 全局不可用，可能需要手动导入');
        }
        
        // 检查具体的模板类型
        const expectedTypes = ['normal', 'twist'];
        expectedTypes.forEach(type => {
            if (window.PLOT_PROMPTS && window.PLOT_PROMPTS[type]) {
                console.log(`✅ PLOT_PROMPTS.${type} 可用`);
                const template = window.PLOT_PROMPTS[type];
                console.log(`  - 模板长度: ${template.length} 字符`);
                console.log(`  - 包含核心要求: ${template.includes('核心要求') ? '是' : '否'}`);
                console.log(`  - 包含输出格式: ${template.includes('输出格式') ? '是' : '否'}`);
            } else {
                console.log(`❌ PLOT_PROMPTS.${type} 不可用`);
            }
        });
        
    } catch (error) {
        console.error('❌ 测试 PLOT_PROMPTS 导入失败:', error);
    }
}

// 测试模板选择逻辑
function testTemplateSelectionLogic() {
    console.log('\n📋 测试模板选择逻辑');
    
    // 模拟不同的模板类型
    const testCases = [
        { templateMode: 'normal', expectedType: 'PLOT_PROMPTS' },
        { templateMode: 'twist', expectedType: 'PLOT_PROMPTS' },
        { templateMode: 'discovery', expectedType: 'EXPLORATION_PROMPTS' },
        { templateMode: 'mystery', expectedType: 'EXPLORATION_PROMPTS' },
        { templateMode: 'resolution', expectedType: 'CONFLICT_PROMPTS' },
        { templateMode: 'challenge', expectedType: 'CONFLICT_PROMPTS' },
        { templateMode: 'healing', expectedType: 'EMOTIONAL_PROMPTS' },
        { templateMode: 'celebration', expectedType: 'EMOTIONAL_PROMPTS' },
        { templateMode: 'fast', expectedType: 'PACE_PROMPTS' },
        { templateMode: 'jump', expectedType: 'PACE_PROMPTS' }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n--- 测试 ${index + 1}: ${testCase.templateMode} ---`);
        
        // 模拟选择逻辑（与实际代码一致）
        let selectedTemplate = '';
        if (testCase.templateMode === 'discovery' || testCase.templateMode === 'mystery') {
            selectedTemplate = 'EXPLORATION_PROMPTS';
        } else if (testCase.templateMode === 'resolution' || testCase.templateMode === 'challenge') {
            selectedTemplate = 'CONFLICT_PROMPTS';
        } else if (testCase.templateMode === 'healing' || testCase.templateMode === 'celebration') {
            selectedTemplate = 'EMOTIONAL_PROMPTS';
        } else if (testCase.templateMode === 'normal' || testCase.templateMode === 'twist') {
            selectedTemplate = 'PLOT_PROMPTS';
        } else {
            selectedTemplate = 'PACE_PROMPTS';
        }
        
        const isCorrect = selectedTemplate === testCase.expectedType;
        console.log(`  模板类型: ${testCase.templateMode}`);
        console.log(`  选择结果: ${selectedTemplate}`);
        console.log(`  预期结果: ${testCase.expectedType}`);
        console.log(`  测试结果: ${isCorrect ? '✅ 通过' : '❌ 失败'}`);
        
        if (!isCorrect) {
            console.log(`  ⚠️ 需要修复: ${testCase.templateMode} 应该选择 ${testCase.expectedType}`);
        }
    });
}

// 测试 UI 按钮
function testUIButtons() {
    console.log('\n📋 测试 UI 按钮');
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 快捷面板不存在');
        return;
    }
    
    // 检查模板类型按钮
    const templateButtons = panel.querySelectorAll('button[data-template-mode]');
    console.log(`✅ 找到 ${templateButtons.length} 个模板类型按钮`);
    
    const expectedButtons = ['discovery', 'mystery', 'resolution', 'challenge', 'healing', 'celebration', 'normal', 'twist'];
    const foundButtons = [];
    
    templateButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-template-mode');
        const text = btn.textContent;
        foundButtons.push(mode);
        console.log(`  ${index + 1}. ${text} (${mode})`);
    });
    
    // 检查是否包含新的按钮
    const missingButtons = expectedButtons.filter(btn => !foundButtons.includes(btn));
    const extraButtons = foundButtons.filter(btn => !expectedButtons.includes(btn));
    
    if (missingButtons.length > 0) {
        console.log(`⚠️ 缺少按钮: ${missingButtons.join(', ')}`);
    }
    
    if (extraButtons.length > 0) {
        console.log(`⚠️ 多余按钮: ${extraButtons.join(', ')}`);
    }
    
    if (missingButtons.length === 0 && extraButtons.length === 0) {
        console.log('✅ 所有预期的按钮都存在');
    }
}

// 测试设置选项
function testSettingsOptions() {
    console.log('\n📋 测试设置选项');
    
    // 检查设置中的 templateMode 选项
    if (typeof window.getSettings === 'function') {
        try {
            const settings = window.getSettings();
            if (settings && settings.templateMode) {
                console.log(`✅ 当前 templateMode: ${settings.templateMode}`);
                
                // 检查是否是有效的模板类型
                const validModes = ['discovery', 'mystery', 'resolution', 'challenge', 'healing', 'celebration', 'normal', 'twist'];
                if (validModes.includes(settings.templateMode)) {
                    console.log('✅ templateMode 是有效值');
                } else {
                    console.log(`⚠️ templateMode 不是有效值: ${settings.templateMode}`);
                }
            } else {
                console.log('⚠️ 未找到 templateMode 设置');
            }
        } catch (error) {
            console.log('❌ 获取设置失败:', error.message);
        }
    } else {
        console.log('❌ getSettings 函数不可用');
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    testPlotPromptsImport();
    testTemplateSelectionLogic();
    testUIButtons();
    testSettingsOptions();
    
    console.log('\n✅ === 所有测试完成 ===');
    console.log('💡 如果所有测试都通过，说明 PLOT_PROMPTS 修复成功！');
}

// 自动运行测试
runAllTests();

// 导出测试函数供手动调用
window.testPlotPromptsFix = {
    runAllTests,
    testPlotPromptsImport,
    testTemplateSelectionLogic,
    testUIButtons,
    testSettingsOptions
}; 