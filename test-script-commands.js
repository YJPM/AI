// 测试脚本：验证 SillyTavern 脚本命令获取功能
// 在浏览器控制台中运行此脚本来测试新功能

console.log('🧪 === 开始测试 SillyTavern 脚本命令获取功能 ===');

// 测试角色信息获取
function testCharacterInfoRetrieval() {
    console.log('\n📋 测试角色信息获取');
    
    // 检查 getcharbook 命令
    if (typeof window.getcharbook === 'function') {
        console.log('✅ getcharbook 命令可用');
        try {
            const charBook = window.getcharbook();
            if (charBook) {
                console.log('✅ 通过 getcharbook 获取到角色信息:');
                console.log('  - 名称:', charBook.name || '未设置');
                console.log('  - 描述:', charBook.description ? charBook.description.substring(0, 100) + '...' : '未设置');
                console.log('  - 人格:', charBook.personality ? charBook.personality.substring(0, 100) + '...' : '未设置');
                console.log('  - 场景:', charBook.scenario ? charBook.scenario.substring(0, 100) + '...' : '未设置');
                console.log('  - 首条消息:', charBook.first_mes ? charBook.first_mes.substring(0, 100) + '...' : '未设置');
                console.log('  - 对话示例:', charBook.mes_example ? charBook.mes_example.substring(0, 100) + '...' : '未设置');
            } else {
                console.log('⚠️ getcharbook 返回空值');
            }
        } catch (error) {
            console.error('❌ getcharbook 执行失败:', error);
        }
    } else {
        console.log('❌ getcharbook 命令不可用');
    }
    
    // 检查 window.character
    if (window.character) {
        console.log('✅ window.character 可用');
        const char = window.character;
        console.log('  - 名称:', char.name || '未设置');
        console.log('  - 描述:', char.description ? char.description.substring(0, 100) + '...' : '未设置');
        console.log('  - 人格:', char.personality ? char.personality.substring(0, 100) + '...' : '未设置');
    } else {
        console.log('❌ window.character 不可用');
    }
}

// 测试世界书信息获取
function testWorldInfoRetrieval() {
    console.log('\n📋 测试世界书信息获取');
    
    // 检查 getchatbook 命令
    if (typeof window.getchatbook === 'function') {
        console.log('✅ getchatbook 命令可用');
        try {
            const chatBook = window.getchatbook();
            if (chatBook && Array.isArray(chatBook)) {
                console.log(`✅ 通过 getchatbook 获取到世界书信息，数量: ${chatBook.length}`);
                chatBook.forEach((book, index) => {
                    console.log(`  世界书 ${index + 1}:`);
                    console.log('    - 标题:', book.title || '未命名');
                    console.log('    - 内容:', book.content ? book.content.substring(0, 100) + '...' : '无内容');
                    console.log('    - 关键词:', book.keys || '无关键词');
                    console.log('    - 优先级:', book.priority || '默认');
                });
            } else {
                console.log('⚠️ getchatbook 返回空值或非数组');
            }
        } catch (error) {
            console.error('❌ getchatbook 执行失败:', error);
        }
    } else {
        console.log('❌ getchatbook 命令不可用');
    }
    
    // 检查 getpersonabook 命令
    if (typeof window.getpersonabook === 'function') {
        console.log('✅ getpersonabook 命令可用');
        try {
            const personaBook = window.getpersonabook();
            if (personaBook && Array.isArray(personaBook)) {
                console.log(`✅ 通过 getpersonabook 获取到世界书信息，数量: ${personaBook.length}`);
                personaBook.forEach((book, index) => {
                    console.log(`  世界书 ${index + 1}:`);
                    console.log('    - 标题:', book.title || '未命名');
                    console.log('    - 内容:', book.content ? book.content.substring(0, 100) + '...' : '无内容');
                });
            } else {
                console.log('⚠️ getpersonabook 返回空值或非数组');
            }
        } catch (error) {
            console.error('❌ getpersonabook 执行失败:', error);
        }
    } else {
        console.log('❌ getpersonabook 命令不可用');
    }
    
    // 检查 getglobalbooks 命令
    if (typeof window.getglobalbooks === 'function') {
        console.log('✅ getglobalbooks 命令可用');
        try {
            const globalBooks = window.getglobalbooks();
            if (globalBooks && Array.isArray(globalBooks)) {
                console.log(`✅ 通过 getglobalbooks 获取到世界书信息，数量: ${globalBooks.length}`);
                globalBooks.forEach((book, index) => {
                    console.log(`  世界书 ${index + 1}:`);
                    console.log('    - 标题:', book.title || '未命名');
                    console.log('    - 内容:', book.content ? book.content.substring(0, 100) + '...' : '无内容');
                });
            } else {
                console.log('⚠️ getglobalbooks 返回空值或非数组');
            }
        } catch (error) {
            console.error('❌ getglobalbooks 执行失败:', error);
        }
    } else {
        console.log('❌ getglobalbooks 命令不可用');
    }
    
    // 检查 window.world_info
    if (window.world_info) {
        console.log('✅ window.world_info 可用');
        if (Array.isArray(window.world_info)) {
            console.log(`  - 世界书数量: ${window.world_info.length}`);
            window.world_info.forEach((book, index) => {
                console.log(`  世界书 ${index + 1}:`);
                console.log('    - 标题:', book.title || '未命名');
                console.log('    - 内容:', book.content ? book.content.substring(0, 100) + '...' : '无内容');
            });
        } else {
            console.log('⚠️ window.world_info 不是数组格式');
        }
    } else {
        console.log('❌ window.world_info 不可用');
    }
}

