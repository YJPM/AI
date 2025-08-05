#!/usr/bin/env node

/**
 * AI智能助手 - 代码质量检查脚本
 * 用于检查项目中的潜在问题和代码规范
 */

const fs = require('fs');
const path = require('path');

// 检查配置
const CONFIG = {
    // 要检查的文件类型
    fileExtensions: ['.js', '.css', '.json'],
    
    // 要忽略的文件和目录
    ignorePatterns: [
        'node_modules',
        '.git',
        'package-lock.json',
        '*.min.js',
        '*.bundle.js'
    ],
    
    // 代码规范检查
    rules: {
        // 禁止使用的函数/方法
        forbiddenFunctions: [
            'eval',
            'innerHTML',
            'document.write',
            'console.log', // 生产环境
            'alert'
        ],
        
        // 必须使用的模式
        requiredPatterns: [
            'try\\s*{', // 错误处理
            'catch\\s*\\(', // 异常捕获
            'logger\\.', // 使用logger
            'const\\s+', // 使用const
            'let\\s+' // 使用let
        ],
        
        // 代码复杂度检查
        maxLineLength: 120,
        maxFunctionLength: 50,
        maxFileLength: 1000
    }
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// 检查结果
let results = {
    totalFiles: 0,
    checkedFiles: 0,
    issues: [],
    warnings: [],
    suggestions: []
};

/**
 * 检查文件是否应该被忽略
 */
function shouldIgnoreFile(filePath) {
    return CONFIG.ignorePatterns.some(pattern => {
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace('*', '.*'));
            return regex.test(path.basename(filePath));
        }
        return filePath.includes(pattern);
    });
}

/**
 * 检查文件扩展名
 */
function hasValidExtension(filePath) {
    return CONFIG.fileExtensions.some(ext => filePath.endsWith(ext));
}

/**
 * 递归获取所有文件
 */
function getAllFiles(dirPath, fileList = []) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (stat.isFile()) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

/**
 * 检查JavaScript文件
 */
function checkJavaScriptFile(filePath, content) {
    const issues = [];
    const warnings = [];
    const suggestions = [];
    
    const lines = content.split('\n');
    
    // 检查行长度
    lines.forEach((line, index) => {
        if (line.length > CONFIG.rules.maxLineLength) {
            warnings.push({
                type: 'line-too-long',
                line: index + 1,
                message: `行长度超过${CONFIG.rules.maxLineLength}字符`,
                content: line.trim()
            });
        }
    });
    
    // 检查禁止使用的函数
    CONFIG.rules.forbiddenFunctions.forEach(func => {
        const regex = new RegExp(`\\b${func}\\s*\\(`, 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            issues.push({
                type: 'forbidden-function',
                line: lineNumber,
                message: `禁止使用 ${func} 函数`,
                content: lines[lineNumber - 1]?.trim() || ''
            });
        }
    });
    
    // 检查错误处理
    if (!content.includes('try') && !content.includes('catch')) {
        suggestions.push({
            type: 'error-handling',
            message: '建议添加错误处理机制'
        });
    }
    
    // 检查logger使用
    if (content.includes('console.log') && !content.includes('logger.')) {
        suggestions.push({
            type: 'logger-usage',
            message: '建议使用logger而不是console.log'
        });
    }
    
    // 检查函数长度
    const functionRegex = /function\s+\w+\s*\([^)]*\)\s*\{/g;
    let functionMatch;
    while ((functionMatch = functionRegex.exec(content)) !== null) {
        const startIndex = functionMatch.index;
        const functionContent = content.substring(startIndex);
        const braceCount = 0;
        let endIndex = startIndex;
        
        for (let i = 0; i < functionContent.length; i++) {
            if (functionContent[i] === '{') braceCount++;
            if (functionContent[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endIndex = startIndex + i;
                    break;
                }
            }
        }
        
        const functionBody = content.substring(startIndex, endIndex);
        const functionLines = functionBody.split('\n').length;
        
        if (functionLines > CONFIG.rules.maxFunctionLength) {
            warnings.push({
                type: 'function-too-long',
                line: content.substring(0, startIndex).split('\n').length,
                message: `函数过长，建议拆分`,
                content: functionMatch[0].trim()
            });
        }
    }
    
    return { issues, warnings, suggestions };
}

/**
 * 检查CSS文件
 */
