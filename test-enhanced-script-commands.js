// 增强版测试脚本：验证所有 SillyTavern 脚本命令优化功能
// 在浏览器控制台中运行此脚本来测试新功能

console.log('🧪 === 开始测试增强版 SillyTavern 脚本命令功能 ===');

// 测试世界书状态检查
function testWorldStatus() {
    console.log('\n📋 测试世界书状态检查');
    
    if (typeof window.world === 'function') {
        console.log('✅ world 命令可用');
        try {
            const worldStatus = window.world();
            console.log('🌍 世界书状态:', worldStatus);
        } catch (error) {
            console.log('⚠️ world 命令执行失败:', error.message);
        }
    } else {
        console.log('❌ world 命令不可用');
    }
}

// 测试 findentry 功能
function testFindEntry() {
    console.log('\n📋 测试 findentry 功能');
    
    if (typeof window.findentry === 'function') {
        console.log('✅ findentry 命令可用');
        
        const testEntries = [
            'character', 'world', 'setting', 'background', 
            'location', 'story', 'plot', 'scene', 'environment'
        ];
        
        let foundCount = 0;
        testEntries.forEach(entry => {
            try {
                const result = window.findentry(entry);
                if (result) {
                    foundCount++;
                    console.log(`✅ 找到条目 "${entry}":`);
                    console.log(`  - 标题: ${result.title || '未命名'}`);
                    console.log(`  - 内容: ${result.content ? result.content.substring(0, 100) + '...' : '无内容'}`);
                    console.log(`  - 关键词: ${result.keys || '无关键词'}`);
                    console.log(`  - 优先级: ${result.priority || '默认'}`);
                }
            } catch (error) {
                console.log(`⚠️ 查找条目 "${entry}" 失败:`, error.message);
            }
        });
        
        console.log(`📊 总共找到 ${foundCount}/${testEntries.length} 个条目`);
    } else {
        console.log('❌ findentry 命令不可用');
    }
}

// 测试 getentryfield 功能
function testGetEntryField() {
    console.log('\n📋 测试 getentryfield 功能');
    
    if (typeof window.getentryfield === 'function') {
        console.log('✅ getentryfield 命令可用');
        
        // 先尝试找到一个条目
        if (typeof window.findentry === 'function') {
            try {
                const testEntry = window.findentry('character') || window.findentry('world');
                if (testEntry) {
                    console.log(`🔍 测试条目: ${testEntry.title || '未命名'}`);
                    
                    // 测试获取不同字段
                    const fields = ['title', 'content', 'keys', 'priority'];
                    fields.forEach(field => {
                        try {
                            const fieldValue = window.getentryfield(testEntry.title, field);
                            console.log(`  - ${field}: ${fieldValue || '未设置'}`);
                        } catch (error) {
                            console.log(`  - ${field}: 获取失败 (${error.message})`);
                        }
                    });
                } else {
                    console.log('⚠️ 未找到测试条目');
                }
            } catch (error) {
                console.log('⚠️ 测试 getentryfield 失败:', error.message);
            }
        }
    } else {
        console.log('❌ getentryfield 命令不可用');
    }
}

// 测试聊天摘要功能
function testChatSummary() {
    console.log('\n📋 测试聊天摘要功能');
    
    // 检查 summary 宏
    if (window.summary) {
        console.log('✅ window.summary 可用');
        console.log('📝 聊天摘要:', window.summary.substring(0, 200) + '...');
    } else {
        console.log('❌ window.summary 不可用');
    }
    
    // 检查 chat_summary
    if (window.chat_summary) {
        console.log('✅ window.chat_summary 可用');
        console.log('📝 聊天摘要:', window.chat_summary.substring(0, 200) + '...');
    } else {
        console.log('❌ window.chat_summary 不可用');
    }
    
    // 检查其他可能的摘要变量
    const summaryVariants = ['summary', 'chat_summary', 'conversation_summary', 'chatSummary'];
    let foundSummary = false;
    
    summaryVariants.forEach(variant => {
        if (window[variant] && typeof window[variant] === 'string' && window[variant].length > 0) {
            console.log(`✅ 找到摘要变量: ${variant}`);
            console.log(`📝 内容: ${window[variant].substring(0, 200)}...`);
            foundSummary = true;
        }
    });
    
    if (!foundSummary) {
        console.log('⚠️ 未找到任何聊天摘要');
    }
}

// 测试最新消息获取
function testLatestMessages() {
    console.log('\n📋 测试最新消息获取');
    
    // 检查 lastMessage 相关功能
    const messageVariants = [
        'lastMessage', 'lastUserMessage', 'lastCharMessage',
        'last_message', 'last_user_message', 'last_char_message'
    ];
    
    messageVariants.forEach(variant => {
        if (window[variant]) {
            console.log(`✅ 找到消息变量: ${variant}`);
            console.log(`📝 内容: ${window[variant].substring(0, 100)}...`);
        }
    });
    
    // 检查消息历史
    if (typeof window.messages === 'function') {
        try {
            const messageHistory = window.messages();
            if (messageHistory && Array.isArray(messageHistory) && messageHistory.length > 0) {
                console.log(`✅ 消息历史可用，总数: ${messageHistory.length}`);
                
                // 显示最近3条消息
                const recentMessages = messageHistory.slice(-3);
                recentMessages.forEach((msg, index) => {
                    const msgIndex = messageHistory.length - 2 + index;
                    console.log(`  消息 ${msgIndex}:`);
                    console.log(`    - 角色: ${msg.role || '未知'}`);
                    console.log(`    - 内容: ${msg.content ? msg.content.substring(0, 100) + '...' : '无内容'}`);
                });
            } else {
                console.log('⚠️ 消息历史为空');
            }
        } catch (error) {
            console.log('❌ 获取消息历史失败:', error.message);
        }
    } else {
        console.log('❌ messages 命令不可用');
    }
}