// 测试消息历史获取
function testMessageHistoryRetrieval() {
    console.log('\n📋 测试消息历史获取');
    
    // 检查 messages 命令
    if (typeof window.messages === 'function') {
        console.log('✅ messages 命令可用');
        try {
            const messageHistory = window.messages();
            if (messageHistory && Array.isArray(messageHistory)) {
                console.log(`✅ 通过 messages 命令获取到消息历史，数量: ${messageHistory.length}`);
                // 显示最近几条消息
                const recentMessages = messageHistory.slice(-3);
                recentMessages.forEach((msg, index) => {
                    console.log(`  消息 ${messageHistory.length - 2 + index}:`);
                    console.log('    - 角色:', msg.role || '未知');
                    console.log('    - 内容:', msg.content ? msg.content.substring(0, 100) + '...' : '无内容');
                });
            } else {
                console.log('⚠️ messages 返回空值或非数组');
            }
        } catch (error) {
            console.error('❌ messages 执行失败:', error);
        }
    } else {
        console.log('❌ messages 命令不可用');
    }
    
    // 检查 window.chat
    if (window.chat && Array.isArray(window.chat)) {
        console.log(`✅ window.chat 可用，消息数量: ${window.chat.length}`);
        // 显示最近几条消息
        const recentChat = window.chat.slice(-3);
        recentChat.forEach((msg, index) => {
            console.log(`  消息 ${window.chat.length - 2 + index}:`);
            console.log('    - 角色:', msg.role || '未知');
            console.log('    - 内容:', msg.content ? msg.content.substring(0, 100) + '...' : '无内容');
        });
    } else {
        console.log('❌ window.chat 不可用或不是数组');
    }
}

// 测试其他有用的脚本命令
function testOtherScriptCommands() {
    console.log('\n📋 测试其他脚本命令');
    
    // 检查 findentry 命令
    if (typeof window.findentry === 'function') {
        console.log('✅ findentry 命令可用');
        try {
            // 尝试查找一些常见的条目
            const testEntries = ['character', 'world', 'setting', 'background'];
            testEntries.forEach(entry => {
                try {
                    const result = window.findentry(entry);
                    if (result) {
                        console.log(`  - 找到条目 "${entry}":`, result.title || '未命名');
                    }
                } catch (error) {
                    // 忽略单个条目的错误
                }
            });
        } catch (error) {
            console.log('⚠️ findentry 测试失败:', error.message);
        }
    } else {
        console.log('❌ findentry 命令不可用');
    }
    
    // 检查 world 命令
    if (typeof window.world === 'function') {
        console.log('✅ world 命令可用');
        try {
            const worldStatus = window.world();
            console.log('  - 世界书状态:', worldStatus);
        } catch (error) {
            console.log('⚠️ world 命令执行失败:', error.message);
        }
    } else {
        console.log('❌ world 命令不可用');
    }
}

// 模拟 getContextCompatible 函数的行为
function testContextCompatibleLogic() {
    console.log('\n📋 测试上下文获取逻辑');
    
    let characterInfo = null;
    let worldInfo = null;
    let messages = [];
    
    // 模拟角色信息获取逻辑
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
                console.log('✅ 模拟角色信息获取成功');
            }
        } catch (error) {
            console.log('❌ 模拟角色信息获取失败:', error.message);
        }
    }
    
    // 模拟世界书信息获取逻辑
    if (typeof window.getchatbook === 'function') {
        try {
            const chatBook = window.getchatbook();
            if (chatBook && Array.isArray(chatBook) && chatBook.length > 0) {
                worldInfo = chatBook;
                console.log('✅ 模拟世界书信息获取成功，数量:', worldInfo.length);
            }
        } catch (error) {
            console.log('❌ 模拟世界书信息获取失败:', error.message);
        }
    }
    
    // 模拟消息历史获取逻辑
    if (typeof window.messages === 'function') {
        try {
            const messageHistory = window.messages();
            if (messageHistory && Array.isArray(messageHistory) && messageHistory.length > 0) {
                messages = messageHistory.slice(-5); // 限制为最近5条
                console.log('✅ 模拟消息历史获取成功，数量:', messages.length);
            }
        } catch (error) {
            console.log('❌ 模拟消息历史获取失败:', error.message);
        }
    }
    
    // 显示模拟结果
    console.log('\n📊 模拟结果汇总:');
    console.log('  - 角色信息:', !!characterInfo);
    console.log('  - 世界书数量:', worldInfo ? worldInfo.length : 0);
    console.log('  - 消息数量:', messages.length);
    
    if (characterInfo) {
        console.log('  - 角色名称:', characterInfo.name);
    }
    
    if (worldInfo && worldInfo.length > 0) {
        console.log('  - 世界书标题:', worldInfo.map(w => w.title || '未命名').join(', '));
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    testCharacterInfoRetrieval();
    testWorldInfoRetrieval();
    testMessageHistoryRetrieval();
    testOtherScriptCommands();
    testContextCompatibleLogic();
    
    console.log('\n✅ === 所有测试完成 ===');
    console.log('💡 如果大部分测试都通过，说明 SillyTavern 脚本命令功能正常！');
    console.log('📚 参考文档: https://rentry.org/sillytavern-script-book#getcharbook');
}

// 自动运行测试
runAllTests();

// 导出测试函数供手动调用
window.testScriptCommands = {
    runAllTests,
    testCharacterInfoRetrieval,
    testWorldInfoRetrieval,
    testMessageHistoryRetrieval,
    testOtherScriptCommands,
    testContextCompatibleLogic
}; 