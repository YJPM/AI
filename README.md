# AI助手扩展

一个功能丰富的SillyTavern扩展，提供打字指示器和智能选项生成功能。

## 功能特性

- **打字指示器**: 在AI生成回复时显示"正在输入"提示
- **智能选项生成**: 基于对话上下文自动生成回复选项
- **多API支持**: 支持OpenAI和Google Gemini API
- **可定制设置**: 丰富的配置选项和重置功能
- **模块化架构**: 采用现代JavaScript模块化设计

## 项目结构

```
src/
├── core/                 # 核心模块
│   ├── constants.js      # 常量定义
│   ├── settings.js       # 设置管理
│   └── logger.js         # 日志系统
├── features/             # 功能模块
│   ├── typing-indicator.js   # 打字指示器
│   └── options-generator.js  # 选项生成器
├── ui/                   # 用户界面
│   ├── settings-panel.js # 设置面板
│   └── styles.js         # 样式管理
├── utils/                # 工具模块
│   ├── dom-helpers.js    # DOM操作工具
│   └── text-parser.js    # 文本解析工具
└── index.js              # 主入口文件
```

## 开发指南

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
# 开发模式（监听文件变化）
npm run dev

# 构建生产版本
npm run build

# 构建开发版本
npm run build:dev

# 清理构建文件
npm run clean

# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 开发流程

1. **修改源代码**: 在 `src/` 目录下修改相应模块
2. **自动构建**: 运行 `npm run dev` 监听文件变化
3. **测试功能**: 在SillyTavern中测试扩展功能
4. **代码检查**: 运行 `npm run lint` 检查代码质量
5. **构建发布**: 运行 `npm run build` 生成生产版本

## 模块说明

### 核心模块 (core/)

- **constants.js**: 定义扩展使用的常量，如模块名、API类型等
- **settings.js**: 管理扩展设置，包括默认值和设置获取/重置功能
- **logger.js**: 提供统一的日志记录功能，支持调试模式

### 功能模块 (features/)

- **typing-indicator.js**: 打字指示器核心功能，负责显示/隐藏指示器
- **options-generator.js**: 选项生成器，调用AI API生成回复选项

### 用户界面 (ui/)

- **settings-panel.js**: 设置面板UI，提供用户配置界面
- **styles.js**: 样式管理器，注入扩展所需的CSS样式

### 工具模块 (utils/)

- **dom-helpers.js**: DOM操作工具函数，简化元素创建和管理
- **text-parser.js**: 文本解析工具，处理选项解析和模板变量替换

## 配置说明

### 基本设置

- `enabled`: 启用/禁用扩展
- `showCharName`: 是否在指示器中显示角色名称
- `animationEnabled`: 是否启用动画效果
- `customText`: 自定义指示器文本
- `debug`: 启用调试日志

### 选项生成设置

- `optionsGenEnabled`: 启用选项生成功能
- `optionsApiType`: API类型 (openai/gemini)
- `optionsApiKey`: API密钥
- `optionsApiModel`: 使用的模型
- `optionsBaseUrl`: API基础URL (仅OpenAI)
- `optionsTemplate`: 选项生成提示模板

## 使用方法

1. 使用URL通过内置扩展管理器安装：`https://github.com/YJPM/AI.git`
2. 在扩展设置面板中找到"AI助手"并启用
3. 配置API密钥和其他设置
4. 开始使用打字指示器和选项生成功能

## 许可证

AGPL-3.0 系列

## 原版信息

- 原扩展链接：https://github.com/SillyTavern/Extension-TypingIndicator
- 原版作者：SillyTavern社区的cohee guy/dude
- 此版本为基于原版的二次开发版本
