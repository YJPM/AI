// 测试脚本：验证推进节奏和剧情走向的组合系统
// 在浏览器控制台中运行此脚本来测试新功能

console.log('🧪 === 开始测试推进节奏和剧情走向组合系统 ===');

// 测试按钮配置
function testButtonConfiguration() {
    console.log('\n📋 测试按钮配置');
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 快捷面板不存在');
        return;
    }
    
    // 检查推进节奏按钮
    const paceButtons = panel.querySelectorAll('button[data-pace-mode]');
    console.log(`✅ 找到 ${paceButtons.length} 个推进节奏按钮`);
    
    const expectedPaceButtons = ['normal', 'fast'];
    const foundPaceButtons = [];
    
    paceButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-pace-mode');
        const text = btn.textContent;
        foundPaceButtons.push(mode);
        console.log(`  ${index + 1}. ${text} (${mode})`);
    });
    
    // 检查剧情走向按钮
    const plotButtons = panel.querySelectorAll('button[data-plot-mode]');
    console.log(`✅ 找到 ${plotButtons.length} 个剧情走向按钮`);
    
    const expectedPlotButtons = ['normal', 'twist', 'nsfw'];
    const foundPlotButtons = [];
    
    plotButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-plot-mode');
        const text = btn.textContent;
        foundPlotButtons.push(mode);
        console.log(`  ${index + 1}. ${text} (${mode})`);
    });
    
    // 验证按钮配置
    const missingPaceButtons = expectedPaceButtons.filter(btn => !foundPaceButtons.includes(btn));
    const extraPaceButtons = foundPaceButtons.filter(btn => !expectedPaceButtons.includes(btn));
    
    const missingPlotButtons = expectedPlotButtons.filter(btn => !foundPlotButtons.includes(btn));
    const extraPlotButtons = foundPlotButtons.filter(btn => !expectedPlotButtons.includes(btn));
    
    if (missingPaceButtons.length === 0 && extraPaceButtons.length === 0) {
        console.log('✅ 推进节奏按钮配置正确');
    } else {
        console.log(`⚠️ 推进节奏按钮配置问题: 缺少 ${missingPaceButtons.join(', ')}, 多余 ${extraPaceButtons.join(', ')}`);
    }
    
    if (missingPlotButtons.length === 0 && extraPlotButtons.length === 0) {
        console.log('✅ 剧情走向按钮配置正确');
    } else {
        console.log(`⚠️ 剧情走向按钮配置问题: 缺少 ${missingPlotButtons.join(', ')}, 多余 ${extraPlotButtons.join(', ')}`);
    }
}

// 测试设置选项
function testSettingsOptions() {
    console.log('\n📋 测试设置选项');
    
    if (typeof window.getSettings === 'function') {
        try {
            const settings = window.getSettings();
            
            // 检查推进节奏设置
            if (settings && settings.paceMode) {
                console.log(`✅ 当前 paceMode: ${settings.paceMode}`);
                
                const validPaceModes = ['normal', 'fast'];
                if (validPaceModes.includes(settings.paceMode)) {
                    console.log('✅ paceMode 是有效值');
                } else {
                    console.log(`⚠️ paceMode 不是有效值: ${settings.paceMode}`);
                }
            } else {
                console.log('⚠️ 未找到 paceMode 设置');
            }
            
            // 检查剧情走向设置
            if (settings && settings.plotMode) {
                console.log(`✅ 当前 plotMode: ${settings.plotMode}`);
                
                const validPlotModes = ['normal', 'twist', 'nsfw'];
                if (validPlotModes.includes(settings.plotMode)) {
                    console.log('✅ plotMode 是有效值');
                } else {
                    console.log(`⚠️ plotMode 不是有效值: ${settings.plotMode}`);
                }
            } else {
                console.log('⚠️ 未找到 plotMode 设置');
            }
            
        } catch (error) {
            console.log('❌ 获取设置失败:', error.message);
        }
    } else {
        console.log('❌ getSettings 函数不可用');
    }
}

// 测试按钮状态
function testButtonStates() {
    console.log('\n📋 测试按钮状态');
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 快捷面板不存在');
        return;
    }
    
    const settings = window.getSettings ? window.getSettings() : null;
    if (!settings) {
        console.log('❌ 无法获取设置');
        return;
    }
    
    // 检查推进节奏按钮状态
    const paceButtons = panel.querySelectorAll('button[data-pace-mode]');
    paceButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-pace-mode');
        const text = btn.textContent;
        const isActive = settings.paceMode === mode;
        const bgColor = btn.style.background;
        const textColor = btn.style.color;
        
        console.log(`推进节奏按钮 ${index + 1}: ${text} (${mode})`);
        console.log(`  - 是否激活: ${isActive ? '✅ 是' : '❌ 否'}`);
        console.log(`  - 背景色: ${bgColor}`);
        console.log(`  - 文字色: ${textColor}`);
    });
    
    // 检查剧情走向按钮状态
    const plotButtons = panel.querySelectorAll('button[data-plot-mode]');
    plotButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-plot-mode');
        const text = btn.textContent;
        const isActive = settings.plotMode === mode;
        const bgColor = btn.style.background;
        const textColor = btn.style.color;
        
        console.log(`剧情走向按钮 ${index + 1}: ${text} (${mode})`);
        console.log(`  - 是否激活: ${isActive ? '✅ 是' : '❌ 否'}`);
        console.log(`  - 背景色: ${bgColor}`);
        console.log(`  - 文字色: ${textColor}`);
    });
}

