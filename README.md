# AI助手扩展

一个为SillyTavern设计的智能AI助手扩展，提供打字指示器和智能回复选项生成功能。

## 功能特性

- ✅ **打字指示器**: 显示AI正在输入的状态
- ✅ **智能选项生成**: 基于对话上下文生成回复选项
- ✅ **自动触发**: 当最后一条消息为AI回复时自动生成选项
- ✅ **多API支持**: 支持OpenAI兼容API和Google Gemini
- ✅ **模板系统**: 可自定义的提示模板
- ✅ **调试日志**: 详细的调试信息记录
- ✅ **设置管理**: 完整的设置界面

## 项目架构

### 目录结构
```
AI/
├── index.js                 # 主入口文件
├── manifest.json            # 扩展清单
├── README.md               # 项目文档
├── LICENSE                 # 许可证
└── src/                    # 源代码目录
    ├── config/             # 配置文件
    │   └── constants.js    # 常量定义
    ├── core/               # 核心功能
    │   ├── settings.js     # 设置管理
    │   ├── api-manager.js  # API管理
    │   ├── context-manager.js # 上下文管理
    │   └── event-manager.js # 事件管理
    ├── components/         # 组件
    │   ├── options-generator.js # 选项生成器
    │   └── ui-manager.js   # UI管理
    └── utils/              # 工具类
        └── logger.js       # 日志工具
```

### 核心模块

#### 1. 配置管理 (`src/config/constants.js`)
- 定义所有常量和默认设置
- 集中管理API端点、UI配置、事件类型等

#### 2. 设置管理 (`src/core/settings.js`)
- 处理扩展设置的加载、保存和验证
- 提供设置更新和重置功能

#### 3. API管理 (`src/core/api-manager.js`)
- 支持多种API提供商（OpenAI、Gemini）
- 统一的API调用接口
- 错误处理和重试机制

#### 4. 上下文管理 (`src/core/context-manager.js`)
- 获取聊天上下文、角色信息、世界设定
- 处理模板占位符替换
- 检查消息来源

#### 5. 事件管理 (`src/core/event-manager.js`)
- 统一的事件监听和分发
- 自动触发选项生成
- 事件清理机制

#### 6. 选项生成器 (`src/components/options-generator.js`)
- 生成和解析回复选项
- 支持多种解析格式（【】、列表等）
- 状态管理和错误处理

#### 7. UI管理 (`src/components/ui-manager.js`)
- 打字指示器显示/隐藏
- 选项按钮创建和动画
- 设置界面生成
- 样式注入和管理

#### 8. 日志工具 (`src/utils/logger.js`)
- 分级日志记录
- 性能监控
- 调试模式支持

## 使用方法

### 1. 安装扩展
将整个扩展文件夹复制到SillyTavern的扩展目录中。

### 2. 配置设置
1. 在SillyTavern设置中找到"AI助手"扩展
2. 启用"回复选项生成"功能
3. 配置API类型和密钥
4. 设置模型名称和基础URL（如需要）

### 3. 使用功能
- **打字指示器**: 自动显示AI输入状态
- **选项生成**: 当AI回复后自动生成回复选项
- **选项使用**: 点击选项按钮将内容填入输入框

## API配置

### OpenAI兼容API
```json
{
  "optionsApiType": "openai",
  "optionsApiKey": "your-api-key",
  "optionsApiModel": "gpt-4o-mini",
  "optionsBaseUrl": "https://api.openai.com/v1"
}
```

### Google Gemini API
```json
{
  "optionsApiType": "gemini",
  "optionsApiKey": "your-api-key",
  "optionsApiModel": "gemini-2.0-flash-exp"
}
```

## 模板系统

扩展使用可自定义的提示模板，支持以下占位符：

- `{{user_input}}`: 用户当前输入
- `{{char_card}}`: 角色卡信息
- `{{world_info}}`: 世界设定信息
- `{{context}}`: 对话上下文

## 开发指南

### 添加新的API提供商
1. 在 `src/core/api-manager.js` 中创建新的Provider类
2. 实现 `generate` 方法
3. 在 `APIManager` 构造函数中注册

### 添加新的UI组件
1. 在 `src/components/` 中创建新的组件类
2. 在 `src/components/ui-manager.js` 中集成
3. 添加相应的样式定义

### 添加新的事件处理
1. 在 `src/config/constants.js` 中定义事件类型
2. 在 `src/core/event-manager.js` 中添加事件处理逻辑

## 技术特点

### 1. 模块化设计
- 清晰的职责分离
- 易于维护和扩展
- 松耦合的组件架构

### 2. 错误处理
- 完善的异常捕获
- 详细的错误日志
- 优雅的降级处理

### 3. 性能优化
- 异步操作处理
- 缓存机制
- 按需加载

### 4. 向后兼容
- 保持原有API接口
- 全局变量兼容
- 渐进式升级

## 调试

启用调试模式后，可以在浏览器控制台查看详细的日志信息：

```javascript
// 查看扩展状态
console.log(window.AIAssistantExtension.getStatus());

// 手动触发选项生成
window.generateOptions();
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个扩展。
