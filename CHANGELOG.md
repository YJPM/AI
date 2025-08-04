# 更新日志

## 版本 1.2.5 (2025-08-04)

### 🔧 修复
- **修复了扩展加载错误**：解决了 `GET http://127.0.0.1:8001/scripts/extensions/third-party/AI/proxy-system.js,index.js net::ERR_ABORTED 404 (Not Found)` 错误
- **合并代理系统代码**：将 `proxy-system.js` 的内容合并到 `index.js` 中，解决了SillyTavern不支持多JS文件的问题
- **更新manifest.json**：将 `js` 字段从数组格式改为单文件格式
- **修复API配置问题**：解决了API URL中出现"undefined"的问题，修复了设置字段名称不一致的问题

### ✨ 新增功能
- **代理系统集成**：基于 `dark-server.js` 和 `dark-browser.js` 的完整代理系统
- **CORS绕过**：通过本地代理服务器绕过浏览器CORS限制
- **流式响应支持**：支持流式响应处理，提供更好的用户体验
- **自动重连机制**：WebSocket连接断开时自动重连
- **错误处理**：完善的错误处理和日志记录
- **服务器管理工具**：提供便捷的代理服务器启动、停止、重启和状态检查功能
- **集成测试工具**：完整的系统集成测试页面，支持功能验证和诊断

### 📁 新增文件
- `package.json` - Node.js依赖配置
- `start-proxy.bat` - Windows启动脚本
- `manage-proxy.bat` - 代理服务器管理工具
- `test-proxy.html` - 代理系统测试页面
- `test-integration.html` - 完整集成测试页面
- `fix-api-config.js` - API配置快速修复脚本
- `CHANGELOG.md` - 更新日志

### 🔄 修改的文件
- `manifest.json` - 修复JS文件加载问题
- `index.js` - 集成代理系统代码
- `settings.js` - 添加代理系统设置
- `ui.js` - 添加代理系统设置界面
- `optionsGenerator.js` - 集成代理系统功能
- `README.md` - 更新文档说明

### 🗑️ 删除文件
- `proxy-system.js` - 已合并到 `index.js`

### 🎯 解决的问题
- **CORS限制**：通过本地代理服务器绕过浏览器CORS限制
- **500错误**：使用扩展的API配置替代SillyTavern的内部API调用
- **Gemini API支持**：现在可以直接调用Google Gemini API
- **扩展加载错误**：修复了SillyTavern无法加载多JS文件的问题

### 📋 使用说明
1. 启动代理服务器：`node dark-server.js` 或运行 `start-proxy.bat`
2. 在扩展设置中启用"代理系统"选项
3. 确保API拦截器也已启用
4. 使用 `test-proxy.html` 测试代理系统功能

### 🔍 诊断工具
在浏览器控制台可以使用：
- `OptionsGenerator.initializeProxySystem()` - 初始化代理系统
- `OptionsGenerator.stopProxySystem()` - 停止代理系统
- `OptionsGenerator.diagnoseApiConfiguration()` - 诊断API配置 