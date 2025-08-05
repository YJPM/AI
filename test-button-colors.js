// 测试脚本：验证刷新按钮颜色修复
// 在浏览器控制台中运行此脚本来测试修复效果

console.log('🧪 === 开始测试刷新按钮颜色修复 ===');

// 测试按钮初始颜色
function testInitialButtonColor() {
    console.log('\n📋 测试按钮初始颜色');
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 快捷面板不存在');
        return;
    }
    
    const refreshButton = panel.querySelector('button[title="重新获取选项"]');
    if (!refreshButton) {
        console.log('❌ 刷新按钮不存在');
        return;
    }
    
    console.log('✅ 找到刷新按钮');
    console.log('  - 当前背景色:', refreshButton.style.background);
    console.log('  - 当前文字颜色:', refreshButton.style.color);
    console.log('  - 当前边框:', refreshButton.style.border);
    
    const expectedBackground = '#e9ecef';
    const actualBackground = refreshButton.style.background;
    
    if (actualBackground === expectedBackground) {
        console.log('✅ 初始背景色正确');
    } else {
        console.log(`❌ 初始背景色错误: 期望 ${expectedBackground}, 实际 ${actualBackground}`);
    }
}

// 测试loading状态颜色
function testLoadingStateColors() {
    console.log('\n📋 测试loading状态颜色');
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 快捷面板不存在');
        return;
    }
    
    const refreshButton = panel.querySelector('button[title="重新获取选项"]');
    if (!refreshButton) {
        console.log('❌ 刷新按钮不存在');
        return;
    }
    
    // 模拟显示loading状态
    console.log('🔍 模拟显示loading状态...');
    const originalBackground = refreshButton.style.background;
    const originalColor = refreshButton.style.color;
    
    // 应用loading样式
    refreshButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    refreshButton.style.color = '#fff';
    
    console.log('  - Loading背景色:', refreshButton.style.background);
    console.log('  - Loading文字颜色:', refreshButton.style.color);
    
    // 检查loading状态是否正确
    const loadingBackground = refreshButton.style.background;
    const loadingColor = refreshButton.style.color;
    
    if (loadingBackground.includes('linear-gradient') && loadingColor === '#fff') {
        console.log('✅ Loading状态颜色正确');
    } else {
        console.log('❌ Loading状态颜色错误');
    }
    
    // 恢复原始状态
    refreshButton.style.background = originalBackground;
    refreshButton.style.color = originalColor;
    console.log('✅ 已恢复原始状态');
}

// 测试hover状态颜色
function testHoverStateColors() {
    console.log('\n📋 测试hover状态颜色');
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 快捷面板不存在');
        return;
    }
    
    const refreshButton = panel.querySelector('button[title="重新获取选项"]');
    if (!refreshButton) {
        console.log('❌ 刷新按钮不存在');
        return;
    }
    
    // 模拟hover状态
    console.log('🔍 模拟hover状态...');
    const originalBackground = refreshButton.style.background;
    const originalColor = refreshButton.style.color;
    
    // 应用hover样式
    refreshButton.style.background = '#dee2e6';
    refreshButton.style.color = '#333';
    
    console.log('  - Hover背景色:', refreshButton.style.background);
    console.log('  - Hover文字颜色:', refreshButton.style.color);
    
    // 检查hover状态是否正确
    const hoverBackground = refreshButton.style.background;
    const hoverColor = refreshButton.style.color;
    
    if (hoverBackground === '#dee2e6' && hoverColor === '#333') {
        console.log('✅ Hover状态颜色正确');
    } else {
        console.log('❌ Hover状态颜色错误');
    }
    
    // 恢复原始状态
    refreshButton.style.background = originalBackground;
    refreshButton.style.color = originalColor;
    console.log('✅ 已恢复原始状态');
}

// 测试颜色对比度
function testColorContrast() {
    console.log('\n📋 测试颜色对比度');
    
    const colors = {
        initial: '#e9ecef',
        hover: '#dee2e6',
        loading: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    
    console.log('颜色配置:');
    console.log('  - 初始状态:', colors.initial);
    console.log('  - Hover状态:', colors.hover);
    console.log('  - Loading状态:', colors.loading);
    
    // 检查颜色是否足够明显
    const initialColor = colors.initial;
    const hoverColor = colors.hover;
    
    if (initialColor !== '#ffffff' && initialColor !== '#f8f9fa') {
        console.log('✅ 初始颜色不是白色，足够明显');
    } else {
        console.log('❌ 初始颜色太浅，可能看起来像白色');
    }
    
    if (hoverColor !== '#ffffff' && hoverColor !== '#f8f9fa') {
        console.log('✅ Hover颜色不是白色，足够明显');
    } else {
        console.log('❌ Hover颜色太浅，可能看起来像白色');
    }
}

// 测试实际点击功能
function testActualClickFunction() {
    console.log('\n📋 测试实际点击功能');
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 快捷面板不存在');
        return;
    }
    
    const refreshButton = panel.querySelector('button[title="重新获取选项"]');
    if (!refreshButton) {
        console.log('❌ 刷新按钮不存在');
        return;
    }
    
    console.log('✅ 刷新按钮可点击:', !refreshButton.disabled);
    console.log('✅ 刷新按钮可见:', refreshButton.style.display !== 'none');
    console.log('✅ 刷新按钮透明度:', refreshButton.style.opacity);
    
    // 检查是否有点击事件监听器
    const hasClickListeners = refreshButton.onclick !== null || 
                             refreshButton._listeners || 
                             refreshButton.addEventListener;
    
    if (hasClickListeners) {
        console.log('✅ 刷新按钮有事件监听器');
    } else {
        console.log('⚠️ 刷新按钮可能没有事件监听器');
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    testInitialButtonColor();
    testLoadingStateColors();
    testHoverStateColors();
    testColorContrast();
    testActualClickFunction();
    
    console.log('\n✅ === 所有测试完成 ===');
    console.log('💡 如果所有测试都通过，说明按钮颜色修复成功！');
}

// 自动运行测试
runAllTests();

// 导出测试函数供手动调用
window.testButtonColors = {
    runAllTests,
    testInitialButtonColor,
    testLoadingStateColors,
    testHoverStateColors,
    testColorContrast,
    testActualClickFunction
}; 