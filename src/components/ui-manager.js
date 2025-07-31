/**
 * UI管理类
 */
import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { SettingsManager } from '../core/settings.js';

export class UIManager {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.legacyIndicatorTemplate = document.getElementById('typing_indicator_template');
  }

  /**
   * 显示打字指示器
   * @param {string} type 指示器类型
   * @param {any} args 参数
   * @param {boolean} dryRun 是否为试运行
   */
  showTypingIndicator(type, args, dryRun) {
    const settings = this.settingsManager.getSettings();
    const noIndicatorTypes = ['quiet', 'impersonate'];

    if (type !== 'refresh' && (noIndicatorTypes.includes(type) || dryRun)) {
      return;
    }

    if (!settings.enabled) {
      return;
    }

    if (settings.showCharName && !window.name2 && type !== 'refresh') {
      return;
    }

    if (this.legacyIndicatorTemplate && window.selected_group && !window.isStreamingEnabled()) {
      return;
    }

    // 构建最终显示的文本
    let displayText = settings.customText;
    if (settings.showCharName && window.name2) {
      displayText = `${window.name2} ${displayText}`;
    }

    // 创建指示器元素
    const indicator = document.createElement('div');
    indicator.className = CONFIG.CSS_CLASSES.TYPING_INDICATOR;
    indicator.innerHTML = `
      <div class="${CONFIG.CSS_CLASSES.TYPING_INDICATOR_TEXT}">${displayText}</div>
      ${settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : ''}
    `;

    // 添加到聊天区域
    const chat = document.getElementById(CONFIG.SELECTORS.CHAT);
    if (chat) {
      chat.appendChild(indicator);
      
      // 滚动到底部
      chat.scrollTop = chat.scrollHeight;
    }
  }

  /**
   * 隐藏打字指示器
   */
  hideTypingIndicator() {
    const indicators = document.querySelectorAll(`.${CONFIG.CSS_CLASSES.TYPING_INDICATOR}`);
    indicators.forEach(indicator => indicator.remove());
  }

  /**
   * 显示生成中UI
   * @param {string} message 显示消息
   * @param {number} duration 显示时长（毫秒）
   */
  showGeneratingUI(message, duration = null) {
    logger.log(`showGeneratingUI: 尝试显示提示: "${message}"`);
    let container = document.getElementById(CONFIG.CSS_CLASSES.LOADING_CONTAINER);
    const chat = document.getElementById(CONFIG.SELECTORS.CHAT);
    
    if (!chat) {
      logger.log('showGeneratingUI: chat 未找到，无法显示。');
      return;
    }

    if (!container) {
      logger.log('showGeneratingUI: 未找到现有容器，创建新容器。');
      container = document.createElement('div');
      container.id = CONFIG.CSS_CLASSES.LOADING_CONTAINER;
      container.classList.add(CONFIG.CSS_CLASSES.TYPING_INDICATOR);
      chat.appendChild(container);
      logger.log('showGeneratingUI: 容器已附加到 chat。');
    } else {
      logger.log('showGeneratingUI: 找到现有容器，更新内容并尝试显示。');
    }

    const settings = this.settingsManager.getSettings();
    const animationHtml = settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
    
    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
        <div class="typing-indicator-text">${message}</div>
        ${animationHtml}
      </div>
    `;
    container.style.display = 'flex';
    logger.log(`showGeneratingUI: 最终容器 display 属性: ${container.style.display}`);

    if (duration) {
      logger.log(`showGeneratingUI: 将在 ${duration}ms 后隐藏提示。`);
      setTimeout(() => this.hideGeneratingUI(), duration);
    }
  }

  /**
   * 隐藏生成中UI
   */
  hideGeneratingUI() {
    const loadingContainer = document.getElementById(CONFIG.CSS_CLASSES.LOADING_CONTAINER);
    if (loadingContainer) {
      logger.log('hideGeneratingUI: 隐藏提示。');
      loadingContainer.style.display = 'none';
    }
  }

  /**
   * 显示选项
   * @param {Array} options 选项数组
   */
  async displayOptions(options) {
    this.hideGeneratingUI();
    const oldContainer = document.getElementById(CONFIG.CSS_CLASSES.OPTIONS_CONTAINER);
    if (oldContainer) oldContainer.remove();

    const sendForm = document.getElementById(CONFIG.SELECTORS.SEND_FORM);
    if (!sendForm || !options || options.length === 0) {
      if (!options || options.length === 0) {
        this.showGeneratingUI('未能生成有效选项', 3000);
      }
      return;
    }

    const container = document.createElement('div');
    container.id = CONFIG.CSS_CLASSES.OPTIONS_CONTAINER;
    sendForm.insertAdjacentElement('beforebegin', container);

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    for (const text of options) {
      const btn = document.createElement('button');
      btn.className = 'qr--button menu_button interactable ti-options-capsule';
      container.appendChild(btn);

      // 打字动画效果
      for (let i = 0; i < text.length; i++) {
        btn.textContent = text.substring(0, i + 1);
        await sleep(CONFIG.UI.TYPING_SPEED);
      }

      // 点击事件
      btn.onclick = () => {
        const textarea = document.querySelector(CONFIG.SELECTORS.SEND_TEXTAREA);
        if (textarea) {
          textarea.value = text;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.focus();
        }
        container.remove();
      };
    }
  }

  /**
   * 创建设置界面
   * @param {Object} settings 设置对象
   */
  createSettingsUI(settings) {
    const settingsContainer = document.getElementById('typing_indicator_container') ?? 
                             document.getElementById('extensions_settings');
    if (!settingsContainer) return;

    const inlineDrawer = document.createElement('div');
    inlineDrawer.classList.add('inline-drawer');
    settingsContainer.append(inlineDrawer);

    const inlineDrawerToggle = document.createElement('div');
    inlineDrawerToggle.classList.add('inline-drawer-toggle', 'inline-drawer-header');
    const extensionName = document.createElement('b');
    extensionName.textContent = CONFIG.EXTENSION_NAME;
    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');
    inlineDrawerToggle.append(extensionName, inlineDrawerIcon);

    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');
    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

    // 选项生成设置
    const optionsContainer = document.createElement('div');
    optionsContainer.style.marginTop = '20px';
    optionsContainer.style.borderTop = '1px solid var(--border_color)';
    optionsContainer.style.paddingTop = '15px';

    const optionsHeader = document.createElement('h4');
    optionsHeader.textContent = '回复选项生成';
    optionsHeader.style.margin = '0 0 10px 0';
    optionsContainer.appendChild(optionsHeader);

    // 启用选项生成
    const optionsEnabledLabel = document.createElement('label');
    optionsEnabledLabel.classList.add('checkbox_label');
    const optionsEnabledCheckbox = document.createElement('input');
    optionsEnabledCheckbox.type = 'checkbox';
    optionsEnabledCheckbox.checked = settings.optionsGenEnabled;
    optionsEnabledCheckbox.addEventListener('change', () => {
      this.settingsManager.updateSetting('optionsGenEnabled', optionsEnabledCheckbox.checked);
      optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';
    });
    const optionsEnabledText = document.createElement('span');
    optionsEnabledText.textContent = '启用回复选项生成';
    optionsEnabledLabel.append(optionsEnabledCheckbox, optionsEnabledText);
    optionsContainer.appendChild(optionsEnabledLabel);

    // 调试模式
    const debugLabel = document.createElement('label');
    debugLabel.classList.add('checkbox_label');
    debugLabel.style.marginLeft = '10px';
    const debugCheckbox = document.createElement('input');
    debugCheckbox.type = 'checkbox';
    debugCheckbox.checked = settings.debug;
    debugCheckbox.addEventListener('change', () => {
      this.settingsManager.updateSetting('debug', debugCheckbox.checked);
    });
    const debugText = document.createElement('span');
    debugText.textContent = '启用调试日志';
    debugLabel.append(debugCheckbox, debugText);
    optionsContainer.appendChild(debugLabel);

    // 选项设置容器
    const optionsSettingsContainer = document.createElement('div');
    optionsSettingsContainer.style.marginTop = '10px';
    optionsSettingsContainer.style.display = settings.optionsGenEnabled ? 'block' : 'none';

    // API Type
    const apiTypeLabel = document.createElement('label');
    apiTypeLabel.textContent = 'API 类型:';
    apiTypeLabel.style.display = 'block';
    apiTypeLabel.style.marginTop = '10px';
    const apiTypeSelect = document.createElement('select');
    apiTypeSelect.id = 'options-api-type';
    apiTypeSelect.style.width = '100%';
    apiTypeSelect.innerHTML = `
      <option value="openai">OpenAI-兼容</option>
      <option value="gemini">Google Gemini</option>
    `;
    apiTypeSelect.value = settings.optionsApiType;
    optionsSettingsContainer.appendChild(apiTypeLabel);
    optionsSettingsContainer.appendChild(apiTypeSelect);

    // API Key
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'API密钥:';
    apiKeyLabel.style.display = 'block';
    apiKeyLabel.style.marginTop = '10px';
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.value = settings.optionsApiKey;
    apiKeyInput.placeholder = '输入API密钥';
    apiKeyInput.style.width = '100%';
    apiKeyInput.addEventListener('input', () => {
      this.settingsManager.updateSetting('optionsApiKey', apiKeyInput.value);
    });
    optionsSettingsContainer.appendChild(apiKeyLabel);
    optionsSettingsContainer.appendChild(apiKeyInput);

    // 模型选择
    const modelLabel = document.createElement('label');
    modelLabel.textContent = '模型:';
    modelLabel.style.display = 'block';
    modelLabel.style.marginTop = '10px';
    const modelInput = document.createElement('input');
    modelInput.type = 'text';
    modelInput.value = settings.optionsApiModel;
    modelInput.placeholder = '输入模型名称';
    modelInput.style.width = '100%';
    modelInput.addEventListener('input', () => {
      this.settingsManager.updateSetting('optionsApiModel', modelInput.value);
    });
    optionsSettingsContainer.appendChild(modelLabel);
    optionsSettingsContainer.appendChild(modelInput);

    // 基础URL
    const baseUrlGroup = document.createElement('div');
    baseUrlGroup.id = 'options-base-url-group';
    const baseUrlLabel = document.createElement('label');
    baseUrlLabel.textContent = '基础URL:';
    baseUrlLabel.style.display = 'block';
    baseUrlLabel.style.marginTop = '10px';
    const baseUrlInput = document.createElement('input');
    baseUrlInput.type = 'text';
    baseUrlInput.value = settings.optionsBaseUrl;
    baseUrlInput.placeholder = '输入API基础URL';
    baseUrlInput.style.width = '100%';
    baseUrlInput.addEventListener('input', () => {
      this.settingsManager.updateSetting('optionsBaseUrl', baseUrlInput.value);
    });
    baseUrlGroup.appendChild(baseUrlLabel);
    baseUrlGroup.appendChild(baseUrlInput);
    optionsSettingsContainer.appendChild(baseUrlGroup);

    // API类型切换事件
    apiTypeSelect.addEventListener('change', () => {
      this.settingsManager.updateSetting('optionsApiType', apiTypeSelect.value);
      baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';
    });
    
    // 初始状态
    baseUrlGroup.style.display = settings.optionsApiType === 'openai' ? 'block' : 'none';

    optionsContainer.appendChild(optionsSettingsContainer);
    inlineDrawerContent.append(optionsContainer);
  }

  /**
   * 注入全局样式
   */
  injectGlobalStyles() {
    const css = `
      /* 核心指示器样式修复 */
      #typing_indicator.typing_indicator {
        opacity: 1 !important;
        background-color: transparent !important;
      }

      /* 确保所有提示容器都是透明背景 */
      .typing_indicator {
        background-color: transparent !important;
      }

      /* 省略号动画 */
      .typing-ellipsis::after {
        display: inline-block;
        animation: ellipsis-animation 1.4s infinite;
        content: '.';
        width: 1.2em;
        text-align: left;
        vertical-align: bottom;
      }
      @keyframes ellipsis-animation {
        0% { content: '.'; }
        33% { content: '..'; }
        66%, 100% { content: '...'; }
      }

      /* 移除提示文字渐变样式，恢复为普通文本 */
      .typing-indicator-text {
        font-weight: normal;
        background: none;
        -webkit-background-clip: unset;
        background-clip: unset;
        -webkit-text-fill-color: unset;
        display: inline;
        animation: none;
        color: var(--text_color);
      }

      /* 选项按钮样式 */
      #ti-options-container {
        width: 100%;
        padding: 8px 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      }
      .ti-options-capsule {
        flex: 1;
        white-space: normal;
        text-align: center;
        margin: 0 !important;
        height: auto;
        min-width: 120px;
      }
    `;

    let styleTag = document.getElementById('typing-indicator-global-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'typing-indicator-global-style';
      styleTag.textContent = css;
      document.head.appendChild(styleTag);
    }
  }

  /**
   * 应用基本样式
   */
  applyBasicStyle() {
    let styleTag = document.getElementById('typing-indicator-theme-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'typing-indicator-theme-style';
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
      .typing_indicator {
        background-color: transparent;
        padding: 8px 16px;
        margin: 8px auto;
        width: fit-content;
        max-width: 90%;
        text-align: center;
        color: var(--text_color);
      }
    `;
  }
} 