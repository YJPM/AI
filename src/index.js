/**
 * AI助手扩展 - 测试版本
 */

console.log('AI助手扩展开始加载...');

// 简单的初始化函数
function initializeExtension() {
  console.log('AI助手扩展初始化完成');
  
  // 设置全局变量
  window.AIAssistantExtension = {
    initialized: true,
    version: '1.0.0',
    getStatus: function() {
      return {
        initialized: true,
        version: '1.0.0'
      };
    }
  };
  
  console.log('AI助手扩展已设置到全局变量');
  
  // 通知SillyTavern扩展已加载
  if (window.eventSource && window.eventSource.emit) {
    window.eventSource.emit('extension_loaded', 'AI助手');
  }
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
} 