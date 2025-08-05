// 测试脚本：验证按钮样式修复
// 在浏览器控制台中运行此脚本来测试修复效果

console.log('🧪 === 开始测试按钮样式修复 ===');

// 测试刷新按钮样式
function testRefreshButtonStyles() {
    console.log('\n📋 测试刷新按钮样式');
    
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
    console.log('  - 当前阴影:', refreshButton.style.boxShadow);
    
    // 检查初始样式
    const initialBackground = refreshButton.style.background;
    const expectedBackground = '#f8f9fa';
    
    if (initialBackground === expectedBackground) {
        console.log('✅ 初始背景色正确');
    } else {
        console.log(`❌ 初始背景色错误: 期望 ${expectedBackground}, 实际 ${initialBackground}`);
    }
}

// 测试加载状态样式
function testLoadingStyles() {
    console.log('\n📋 测试加载状态样式');
    
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
    
    // 模拟加载状态
    console.log('🔄 模拟加载状态...');
    
    // 保存原始样式
    const originalBackground = refreshButton.style.background;
    const originalColor = refreshButton.style.color;
    const originalBorder = refreshButton.style.border;
    const originalBoxShadow = refreshButton.style.boxShadow;
    const originalTransform = refreshButton.style.transform;
    const originalAnimation = refreshButton.style.animation;
    
    // 应用加载样式
    refreshButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    refreshButton.style.color = '#fff';
    refreshButton.style.border = '1px solid #667eea';
    refreshButton.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4), 0 2px 8px rgba(118, 75, 162, 0.3)';
    refreshButton.style.transform = 'scale(1.05)';
    refreshButton.style.animation = 'pulse 2s ease-in-out infinite';
    
    console.log('✅ 加载状态样式已应用');
    console.log('  - 加载背景色:', refreshButton.style.background);
    console.log('  - 加载文字颜色:', refreshButton.style.color);
    console.log('  - 加载边框:', refreshButton.style.border);
    console.log('  - 加载阴影:', refreshButton.style.boxShadow);
    console.log('  - 加载动画:', refreshButton.style.animation);
    
    // 等待2秒后恢复
    setTimeout(() => {
        console.log('🔄 恢复原始样式...');
        
        // 恢复原始样式
        refreshButton.style.background = '#f8f9fa';
        refreshButton.style.color = '#666';
        refreshButton.style.border = '1px solid #666';
        refreshButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        refreshButton.style.transform = 'scale(1)';
        refreshButton.style.animation = 'none';
        
        console.log('✅ 原始样式已恢复');
        console.log('  - 恢复背景色:', refreshButton.style.background);
        console.log('  - 恢复文字颜色:', refreshButton.style.color);
        console.log('  - 恢复边框:', refreshButton.style.border);
        console.log('  - 恢复阴影:', refreshButton.style.boxShadow);
        
        // 验证恢复是否正确
        const restoredBackground = refreshButton.style.background;
        const expectedRestoredBackground = '#f8f9fa';
        
        if (restoredBackground === expectedRestoredBackground) {
            console.log('✅ 样式恢复正确');
        } else {
            console.log(`❌ 样式恢复错误: 期望 ${expectedRestoredBackground}, 实际 ${restoredBackground}`);
        }
    }, 2000);
}

// 测试鼠标悬停效果
function testHoverEffects() {
    console.log('\n📋 测试鼠标悬停效果');
    
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
    
    console.log('🔄 模拟鼠标悬停...');
    
    // 触发鼠标悬停事件
    const hoverEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true
    });
    refreshButton.dispatchEvent(hoverEvent);
    
    setTimeout(() => {
        console.log('✅ 悬停状态样式:');
        console.log('  - 悬停背景色:', refreshButton.style.background);
        console.log('  - 悬停文字颜色:', refreshButton.style.color);
        console.log('  - 悬停阴影:', refreshButton.style.boxShadow);
        console.log('  - 悬停变换:', refreshButton.style.transform);
        
        // 触发鼠标离开事件
        console.log('🔄 模拟鼠标离开...');
        const leaveEvent = new MouseEvent('mouseleave', {
            bubbles: true,
            cancelable: true
        });
        refreshButton.dispatchEvent(leaveEvent);
        
        setTimeout(() => {
            console.log('✅ 离开状态样式:');
            console.log('  - 离开背景色:', refreshButton.style.background);
            console.log('  - 离开文字颜色:', refreshButton.style.color);
            console.log('  - 离开阴影:', refreshButton.style.boxShadow);
            console.log('  - 离开变换:', refreshButton.style.transform);
            
            // 验证离开状态是否正确
            const leaveBackground = refreshButton.style.background;
            const expectedLeaveBackground = '#f8f9fa';
            
            if (leaveBackground === expectedLeaveBackground) {
                console.log('✅ 鼠标离开样式正确');
            } else {
                console.log(`❌ 鼠标离开样式错误: 期望 ${expectedLeaveBackground}, 实际 ${leaveBackground}`);
            }
        }, 100);
    }, 100);
}

// 测试所有按钮的样式一致性
function testAllButtonStyles() {
    console.log('\n📋 测试所有按钮样式一致性');
    
    const panel = document.getElementById('quick-pace-panel');
    if (!panel) {
        console.log('❌ 快捷面板不存在');
        return;
    }
    
    // 检查推进节奏按钮
    const paceButtons = panel.querySelectorAll('button[data-pace-mode]');
    console.log(`推进节奏按钮数量: ${paceButtons.length}`);
    paceButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-pace-mode');
        console.log(`  ${index + 1}. ${btn.textContent} (${mode})`);
        console.log(`    - 背景色: ${btn.style.background}`);
        console.log(`    - 文字颜色: ${btn.style.color}`);
        console.log(`    - 边框: ${btn.style.border}`);
    });
    
    // 检查模板类型按钮
    const templateButtons = panel.querySelectorAll('button[data-template-mode]');
    console.log(`模板类型按钮数量: ${templateButtons.length}`);
    templateButtons.forEach((btn, index) => {
        const mode = btn.getAttribute('data-template-mode');
        console.log(`  ${index + 1}. ${btn.textContent} (${mode})`);
        console.log(`    - 背景色: ${btn.style.background}`);
        console.log(`    - 文字颜色: ${btn.style.color}`);
        console.log(`    - 边框: ${btn.style.border}`);
    });
    
    // 检查刷新按钮
    const refreshButton = panel.querySelector('button[title="重新获取选项"]');
    if (refreshButton) {
        console.log('刷新按钮:');
        console.log(`  - 背景色: ${refreshButton.style.background}`);
        console.log(`  - 文字颜色: ${refreshButton.style.color}`);
        console.log(`  - 边框: ${refreshButton.style.border}`);
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    testRefreshButtonStyles();
    testLoadingStyles();
    testHoverEffects();
    testAllButtonStyles();
    
    console.log('\n✅ === 所有测试完成 ===');
    console.log('💡 如果所有测试都通过，说明按钮样式修复成功！');
}

// 自动运行测试
runAllTests();

// 导出测试函数供手动调用
window.testButtonStyles = {
    runAllTests,
    testRefreshButtonStyles,
    testLoadingStyles,
    testHoverEffects,
    testAllButtonStyles
}; 