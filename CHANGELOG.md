# 更新日志

## [1.2.5] - 2024-12-XX

### 🚀 新功能
- 完全移除对 TavernHelper 扩展的依赖
- 优化上下文获取逻辑，增强与 SillyTavern 原生 API 的兼容性
- 改进错误处理和诊断功能
- 新增多种提示模板类型（探索型、冲突型、情感型）
- **新增模板类型选择器**: 在快捷面板中添加6种新的模板类型按钮
- **智能模板选择**: 根据选择的模板类型自动选择合适的提示模板

### 🔧 修改
- **optionsGenerator.js**:
  - 移除 `testTavernHelper()` 函数
  - 优化 `getContextCompatible()` 函数，移除 TavernHelper 相关代码
  - 更新 `diagnoseInterfaces()` 函数，专注于 SillyTavern 原生 API
  - **修复 worldInfo 类型错误**: 确保 worldInfo 始终是数组类型
  - 增强类型安全检查，防止 `worldInfo.map is not a function` 错误

- **settings.js**:
  - 优化所有提示模板的结构和内容
  - 新增探索型模板 (EXPLORATION_PROMPTS)
  - 新增冲突型模板 (CONFLICT_PROMPTS)  
  - 新增情感型模板 (EMOTIONAL_PROMPTS)
  - 改进模板的指导性和可操作性
  - 添加 templateMode 设置选项

- **ui.js**:
  - 在快捷面板中添加6种新的模板类型按钮
  - 更新面板折叠/展开功能以支持新按钮
  - 添加模板类型按钮的状态管理
  - 优化面板布局和样式

- **optionsGenerator.js**:
  - 更新模板选择逻辑，支持新的模板类型
  - 导入新的模板类型模块
  - 根据 templateMode 自动选择合适的模板

### 🔧 修改
- **optionsGenerator.js**:
  - 移除 `testTavernHelper()` 函数
  - 优化 `getContextCompatible()` 函数，移除 TavernHelper 相关代码
  - 更新 `diagnoseInterfaces()` 函数，专注于 SillyTavern 原生 API

- **debug-tools.js**:
  - 移除 `testTavernHelperAPI()` 函数
  - 更新 `checkAvailableAPIs()` 函数，移除 TavernHelper 检查
  - 更新 `generateDiagnosticReport()` 函数，移除 TavernHelper 相关建议
  - 更新 `runFullDiagnostic()` 函数，移除 TavernHelper 测试步骤
  - 更新全局调试函数，移除 TavernHelper 相关方法

- **TROUBLESHOOTING.md**:
  - 移除所有 TavernHelper 相关的故障排除内容
  - 更新问题诊断建议，专注于 SillyTavern 原生功能
  - 更新最佳实践建议

### 🐛 修复
- 修复在某些环境下因缺少 TavernHelper 导致的错误
- 改进错误提示信息，提供更准确的诊断建议
- **修复 worldInfo 类型错误**: 解决 `TypeError: worldInfo.map is not a function` 问题
- 增强类型安全检查，确保 worldInfo 始终是数组类型

### 📝 文档
- 更新故障排除指南，移除 TavernHelper 相关内容
- 添加新的诊断命令和工具使用说明
- 新增提示模板使用指南 (PROMPT_GUIDE.md)
- 添加模板类型说明和使用技巧

### ⚠️ 重要变更
- **不再需要安装 TavernHelper 扩展**
- 扩展现在完全依赖 SillyTavern 原生 API 和 DOM 解析
- 如果之前依赖 TavernHelper 的功能，现在会自动回退到其他方案

### 🔄 兼容性
- 保持与 SillyTavern 1.9.0+ 的兼容性
- 向后兼容现有配置和设置
- 自动检测并使用可用的 API 方案

---

## [1.2.4] - 2024-12-XX

### 🚀 新功能
- 添加选项生成功能
- 支持多种推进节奏模式
- 集成 AI 模型 API 支持

### 🔧 修改
- 初始版本发布
- 基础功能实现

---

**注意**: 版本 1.2.5 是一个重要的更新，完全移除了对 TavernHelper 扩展的依赖，使扩展更加独立和稳定。 