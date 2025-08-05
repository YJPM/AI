# AI智能助手 - 故障排除指南

## 🔍 常见问题诊断

### 问题1: 无法获取角色设定信息

**症状**: 控制台显示 "❌ 未找到角色设定信息"

**可能原因**:
1. 未加载角色卡
2. SillyTavern版本不兼容
3. API权限问题

**解决方案**:

#### 方案1: 确保加载角色卡
1. 在SillyTavern中加载一个角色卡
2. 确保角色卡包含基本信息（名称、描述等）
3. 重新尝试生成选项

#### 方案2: 检查API权限
1. 确保SillyTavern正常运行
2. 检查浏览器控制台是否有错误信息
3. 重启SillyTavern
4. 重新尝试生成选项

#### 方案3: 手动检查角色信息
在浏览器控制台中运行以下命令：
```javascript
// 检查SillyTavern API
console.log('SillyTavern:', window.SillyTavern);

// 检查DOM中的角色元素
console.log('角色元素:', document.querySelector('#character_info, .character_info, .char_name'));
```

### 问题2: 无法获取世界书信息

**症状**: 控制台显示 "❌ 未找到世界书信息"

**可能原因**:
1. 未创建或加载世界书
2. 世界书格式不兼容
3. API权限问题

**解决方案**:

#### 方案1: 创建世界书
1. 在SillyTavern中创建世界书
2. 确保世界书包含标题和内容
3. 保存并重新加载

#### 方案2: 检查世界书格式
确保世界书包含以下字段：
- `title`: 世界书标题
- `content`: 世界书内容
- `keys`: 关键词（可选）
- `priority`: 优先级（可选）

#### 方案3: 使用调试工具
在控制台中运行：
```javascript
// 运行完整诊断
window.debugAIAssistant.runDiagnostic();

// 或单独检查世界书
window.debugAIAssistant.checkDOM();
```

### 问题3: 无法获取消息历史

**症状**: 控制台显示 "❌ SillyTavern.getContext() 未返回消息数据"

**可能原因**:
1. 聊天记录为空
2. API调用失败
3. 权限问题

**解决方案**:

#### 方案1: 确保有聊天记录
1. 与AI进行一些对话
2. 确保对话记录已保存
3. 重新尝试生成选项

#### 方案2: 检查API状态
在控制台中运行：
```javascript
// 测试SillyTavern API
window.debugAIAssistant.testSillyTavern();
```

#### 方案3: 手动获取消息
```javascript
// 检查DOM中的消息元素
const messages = document.querySelectorAll('#chat .mes, .message');
console.log('找到消息数量:', messages.length);
messages.forEach((msg, index) => {
    console.log(`消息 ${index + 1}:`, msg.textContent.substring(0, 100));
});
```

## 🛠️ 调试工具使用

### 自动诊断
当启用调试模式时，扩展会自动运行诊断。在设置中确保"调试"选项已启用。

### 手动诊断
在浏览器控制台中运行以下命令：

```javascript
// 运行完整诊断
window.debugAIAssistant.runDiagnostic();

// 检查API可用性
window.debugAIAssistant.checkAPIs();

// 检查DOM结构
window.debugAIAssistant.checkDOM();

// 测试特定API
window.debugAIAssistant.testSillyTavern();

// 生成诊断报告
window.debugAIAssistant.generateReport();
```

### 诊断报告解读

诊断报告包含以下信息：

```javascript
{
    timestamp: "2024-12-XX...", // 诊断时间
    userAgent: "...", // 浏览器信息
    url: "...", // 当前页面URL
    apis: {
        SillyTavern: { available: true/false, methods: [...] }
    },
    dom: {
        character: { found: true/false, count: 0 },
        worldbook: { found: true/false, count: 0 },
        messages: { found: true/false, count: 0 }
    },
    recommendations: ["建议1", "建议2"] // 改进建议
}
```

## 🔧 高级故障排除

### 检查SillyTavern版本
确保使用兼容的SillyTavern版本：
- 推荐版本: 1.10.0 或更高
- 最低版本: 1.9.0

### 检查扩展冲突
1. 禁用其他可能冲突的扩展
2. 逐个启用扩展，找出冲突源
3. 更新冲突的扩展到最新版本

### 清除缓存
1. 清除浏览器缓存
2. 清除SillyTavern本地存储
3. 重新加载页面

### 检查网络连接
1. 确保网络连接正常
2. 检查防火墙设置
3. 尝试使用不同的网络

## 📞 获取帮助

如果问题仍然存在，请：

1. **收集诊断信息**:
   ```javascript
   const report = window.debugAIAssistant.generateReport();
   console.log(JSON.stringify(report, null, 2));
   ```

2. **截图错误信息**: 包含控制台错误和页面状态

3. **提供环境信息**:
   - SillyTavern版本
   - 浏览器版本
   - 操作系统
   - 已安装的扩展列表

4. **提交Issue**: 在GitHub仓库中提交详细的问题报告

## 🎯 最佳实践

### 推荐配置
1. **确保SillyTavern正常运行**: 提供API支持
2. **启用调试模式**: 便于问题诊断
3. **定期更新**: 保持扩展和SillyTavern为最新版本
4. **备份设置**: 定期备份重要配置

### 性能优化
1. **限制消息数量**: 在设置中调整消息限制
2. **使用流式生成**: 启用流式选项生成
3. **合理设置API**: 选择合适的API和模型

### 安全建议
1. **保护API密钥**: 不要在公开场合分享API密钥
2. **定期更换密钥**: 定期更新API密钥
3. **监控使用量**: 关注API使用情况

---

**最后更新**: 2024年12月  
**版本**: 1.2.4 