function checkCSSFile(filePath, content) {
    const issues = [];
    const warnings = [];
    const suggestions = [];
    
    const lines = content.split('\n');
    
    // 检查行长度
    lines.forEach((line, index) => {
        if (line.length > CONFIG.rules.maxLineLength) {
            warnings.push({
                type: 'line-too-long',
                line: index + 1,
                message: `行长度超过${CONFIG.rules.maxLineLength}字符`,
                content: line.trim()
            });
        }
    });
    
    // 检查是否有注释
    if (!content.includes('/*') && !content.includes('//')) {
        suggestions.push({
            type: 'css-comments',
            message: '建议添加CSS注释说明'
        });
    }
    
    // 检查是否有响应式设计
    if (!content.includes('@media')) {
        suggestions.push({
            type: 'responsive-design',
            message: '建议添加响应式设计支持'
        });
    }
    
    return { issues, warnings, suggestions };
}

/**
 * 检查JSON文件
 */
function checkJSONFile(filePath, content) {
    const issues = [];
    const warnings = [];
    const suggestions = [];
    
    try {
        JSON.parse(content);
    } catch (error) {
        issues.push({
            type: 'invalid-json',
            message: `JSON格式错误: ${error.message}`
        });
    }
    
    return { issues, warnings, suggestions };
}

/**
 * 检查单个文件
 */
function checkFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath);
        
        let fileIssues, fileWarnings, fileSuggestions;
        
        switch (ext) {
            case '.js':
                ({ issues: fileIssues, warnings: fileWarnings, suggestions: fileSuggestions } = checkJavaScriptFile(filePath, content));
                break;
            case '.css':
                ({ issues: fileWarnings, warnings: fileWarnings, suggestions: fileSuggestions } = checkCSSFile(filePath, content));
                break;
            case '.json':
                ({ issues: fileIssues, warnings: fileWarnings, suggestions: fileSuggestions } = checkJSONFile(filePath, content));
                break;
            default:
                return;
        }
        
        // 添加文件路径信息
        fileIssues?.forEach(issue => {
            issue.file = filePath;
            results.issues.push(issue);
        });
        
        fileWarnings?.forEach(warning => {
            warning.file = filePath;
            results.warnings.push(warning);
        });
        
        fileSuggestions?.forEach(suggestion => {
            suggestion.file = filePath;
            results.suggestions.push(suggestion);
        });
        
        results.checkedFiles++;
        
    } catch (error) {
        console.error(`${colors.red}检查文件失败: ${filePath}${colors.reset}`, error.message);
    }
}

/**
 * 输出检查结果
 */
function printResults() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.cyan}代码质量检查结果${colors.reset}`);
    console.log('='.repeat(60));
    
    console.log(`\n${colors.blue}检查统计:${colors.reset}`);
    console.log(`  总文件数: ${results.totalFiles}`);
    console.log(`  已检查文件: ${results.checkedFiles}`);
    console.log(`  问题数量: ${results.issues.length}`);
    console.log(`  警告数量: ${results.warnings.length}`);
    console.log(`  建议数量: ${results.suggestions.length}`);
    
    // 输出问题
    if (results.issues.length > 0) {
        console.log(`\n${colors.red}❌ 发现的问题:${colors.reset}`);
        results.issues.forEach((issue, index) => {
            console.log(`  ${index + 1}. ${issue.file}:${issue.line || ''} - ${issue.message}`);
            if (issue.content) {
                console.log(`     内容: ${issue.content}`);
            }
        });
    }
    
    // 输出警告
    if (results.warnings.length > 0) {
        console.log(`\n${colors.yellow}⚠️  警告:${colors.reset}`);
        results.warnings.forEach((warning, index) => {
            console.log(`  ${index + 1}. ${warning.file}:${warning.line || ''} - ${warning.message}`);
            if (warning.content) {
                console.log(`     内容: ${warning.content}`);
            }
        });
    }
    
    // 输出建议
    if (results.suggestions.length > 0) {
        console.log(`\n${colors.green}💡 建议:${colors.reset}`);
        results.suggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion.file || '全局'} - ${suggestion.message}`);
        });
    }
    
    // 总结
    if (results.issues.length === 0 && results.warnings.length === 0) {
        console.log(`\n${colors.green}🎉 代码质量检查通过！${colors.reset}`);
    } else {
        console.log(`\n${colors.yellow}📝 请根据上述建议改进代码质量${colors.reset}`);
    }
}

/**
 * 主函数
 */
function main() {
    const projectDir = process.cwd();
    console.log(`${colors.cyan}开始检查项目: ${projectDir}${colors.reset}`);
    
    // 获取所有文件
    const allFiles = getAllFiles(projectDir);
    results.totalFiles = allFiles.length;
    
    // 过滤和检查文件
    allFiles.forEach(filePath => {
        if (!shouldIgnoreFile(filePath) && hasValidExtension(filePath)) {
            checkFile(filePath);
        }
    });
    
    // 输出结果
    printResults();
}

// 运行检查
if (require.main === module) {
    main();
}

module.exports = {
    checkFile,
    checkJavaScriptFile,
    checkCSSFile,
    checkJSONFile,
    printResults
}; 