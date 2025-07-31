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

### 现代化开发架构

本项目采用现代化的开发架构，参考了 [SillyTavern Prompt Template](https://codeberg.org/zonde306/ST-Prompt-Template) 的项目结构：

```
AI/
├── src/                    # 源代码目录
│   ├── config/            # 配置文件
│   │   └── constants.js   # 常量定义
│   ├── core/              # 核心功能
│   │   ├── settings.js    # 设置管理
│   │   ├── api-manager.js # API管理
│   │   ├── context-manager.js # 上下文管理
│   │   └── event-manager.js # 事件管理
│   ├── components/        # 组件
│   │   ├── options-generator.js # 选项生成器
│   │   └── ui-manager.js  # UI管理
│   ├── utils/             # 工具类
│   │   └── logger.js      # 日志工具
│   └── index.js           # 主入口文件
├── dist/                  # 编译输出目录
├── package.json           # 项目配置
├── webpack.config.js      # Webpack配置
├── babel.config.json      # Babel配置
├── manifest.json          # 扩展清单
├── README.md              # 项目文档
└── LICENSE                # 许可证
```

### 技术栈

- **构建工具**: Webpack + Babel
- **模块系统**: ES6 Modules
- **代码转换**: Babel (ES6+ → ES5)
- **开发体验**: 热重载、源码映射

### 开发优势

1. **现代化开发**: 使用ES6+语法，通过构建工具编译成兼容代码
2. **模块化设计**: 清晰的代码组织结构，易于维护和扩展
3. **开发体验**: 支持热重载、源码映射等现代开发特性
4. **兼容性**: 编译后的代码兼容所有浏览器

## 开发指南

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

这将启动开发模式，监听文件变化并自动重新编译。

### 生产构建

```bash
npm run build
```

这将生成优化后的生产代码到 `dist/` 目录。

### 清理构建

```bash
npm run clean
```

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

## 参考项目

本项目参考了 [SillyTavern Prompt Template](https://codeberg.org/zonde306/ST-Prompt-Template) 的项目架构，感谢其开源贡献。