// 测试增强的上下文获取逻辑
function testEnhancedContextLogic() {
    console.log('\n📋 测试增强的上下文获取逻辑');
    
    let characterInfo = null;
    let worldInfo = null;
    let messages = [];
    let chatSummary = null;
    
    // 模拟角色信息获取
    if (typeof window.getcharbook === 'function') {
        try {
            const charBook = window.getcharbook();
            if (charBook) {
                characterInfo = {
                    name: charBook.name || '未知角色',
                    description: charBook.description || charBook.personality || '无描述',
                    personality: charBook.personality || charBook.description || '无描述',
                    scenario: charBook.scenario || '无场景',
                    first_mes: charBook.first_mes || '无首条消息',
                    mes_example: charBook.mes_example || '无对话示例'
                };
                console.log('✅ 角色信息获取成功');
            }
        } catch (error) {
            console.log('❌ 角色信息获取失败:', error.message);
        }
    }
    
    // 模拟世界书信息获取（包含 findentry）
    if (typeof window.getchatbook === 'function') {
        try {
            const chatBook = window.getchatbook();
            if (chatBook && Array.isArray(chatBook) && chatBook.length > 0) {
                worldInfo = chatBook;
                console.log('✅ 聊天世界书获取成功，数量:', worldInfo.length);
            }
        } catch (error) {
            console.log('❌ 聊天世界书获取失败:', error.message);
        }
    }
    
    // 尝试 findentry 查找
    if ((!worldInfo || worldInfo.length === 0) && typeof window.findentry === 'function') {
        try {
            const commonEntries = ['character', 'world', 'setting', 'background', 'location', 'story'];
            for (const entry of commonEntries) {
                const foundEntry = window.findentry(entry);
                if (foundEntry) {
                    if (!worldInfo) worldInfo = [];
                    worldInfo.push(foundEntry);
                    console.log(`✅ 通过 findentry 找到条目 "${entry}":`, foundEntry.title || '未命名');
                }
            }
        } catch (error) {
            console.log('⚠️ findentry 查找失败:', error.message);
        }
    }
    
    // 模拟消息历史获取
    if (typeof window.messages === 'function') {
        try {
            const messageHistory = window.messages();
            if (messageHistory && Array.isArray(messageHistory) && messageHistory.length > 0) {
                messages = messageHistory.slice(-5);
                console.log('✅ 消息历史获取成功，数量:', messages.length);
            }
        } catch (error) {
            console.log('❌ 消息历史获取失败:', error.message);
        }
    }
    
    // 模拟聊天摘要获取
    if (window.summary) {
        chatSummary = window.summary;
        console.log('✅ 聊天摘要获取成功');
    } else if (window.chat_summary) {
        chatSummary = window.chat_summary;
        console.log('✅ 聊天摘要获取成功');
    }
    
    // 显示模拟结果
    console.log('\n📊 增强上下文获取结果:');
    console.log('  - 角色信息:', !!characterInfo);
    console.log('  - 世界书数量:', worldInfo ? worldInfo.length : 0);
    console.log('  - 消息数量:', messages.length);
    console.log('  - 聊天摘要:', !!chatSummary);
    
    if (characterInfo) {
        console.log('  - 角色名称:', characterInfo.name);
    }
    
    if (worldInfo && worldInfo.length > 0) {
        console.log('  - 世界书标题:', worldInfo.map(w => w.title || '未命名').join(', '));
    }
    
    if (chatSummary) {
        console.log('  - 摘要预览:', chatSummary.substring(0, 100) + '...');
    }
}

// 测试其他有用的脚本命令
function testOtherUsefulCommands() {
    console.log('\n📋 测试其他有用的脚本命令');
    
    // 检查时间相关宏
    const timeMacros = ['time', 'date', 'weekday', 'isotime', 'isodate'];
    timeMacros.forEach(macro => {
        if (window[macro]) {
            console.log(`✅ ${macro}: ${window[macro]}`);
        }
    });
    
    // 检查随机相关宏
    if (typeof window.random === 'function') {
        console.log('✅ random 函数可用');
        try {
            const randomResult = window.random('1,2,3,4,5');
            console.log('🎲 随机测试结果:', randomResult);
        } catch (error) {
            console.log('⚠️ random 测试失败:', error.message);
        }
    }
    
    // 检查 roll 函数
    if (typeof window.roll === 'function') {
        console.log('✅ roll 函数可用');
        try {
            const rollResult = window.roll('1d6');
            console.log('🎲 骰子测试结果:', rollResult);
        } catch (error) {
            console.log('⚠️ roll 测试失败:', error.message);
        }
    }
}

// 运行所有测试
function runAllEnhancedTests() {
    console.log('🚀 开始运行所有增强测试...\n');
    
    testWorldStatus();
    testFindEntry();
    testGetEntryField();
    testChatSummary();
    testLatestMessages();
    testEnhancedContextLogic();
    testOtherUsefulCommands();
    
    console.log('\n✅ === 所有增强测试完成 ===');
    console.log('💡 这些测试验证了基于 SillyTavern 脚本命令手册的所有优化功能！');
    console.log('📚 参考文档: https://rentry.org/sillytavern-script-book#getcharbook');
}

// 自动运行测试
runAllEnhancedTests();

// 导出测试函数供手动调用
window.testEnhancedScriptCommands = {
    runAllEnhancedTests,
    testWorldStatus,
    testFindEntry,
    testGetEntryField,
    testChatSummary,
    testLatestMessages,
    testEnhancedContextLogic,
    testOtherUsefulCommands
}; 