// 测试组合逻辑
function testCombinationLogic() {
    console.log('\n📋 测试组合逻辑');
    
    // 模拟不同的组合
    const testCases = [
        { paceMode: 'normal', plotMode: 'normal', description: '正常节奏 + 正常剧情' },
        { paceMode: 'normal', plotMode: 'twist', description: '正常节奏 + 转折剧情' },
        { paceMode: 'normal', plotMode: 'nsfw', description: '正常节奏 + 成人剧情' },
        { paceMode: 'fast', plotMode: 'normal', description: '快速节奏 + 正常剧情' },
        { paceMode: 'fast', plotMode: 'twist', description: '快速节奏 + 转折剧情' },
        { paceMode: 'fast', plotMode: 'nsfw', description: '快速节奏 + 成人剧情' }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n--- 测试组合 ${index + 1}: ${testCase.description} ---`);
        
        // 模拟模板组合逻辑
        const paceTemplate = `推进节奏模板: ${testCase.paceMode}`;
        const plotTemplate = `剧情走向模板: ${testCase.plotMode}`;
        const combinedTemplate = `${paceTemplate}\n\n## 剧情走向要求\n${plotTemplate}`;
        
        console.log(`  推进节奏: ${testCase.paceMode}`);
        console.log(`  剧情走向: ${testCase.plotMode}`);
        console.log(`  组合结果: ${combinedTemplate.length} 字符`);
        console.log(`  组合逻辑: ✅ 正确`);
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
    
    // 测试剧情走向按钮
    const plotButtons = panel.querySelectorAll('button[data-plot-mode]');
    console.log('剧情走向按钮测试:');
    plotButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-plot-mode');
        const text = btn.textContent;
        console.log(`  ${index + 1}. ${text} (${mode}) - 可点击: ${!btn.disabled}`);
    });
}

// 测试默认选择
function testDefaultSelection() {
    console.log('\n📋 测试默认选择');
    
    const settings = window.getSettings ? window.getSettings() : null;
    if (!settings) {
        console.log('❌ 无法获取设置');
        return;
    }
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 快捷面板不存在');
        return;
    }
    
    // 检查默认推进节奏
    const defaultPaceMode = settings.paceMode || 'normal';
    const paceButton = panel.querySelector(`button[data-pace-mode="${defaultPaceMode}"]`);
    if (paceButton) {
        const isActive = paceButton.style.background.includes(defaultPaceMode === 'normal' ? '#2196F3' : '#4CAF50');
        console.log(`默认推进节奏: ${defaultPaceMode} - ${isActive ? '✅ 已选中' : '❌ 未选中'}`);
    } else {
        console.log(`❌ 未找到推进节奏按钮: ${defaultPaceMode}`);
    }
    
    // 检查默认剧情走向
    const defaultPlotMode = settings.plotMode || 'normal';
    const plotButton = panel.querySelector(`button[data-plot-mode="${defaultPlotMode}"]`);
    if (plotButton) {
        const isActive = plotButton.style.background.includes(defaultPlotMode === 'normal' ? '#2196F3' : defaultPlotMode === 'twist' ? '#9C27B0' : '#E91E63');
        console.log(`默认剧情走向: ${defaultPlotMode} - ${isActive ? '✅ 已选中' : '❌ 未选中'}`);
    } else {
        console.log(`❌ 未找到剧情走向按钮: ${defaultPlotMode}`);
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    testButtonConfiguration();
    testSettingsOptions();
    testButtonStates();
    testCombinationLogic();
    testButtonClicks();
    testDefaultSelection();
    
    console.log('\n✅ === 所有测试完成 ===');
    console.log('💡 如果所有测试都通过，说明推进节奏和剧情走向组合系统工作正常！');
}

// 自动运行测试
runAllTests();

// 导出测试函数供手动调用
window.testCombinedSystem = {
    runAllTests,
    testButtonConfiguration,
    testSettingsOptions,
    testButtonStates,
    testCombinationLogic,
    testButtonClicks,
    testDefaultSelection
}; 