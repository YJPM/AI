/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/core/constants.js
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var MODULE = 'typing_indicator';
var EVENT_TYPES = {
  GENERATION_AFTER_COMMANDS: 'generation_after_commands',
  GENERATION_STOPPED: 'generation_stopped',
  GENERATION_ENDED: 'generation_ended',
  CHAT_CHANGED: 'chat_changed'
};
var API_TYPES = {
  OPENAI: 'openai',
  GEMINI: 'gemini'
};
var DEFAULT_MODELS = _defineProperty(_defineProperty({}, API_TYPES.OPENAI, 'gpt-3.5-turbo'), API_TYPES.GEMINI, 'gemini-2.5-flash-free');
var DEFAULT_BASE_URLS = _defineProperty(_defineProperty({}, API_TYPES.OPENAI, 'https://newapi.sisuo.de/v1'), API_TYPES.GEMINI, 'https://generativelanguage.googleapis.com/v1beta');
;// ./src/core/settings.js



/**
 * @typedef {Object} TypingIndicatorSettings
 * @property {boolean} enabled
 * @property {boolean} showCharName
 * @property {boolean} animationEnabled - 是否启用末尾的...动画。
 * @property {string} customText
 * @property {boolean} debug - 是否启用调试日志
 * @property {boolean} optionsGenEnabled - 是否启用选项生成功能
 * @property {string} optionsApiType - API类型 ('openai' 或 'gemini')
 * @property {string} optionsApiKey - API密钥
 * @property {string} optionsApiModel - 使用的模型
 * @property {string} optionsBaseUrl - API基础URL (仅限OpenAI)
 * @property {string} optionsTemplate - 选项生成提示模板
 */

/**
 * @type {TypingIndicatorSettings}
 */
var defaultSettings = {
  enabled: true,
  showCharName: true,
  animationEnabled: true,
  customText: '正在输入',
  debug: false,
  // 选项生成相关设置
  optionsGenEnabled: false,
  optionsApiType: API_TYPES.OPENAI,
  optionsApiKey: '',
  optionsApiModel: DEFAULT_MODELS[API_TYPES.GEMINI],
  optionsBaseUrl: DEFAULT_BASE_URLS[API_TYPES.OPENAI],
  optionsTemplate: "\n# \u89D2\u8272\n\u4F60\u662F\u4E00\u4F4D\u62E5\u6709\u9876\u7EA7\u521B\u4F5C\u80FD\u529B\u7684AI\u53D9\u4E8B\u5BFC\u6F14\u3002\n\n# \u6838\u5FC3\u76EE\u6807\n\u57FA\u4E8E\u5B8C\u6574\u7684\u804A\u5929\u4E0A\u4E0B\u6587\uFF0C\u901A\u8FC7\u4E00\u4E2A\u4E25\u8C28\u7684\u5185\u90E8\u601D\u8003\u8FC7\u7A0B\uFF0C\u4E3A\"\u6211\"\uFF08\u7528\u6237\u89D2\u8272\uFF09\u751F\u62103-5\u4E2A\u63A5\u4E0B\u6765\u53EF\u80FD\u53D1\u751F\u7684\u3001\u6700\u5177\u620F\u5267\u6027\u7684\u884C\u52A8\u6216\u4E8B\u4EF6\u9009\u9879\u3002\n\n# \u5185\u90E8\u601D\u8003\u8FC7\u7A0B\n1.  **[\u60C5\u5883\u5206\u6790]**: \u5FEB\u901F\u5206\u6790\u5F53\u524D\u573A\u666F\u3001\u6211\u7684\u60C5\u7EEA\u548C\u76EE\u6807\u3001\u4EE5\u53CA\u5F53\u524D\u7684\u51B2\u7A81\u70B9\u3002\n2.  **[\u9009\u9879\u6784\u601D]**: \u57FA\u4E8E\u5206\u6790\uFF0C\u5728\u5185\u90E8\u6784\u601D\u591A\u4E2A\u591A\u6837\u5316\u7684\u9009\u9879\uFF08\u5347\u7EA7\u51B2\u7A81\u3001\u63A2\u7D22\u672A\u77E5\u3001\u53CD\u6620\u5185\u5FC3\u3001\u610F\u5916\u8F6C\u6298\u7B49\uFF09\u3002\n3.  **[\u6392\u5E8F\u4E0E\u51B3\u7B56]**: \u6839\u636E\u620F\u5267\u6027\u3001\u89D2\u8272\u4E00\u81F4\u6027\u548C\u53D9\u4E8B\u63A8\u52A8\u529B\uFF0C\u5BF9\u6784\u601D\u7684\u9009\u9879\u8FDB\u884C\u6392\u5E8F\uFF0C\u5C06\u4F60\u8BA4\u4E3A\u7684\"\u6700\u4F18\u9009\u9879\"\u653E\u5728\u7B2C\u4E00\u4F4D\u3002\n\n# \u6700\u7EC8\u8F93\u51FA\u683C\u5F0F (!!!\u81F3\u5173\u91CD\u8981!!!)\n- \u4F60\u7684\u6700\u7EC8\u8F93\u51FA\u5FC5\u987B\u662F\u4E00\u4E2A\u4E0D\u6362\u884C\u7684\u5355\u884C\u6587\u672C\uFF0C\u5305\u542B3-5\u4E2A\u9AD8\u8D28\u91CF\u9009\u9879\u3002\n- **\u7B2C\u4E00\u4E2A\u9009\u9879\u5FC5\u987B\u662F\u4F60\u51B3\u7B56\u51FA\u7684\u6700\u4F18\u9009\u9879\u3002**\n- \u6BCF\u4E2A\u9009\u9879\u90FD\u5FC5\u987B\u7528\u5168\u89D2\u62EC\u53F7\u3010\u3011\u5305\u88F9\u3002\n- **\u7EDD\u5BF9\u7981\u6B62**\u5305\u542B\u4EFB\u4F55\u5E8F\u53F7\u3001JSON\u3001\u601D\u8003\u8FC7\u7A0B\u3001\u89E3\u91CA\u6216\u5176\u4ED6\u591A\u4F59\u5B57\u7B26\u3002\n\n# \u5F53\u524D\u7528\u6237\u8F93\u5165\n{{user_input}}\n\n# \u89D2\u8272\u4FE1\u606F\n{{char_card}}\n\n# \u4E16\u754C\u8BBE\u5B9A\n{{world_info}}\n\n# \u5BF9\u8BDD\u4E0A\u4E0B\u6587\n{{context}}\n\n# \u5F00\u59CB\u6267\u884C\u5BFC\u6F14\u4EFB\u52A1\uFF0C\u5E76\u8F93\u51FA\u4F60\u7684\u6700\u7EC8\u9009\u9879\u5217\u8868\uFF1A\n".trim()
};

/**
 * 获取此扩展的设置。
 */
function getSettings() {
  var extension_settings = window.extension_settings || window.extensionSettings;
  if (!extension_settings) {
    console.error('AI助手扩展：无法找到extension_settings全局变量');
    return defaultSettings;
  }
  if (extension_settings[MODULE] === undefined) {
    extension_settings[MODULE] = structuredClone(defaultSettings);
  }
  for (var key in defaultSettings) {
    if (extension_settings[MODULE][key] === undefined) {
      extension_settings[MODULE][key] = defaultSettings[key];
    }
  }
  return extension_settings[MODULE];
}

/**
 * 重置所有设置为默认值
 */
function resetSettings() {
  var extension_settings = window.extension_settings || window.extensionSettings;
  if (!extension_settings) {
    console.error('AI助手扩展：无法找到extension_settings全局变量');
    return defaultSettings;
  }
  extension_settings[MODULE] = structuredClone(defaultSettings);
  return extension_settings[MODULE];
}
;// ./src/core/logger.js



/**
 * 日志记录器
 */
var logger = {
  log: function log() {
    if (getSettings().debug) {
      var _console;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      (_console = console).log.apply(_console, ["[".concat(MODULE, "]")].concat(args));
    }
  },
  error: function error() {
    var _console2;
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    (_console2 = console).error.apply(_console2, ["[".concat(MODULE, "]")].concat(args));
  },
  warn: function warn() {
    var _console3;
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    (_console3 = console).warn.apply(_console3, ["[".concat(MODULE, "]")].concat(args));
  },
  info: function info() {
    if (getSettings().debug) {
      var _console4;
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      (_console4 = console).info.apply(_console4, ["[".concat(MODULE, "]")].concat(args));
    }
  }
};
;// ./src/utils/dom-helpers.js
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { dom_helpers_defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function dom_helpers_defineProperty(e, r, t) { return (r = dom_helpers_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function dom_helpers_toPropertyKey(t) { var i = dom_helpers_toPrimitive(t, "string"); return "symbol" == dom_helpers_typeof(i) ? i : i + ""; }
function dom_helpers_toPrimitive(t, r) { if ("object" != dom_helpers_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != dom_helpers_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function dom_helpers_typeof(o) { "@babel/helpers - typeof"; return dom_helpers_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, dom_helpers_typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * DOM操作工具函数
 */

/**
 * 创建元素并设置属性
 * @param {string} tagName - 标签名
 * @param {Object} attributes - 属性对象
 * @param {string} textContent - 文本内容
 * @returns {HTMLElement}
 */
function createElement(tagName) {
  var attributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var textContent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var element = document.createElement(tagName);

  // 设置属性
  Object.entries(attributes).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      key = _ref2[0],
      value = _ref2[1];
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && dom_helpers_typeof(value) === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });

  // 设置文本内容
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

/**
 * 安全地移除元素
 * @param {HTMLElement} element - 要移除的元素
 */
function safeRemoveElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * 查找元素，如果不存在则创建
 * @param {string} id - 元素ID
 * @param {string} tagName - 标签名
 * @param {Object} attributes - 属性对象
 * @returns {HTMLElement}
 */
function findOrCreateElement(id) {
  var tagName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'div';
  var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var element = document.getElementById(id);
  if (!element) {
    element = createElement(tagName, _objectSpread({
      id: id
    }, attributes));
  }
  return element;
}

/**
 * 添加CSS样式到页面
 * @param {string} css - CSS样式字符串
 * @param {string} id - 样式标签ID
 */
function injectCSS(css, id) {
  var styleTag = document.getElementById(id);
  if (!styleTag) {
    styleTag = createElement('style', {
      id: id
    });
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = css;
}
;// ./src/features/typing-indicator.js
function typing_indicator_typeof(o) { "@babel/helpers - typeof"; return typing_indicator_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, typing_indicator_typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, typing_indicator_toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function typing_indicator_toPropertyKey(t) { var i = typing_indicator_toPrimitive(t, "string"); return "symbol" == typing_indicator_typeof(i) ? i : i + ""; }
function typing_indicator_toPrimitive(t, r) { if ("object" != typing_indicator_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typing_indicator_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




/**
 * 打字指示器类
 */
var TypingIndicator = /*#__PURE__*/function () {
  function TypingIndicator() {
    _classCallCheck(this, TypingIndicator);
    this.isVisible = false;
    this.legacyIndicatorTemplate = document.getElementById('typing_indicator_template');
    this.injectStyles();
  }

  /**
   * 注入样式
   */
  return _createClass(TypingIndicator, [{
    key: "injectStyles",
    value: function injectStyles() {
      var css = "\n            .typing_indicator {\n                background-color: transparent;\n                padding: 8px 16px;\n                margin: 8px auto;\n                width: fit-content;\n                max-width: 90%;\n                text-align: center;\n                color: var(--text_color);\n                opacity: 1 !important;\n            }\n\n            .typing-ellipsis {\n                display: inline-block;\n                animation: typing-dots 1.5s infinite;\n            }\n\n            @keyframes typing-dots {\n                0%, 20% { opacity: 0; }\n                50% { opacity: 1; }\n                100% { opacity: 0; }\n            }\n\n            .typing-ellipsis::after {\n                content: '...';\n                animation: typing-dots 1.5s infinite;\n            }\n        ";
      injectCSS(css, 'typing-indicator-styles');
    }

    /**
     * 显示打字指示器
     * @param {string} type - 指示器类型
     * @param {Object} args - 参数
     * @param {boolean} dryRun - 是否仅预览
     */
  }, {
    key: "show",
    value: function show(type) {
      var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var dryRun = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var settings = getSettings();
      if (!settings.enabled) {
        return;
      }
      if (settings.showCharName && !name2 && type !== 'refresh') {
        return;
      }
      if (dryRun) {
        return;
      }
      this.hide();
      var finalText = settings.customText || '正在输入';
      if (settings.showCharName && name2) {
        finalText = "".concat(name2, " ").concat(finalText);
      }
      var animationHtml = settings.animationEnabled ? '<div class="typing-ellipsis"></div>' : '';
      var indicatorHtml = "\n            <div id=\"typing_indicator\" class=\"typing_indicator\">\n                <div class=\"typing_indicator_text\">".concat(finalText, "</div>\n                ").concat(animationHtml, "\n            </div>\n        ");
      var chatContainer = document.querySelector('#chat, .chat');
      if (chatContainer) {
        chatContainer.insertAdjacentHTML('beforeend', indicatorHtml);
        this.isVisible = true;
        logger.log('打字指示器已显示');
      }
    }

    /**
     * 隐藏打字指示器
     */
  }, {
    key: "hide",
    value: function hide() {
      var indicator = document.getElementById('typing_indicator');
      if (indicator) {
        safeRemoveElement(indicator);
        this.isVisible = false;
        logger.log('打字指示器已隐藏');
      }
    }

    /**
     * 检查是否可见
     * @returns {boolean}
     */
  }, {
    key: "isVisible",
    value: function isVisible() {
      return this.isVisible;
    }
  }]);
}();
;// ./src/utils/text-parser.js
function text_parser_slicedToArray(r, e) { return text_parser_arrayWithHoles(r) || text_parser_iterableToArrayLimit(r, e) || text_parser_unsupportedIterableToArray(r, e) || text_parser_nonIterableRest(); }
function text_parser_nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function text_parser_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return text_parser_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? text_parser_arrayLikeToArray(r, a) : void 0; } }
function text_parser_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function text_parser_iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function text_parser_arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * 文本解析工具函数
 */

/**
 * 解析选项文本，提取【】中的选项
 * @param {string} content - 包含选项的文本
 * @returns {string[]} 选项数组
 */
function parseOptions(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  // 匹配【】中的内容
  var optionRegex = /【([^】]+)】/g;
  var options = [];
  var match;
  while ((match = optionRegex.exec(content)) !== null) {
    var option = match[1].trim();
    if (option && !options.includes(option)) {
      options.push(option);
    }
  }
  return options;
}

/**
 * 模板变量替换
 * @param {string} template - 模板字符串
 * @param {Object} variables - 变量对象
 * @returns {string} 替换后的字符串
 */
function replaceTemplateVariables(template, variables) {
  var result = template;
  Object.entries(variables).forEach(function (_ref) {
    var _ref2 = text_parser_slicedToArray(_ref, 2),
      key = _ref2[0],
      value = _ref2[1];
    var placeholder = "{{".concat(key, "}}");
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  });
  return result;
}

/**
 * 截断文本到指定长度
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的文本
 */
function truncateText(text) {
  var maxLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
  var suffix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '...';
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 清理HTML标签
 * @param {string} html - HTML字符串
 * @returns {string} 清理后的纯文本
 */
function stripHtmlTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}
;// ./src/features/options-generator.js
function options_generator_typeof(o) { "@babel/helpers - typeof"; return options_generator_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, options_generator_typeof(o); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(options_generator_typeof(e) + " is not iterable"); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = options_generator_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function options_generator_slicedToArray(r, e) { return options_generator_arrayWithHoles(r) || options_generator_iterableToArrayLimit(r, e) || options_generator_unsupportedIterableToArray(r, e) || options_generator_nonIterableRest(); }
function options_generator_nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function options_generator_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return options_generator_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? options_generator_arrayLikeToArray(r, a) : void 0; } }
function options_generator_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function options_generator_iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function options_generator_arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function options_generator_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function options_generator_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, options_generator_toPropertyKey(o.key), o); } }
function options_generator_createClass(e, r, t) { return r && options_generator_defineProperties(e.prototype, r), t && options_generator_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function options_generator_toPropertyKey(t) { var i = options_generator_toPrimitive(t, "string"); return "symbol" == options_generator_typeof(i) ? i : i + ""; }
function options_generator_toPrimitive(t, r) { if ("object" != options_generator_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != options_generator_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }






/**
 * 选项生成器类
 */
var OptionsGenerator = /*#__PURE__*/function () {
  function OptionsGenerator() {
    options_generator_classCallCheck(this, OptionsGenerator);
    this.isGenerating = false;
    this.isManuallyStopped = false;
  }

  /**
   * 获取用户输入
   * @returns {string}
   */
  return options_generator_createClass(OptionsGenerator, [{
    key: "getUserInput",
    value: function getUserInput() {
      var textarea = document.querySelector('#send_textarea, .send_textarea');
      return textarea ? textarea.value : '';
    }

    /**
     * 获取角色卡片信息
     * @returns {string}
     */
  }, {
    key: "getCharacterCard",
    value: function getCharacterCard() {
      if (selected_group && selected_group.avatar_url) {
        return "\u89D2\u8272\u540D\u79F0: ".concat(selected_group.name || '未知');
      }
      return '';
    }

    /**
     * 获取世界设定信息
     * @returns {string}
     */
  }, {
    key: "getWorldInfo",
    value: function getWorldInfo() {
      var worldInfoElement = document.querySelector('#world_info, .world_info');
      return worldInfoElement ? worldInfoElement.textContent || '' : '';
    }

    /**
     * 获取对话上下文
     * @returns {string}
     */
  }, {
    key: "getContextForAPI",
    value: function getContextForAPI() {
      var messages = [];
      var messageElements = document.querySelectorAll('.mes, .message');
      messageElements.forEach(function (element, index) {
        var isUser = element.classList.contains('mes_user') || element.classList.contains('user');
        var isAI = element.classList.contains('mes_assistant') || element.classList.contains('assistant');
        if (isUser || isAI) {
          var textElement = element.querySelector('.mes_text, .text');
          var text = textElement ? textElement.textContent || '' : '';
          if (text.trim()) {
            messages.push({
              role: isUser ? 'user' : 'assistant',
              content: text.trim()
            });
          }
        }
      });

      // 只保留最近的10条消息
      return messages.slice(-10).map(function (msg) {
        return "".concat(msg.role, ": ").concat(msg.content);
      }).join('\n');
    }

    /**
     * 转换消息格式为Gemini格式
     * @param {Array} messages - 消息数组
     * @returns {Array} Gemini格式的消息
     */
  }, {
    key: "transformMessagesForGemini",
    value: function transformMessagesForGemini(messages) {
      return messages.map(function (msg) {
        return {
          parts: [{
            text: msg.content
          }]
        };
      });
    }

    /**
     * 生成选项
     */
  }, {
    key: "generateOptions",
    value: (function () {
      var _generateOptions = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var settings, userInput, charCard, worldInfo, context, variables, processedTemplate, response, options, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              settings = getSettings();
              if (!(!settings.optionsGenEnabled || !settings.optionsApiKey)) {
                _context.n = 1;
                break;
              }
              logger.log('选项生成已禁用或API密钥未设置');
              return _context.a(2);
            case 1:
              if (!this.isGenerating) {
                _context.n = 2;
                break;
              }
              logger.log('选项生成正在进行中，跳过');
              return _context.a(2);
            case 2:
              this.isGenerating = true;
              this.showGeneratingUI('正在生成选项...');
              _context.p = 3;
              userInput = this.getUserInput();
              charCard = this.getCharacterCard();
              worldInfo = this.getWorldInfo();
              context = this.getContextForAPI();
              variables = {
                user_input: userInput,
                char_card: charCard,
                world_info: worldInfo,
                context: context
              };
              processedTemplate = settings.optionsTemplate;
              Object.entries(variables).forEach(function (_ref) {
                var _ref2 = options_generator_slicedToArray(_ref, 2),
                  key = _ref2[0],
                  value = _ref2[1];
                processedTemplate = processedTemplate.replace(new RegExp("{{".concat(key, "}}"), 'g'), value || '');
              });
              if (!(settings.optionsApiType === API_TYPES.GEMINI)) {
                _context.n = 5;
                break;
              }
              _context.n = 4;
              return this.callGeminiAPI(processedTemplate);
            case 4:
              response = _context.v;
              _context.n = 7;
              break;
            case 5:
              _context.n = 6;
              return this.callOpenAIAPI(processedTemplate);
            case 6:
              response = _context.v;
            case 7:
              if (!response) {
                _context.n = 10;
                break;
              }
              options = parseOptions(response);
              if (!(options.length > 0)) {
                _context.n = 9;
                break;
              }
              _context.n = 8;
              return this.displayOptions(options);
            case 8:
              _context.n = 10;
              break;
            case 9:
              logger.warn('未能解析到有效选项');
            case 10:
              _context.n = 12;
              break;
            case 11:
              _context.p = 11;
              _t = _context.v;
              logger.error('生成选项时出错:', _t);
            case 12:
              _context.p = 12;
              this.isGenerating = false;
              this.hideGeneratingUI();
              return _context.f(12);
            case 13:
              return _context.a(2);
          }
        }, _callee, this, [[3, 11, 12, 13]]);
      }));
      function generateOptions() {
        return _generateOptions.apply(this, arguments);
      }
      return generateOptions;
    }()
    /**
     * 调用Gemini API
     * @param {string} prompt - 提示文本
     * @returns {Promise<string>}
     */
    )
  }, {
    key: "callGeminiAPI",
    value: (function () {
      var _callGeminiAPI = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(prompt) {
        var _data$candidates;
        var settings, url, response, data;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              settings = getSettings();
              url = "https://generativelanguage.googleapis.com/v1beta/models/".concat(settings.optionsApiModel, ":generateContent?key=").concat(settings.optionsApiKey);
              _context2.n = 1;
              return fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: prompt
                    }]
                  }]
                })
              });
            case 1:
              response = _context2.v;
              if (response.ok) {
                _context2.n = 2;
                break;
              }
              throw new Error("Gemini API\u9519\u8BEF: ".concat(response.status));
            case 2:
              _context2.n = 3;
              return response.json();
            case 3:
              data = _context2.v;
              return _context2.a(2, ((_data$candidates = data.candidates) === null || _data$candidates === void 0 || (_data$candidates = _data$candidates[0]) === null || _data$candidates === void 0 || (_data$candidates = _data$candidates.content) === null || _data$candidates === void 0 || (_data$candidates = _data$candidates.parts) === null || _data$candidates === void 0 || (_data$candidates = _data$candidates[0]) === null || _data$candidates === void 0 ? void 0 : _data$candidates.text) || '');
          }
        }, _callee2);
      }));
      function callGeminiAPI(_x) {
        return _callGeminiAPI.apply(this, arguments);
      }
      return callGeminiAPI;
    }()
    /**
     * 调用OpenAI API
     * @param {string} prompt - 提示文本
     * @returns {Promise<string>}
     */
    )
  }, {
    key: "callOpenAIAPI",
    value: (function () {
      var _callOpenAIAPI = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(prompt) {
        var _data$choices;
        var settings, url, response, data;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              settings = getSettings();
              url = "".concat(settings.optionsBaseUrl, "/chat/completions");
              _context3.n = 1;
              return fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': "Bearer ".concat(settings.optionsApiKey)
                },
                body: JSON.stringify({
                  model: settings.optionsApiModel,
                  messages: [{
                    role: 'user',
                    content: prompt
                  }],
                  temperature: 0.8,
                  max_tokens: 500
                })
              });
            case 1:
              response = _context3.v;
              if (response.ok) {
                _context3.n = 2;
                break;
              }
              throw new Error("OpenAI API\u9519\u8BEF: ".concat(response.status));
            case 2:
              _context3.n = 3;
              return response.json();
            case 3:
              data = _context3.v;
              return _context3.a(2, ((_data$choices = data.choices) === null || _data$choices === void 0 || (_data$choices = _data$choices[0]) === null || _data$choices === void 0 || (_data$choices = _data$choices.message) === null || _data$choices === void 0 ? void 0 : _data$choices.content) || '');
          }
        }, _callee3);
      }));
      function callOpenAIAPI(_x2) {
        return _callOpenAIAPI.apply(this, arguments);
      }
      return callOpenAIAPI;
    }()
    /**
     * 显示生成中UI
     * @param {string} message - 显示消息
     * @param {number} duration - 持续时间
     */
    )
  }, {
    key: "showGeneratingUI",
    value: function showGeneratingUI(message) {
      var _this = this;
      var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      this.hideGeneratingUI();
      var container = createElement('div', {
        id: 'ti-generating-container',
        className: 'ti-generating-container'
      });
      var spinner = createElement('div', {
        className: 'ti-spinner'
      });
      var text = createElement('div', {
        className: 'ti-generating-text'
      }, message);
      container.appendChild(spinner);
      container.appendChild(text);
      var chatContainer = document.querySelector('#chat, .chat');
      if (chatContainer) {
        chatContainer.appendChild(container);
      }
      if (duration) {
        setTimeout(function () {
          return _this.hideGeneratingUI();
        }, duration);
      }
    }

    /**
     * 隐藏生成中UI
     */
  }, {
    key: "hideGeneratingUI",
    value: function hideGeneratingUI() {
      var container = document.getElementById('ti-generating-container');
      if (container) {
        safeRemoveElement(container);
      }
    }

    /**
     * 显示选项
     * @param {string[]} options - 选项数组
     */
  }, {
    key: "displayOptions",
    value: (function () {
      var _displayOptions = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(options) {
        var _this2 = this;
        var container, _iterator, _step, _loop, chatContainer, _t2;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.p = _context5.n) {
            case 0:
              this.hideOptions();
              container = createElement('div', {
                id: 'ti-options-container',
                className: 'ti-options-container'
              });
              _iterator = _createForOfIteratorHelper(options);
              _context5.p = 1;
              _loop = /*#__PURE__*/_regenerator().m(function _loop() {
                var text, btn, i;
                return _regenerator().w(function (_context4) {
                  while (1) switch (_context4.n) {
                    case 0:
                      text = _step.value;
                      btn = createElement('button', {
                        className: 'qr--button menu_button interactable ti-options-capsule'
                      }); // 打字机效果
                      i = 0;
                    case 1:
                      if (!(i < text.length)) {
                        _context4.n = 3;
                        break;
                      }
                      btn.textContent = text.substring(0, i + 1);
                      _context4.n = 2;
                      return _this2.sleep(15);
                    case 2:
                      i++;
                      _context4.n = 1;
                      break;
                    case 3:
                      btn.onclick = function () {
                        var textarea = document.querySelector('#send_textarea, .send_textarea');
                        if (textarea) {
                          textarea.value = text;
                          textarea.dispatchEvent(new Event('input', {
                            bubbles: true
                          }));
                          textarea.focus();
                        }
                        container.remove();
                      };
                      container.appendChild(btn);
                    case 4:
                      return _context4.a(2);
                  }
                }, _loop);
              });
              _iterator.s();
            case 2:
              if ((_step = _iterator.n()).done) {
                _context5.n = 4;
                break;
              }
              return _context5.d(_regeneratorValues(_loop()), 3);
            case 3:
              _context5.n = 2;
              break;
            case 4:
              _context5.n = 6;
              break;
            case 5:
              _context5.p = 5;
              _t2 = _context5.v;
              _iterator.e(_t2);
            case 6:
              _context5.p = 6;
              _iterator.f();
              return _context5.f(6);
            case 7:
              chatContainer = document.querySelector('#chat, .chat');
              if (chatContainer) {
                chatContainer.appendChild(container);
              }
            case 8:
              return _context5.a(2);
          }
        }, _callee4, this, [[1, 5, 6, 7]]);
      }));
      function displayOptions(_x3) {
        return _displayOptions.apply(this, arguments);
      }
      return displayOptions;
    }()
    /**
     * 隐藏选项
     */
    )
  }, {
    key: "hideOptions",
    value: function hideOptions() {
      var container = document.getElementById('ti-options-container');
      if (container) {
        safeRemoveElement(container);
      }
    }

    /**
     * 延时函数
     * @param {number} ms - 毫秒数
     * @returns {Promise}
     */
  }, {
    key: "sleep",
    value: function sleep(ms) {
      return new Promise(function (resolve) {
        return setTimeout(resolve, ms);
      });
    }
  }]);
}();
;// ./src/ui/settings-panel.js
function settings_panel_typeof(o) { "@babel/helpers - typeof"; return settings_panel_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, settings_panel_typeof(o); }
function settings_panel_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = settings_panel_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function settings_panel_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return settings_panel_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? settings_panel_arrayLikeToArray(r, a) : void 0; } }
function settings_panel_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function settings_panel_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function settings_panel_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, settings_panel_toPropertyKey(o.key), o); } }
function settings_panel_createClass(e, r, t) { return r && settings_panel_defineProperties(e.prototype, r), t && settings_panel_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function settings_panel_toPropertyKey(t) { var i = settings_panel_toPrimitive(t, "string"); return "symbol" == settings_panel_typeof(i) ? i : i + ""; }
function settings_panel_toPrimitive(t, r) { if ("object" != settings_panel_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != settings_panel_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }





/**
 * 设置面板类
 */
var SettingsPanel = /*#__PURE__*/function () {
  function SettingsPanel() {
    settings_panel_classCallCheck(this, SettingsPanel);
    this.settings = getSettings();
  }

  /**
   * 创建设置界面
   */
  return settings_panel_createClass(SettingsPanel, [{
    key: "createSettingsPanel",
    value: function createSettingsPanel() {
      // 尝试多个可能的容器ID
      var settingsContainer = document.getElementById('typing_indicator_container');
      if (!settingsContainer) {
        settingsContainer = document.getElementById('extensions_settings');
      }
      if (!settingsContainer) {
        settingsContainer = document.getElementById('extensions_settings_container');
      }
      if (!settingsContainer) {
        // 如果都找不到，尝试查找包含"extensions"的容器
        var containers = document.querySelectorAll('[id*="extension"], [id*="settings"]');
        var _iterator = settings_panel_createForOfIteratorHelper(containers),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var container = _step.value;
            if (container.id.includes('extension') || container.id.includes('settings')) {
              settingsContainer = container;
              break;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      if (!settingsContainer) {
        console.error('AI助手扩展：无法找到设置容器');
        return;
      }
      console.log('AI助手扩展：找到设置容器', settingsContainer.id);
      var inlineDrawer = createElement('div', {
        className: 'inline-drawer'
      });
      settingsContainer.append(inlineDrawer);
      var inlineDrawerToggle = createElement('div', {
        className: 'inline-drawer-toggle inline-drawer-header'
      });
      var extensionName = createElement('b', {}, 'AI助手');
      var inlineDrawerIcon = createElement('div', {
        className: 'inline-drawer-icon fa-solid fa-circle-chevron-down down'
      });
      inlineDrawerToggle.append(extensionName, inlineDrawerIcon);
      var inlineDrawerContent = createElement('div', {
        className: 'inline-drawer-content'
      });
      inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

      // 创建选项生成设置
      var optionsContainer = this.createOptionsSettings();
      inlineDrawerContent.append(optionsContainer);

      // 创建重置设置
      var resetContainer = this.createResetSettings();
      inlineDrawerContent.append(resetContainer);
      console.log('AI助手扩展：设置面板创建完成');
      return inlineDrawer;
    }

    /**
     * 创建选项生成设置
     * @returns {HTMLElement}
     */
  }, {
    key: "createOptionsSettings",
    value: function createOptionsSettings() {
      var _this = this;
      var optionsContainer = createElement('div', {
        style: {
          marginTop: '20px',
          borderTop: '1px solid var(--border_color)',
          paddingTop: '15px'
        }
      });
      var optionsHeader = createElement('h4', {
        style: {
          margin: '0 0 10px 0'
        }
      }, '回复选项生成');
      optionsContainer.appendChild(optionsHeader);

      // 启用选项生成
      var optionsEnabledLabel = createElement('label', {
        className: 'checkbox_label'
      });
      var optionsEnabledCheckbox = createElement('input', {
        type: 'checkbox'
      });
      optionsEnabledCheckbox.checked = this.settings.optionsGenEnabled;
      optionsEnabledCheckbox.addEventListener('change', function () {
        _this.settings.optionsGenEnabled = optionsEnabledCheckbox.checked;
        _this.optionsSettingsContainer.style.display = _this.settings.optionsGenEnabled ? 'block' : 'none';
        (window.saveSettingsDebounced || window.saveSettings)();
      });
      var optionsEnabledText = createElement('span', {}, '启用回复选项生成');
      optionsEnabledLabel.append(optionsEnabledCheckbox, optionsEnabledText);
      optionsContainer.appendChild(optionsEnabledLabel);

      // 调试模式
      var debugLabel = createElement('label', {
        className: 'checkbox_label',
        style: {
          marginLeft: '10px'
        }
      });
      var debugCheckbox = createElement('input', {
        type: 'checkbox'
      });
      debugCheckbox.checked = this.settings.debug;
      debugCheckbox.addEventListener('change', function () {
        _this.settings.debug = debugCheckbox.checked;
        (window.saveSettingsDebounced || window.saveSettings)();
      });
      var debugText = createElement('span', {}, '启用调试日志');
      debugLabel.append(debugCheckbox, debugText);
      optionsContainer.appendChild(debugLabel);

      // 选项设置容器
      this.optionsSettingsContainer = createElement('div', {
        style: {
          marginTop: '10px',
          display: this.settings.optionsGenEnabled ? 'block' : 'none'
        }
      });

      // API Type
      var apiTypeLabel = createElement('label', {
        style: {
          display: 'block',
          marginTop: '10px'
        }
      }, 'API 类型:');
      var apiTypeSelect = createElement('select', {
        id: 'options-api-type',
        style: {
          width: '100%'
        }
      });
      apiTypeSelect.innerHTML = "\n            <option value=\"".concat(API_TYPES.OPENAI, "\">OpenAI-\u517C\u5BB9</option>\n            <option value=\"").concat(API_TYPES.GEMINI, "\">Google Gemini</option>\n        ");
      apiTypeSelect.value = this.settings.optionsApiType;
      this.optionsSettingsContainer.appendChild(apiTypeLabel);
      this.optionsSettingsContainer.appendChild(apiTypeSelect);

      // API Key
      var apiKeyLabel = createElement('label', {
        style: {
          display: 'block',
          marginTop: '10px'
        }
      }, 'API密钥:');
      var apiKeyInput = createElement('input', {
        type: 'password',
        placeholder: '输入API密钥',
        style: {
          width: '100%'
        }
      });
      apiKeyInput.value = this.settings.optionsApiKey;
      apiKeyInput.addEventListener('input', function () {
        _this.settings.optionsApiKey = apiKeyInput.value;
        (window.saveSettingsDebounced || window.saveSettings)();
      });
      this.optionsSettingsContainer.appendChild(apiKeyLabel);
      this.optionsSettingsContainer.appendChild(apiKeyInput);

      // 模型选择
      var modelLabel = createElement('label', {
        style: {
          display: 'block',
          marginTop: '10px'
        }
      }, '模型:');
      var modelInput = createElement('input', {
        type: 'text',
        placeholder: '输入模型名称',
        style: {
          width: '100%'
        }
      });
      modelInput.value = this.settings.optionsApiModel;
      modelInput.addEventListener('input', function () {
        _this.settings.optionsApiModel = modelInput.value;
        (window.saveSettingsDebounced || window.saveSettings)();
      });
      this.optionsSettingsContainer.appendChild(modelLabel);
      this.optionsSettingsContainer.appendChild(modelInput);

      // 基础URL
      this.baseUrlGroup = createElement('div', {
        id: 'options-base-url-group'
      });
      var baseUrlLabel = createElement('label', {
        style: {
          display: 'block',
          marginTop: '10px'
        }
      }, '基础URL:');
      var baseUrlInput = createElement('input', {
        type: 'text',
        placeholder: '输入API基础URL',
        style: {
          width: '100%'
        }
      });
      baseUrlInput.value = this.settings.optionsBaseUrl;
      baseUrlInput.addEventListener('input', function () {
        _this.settings.optionsBaseUrl = baseUrlInput.value;
        (window.saveSettingsDebounced || window.saveSettings)();
      });
      this.baseUrlGroup.appendChild(baseUrlLabel);
      this.baseUrlGroup.appendChild(baseUrlInput);
      this.optionsSettingsContainer.appendChild(this.baseUrlGroup);

      // API类型切换事件
      apiTypeSelect.addEventListener('change', function () {
        _this.settings.optionsApiType = apiTypeSelect.value;
        _this.baseUrlGroup.style.display = _this.settings.optionsApiType === API_TYPES.OPENAI ? 'block' : 'none';
        (window.saveSettingsDebounced || window.saveSettings)();
      });

      // 初始状态
      this.baseUrlGroup.style.display = this.settings.optionsApiType === API_TYPES.OPENAI ? 'block' : 'none';
      optionsContainer.appendChild(this.optionsSettingsContainer);
      return optionsContainer;
    }

    /**
     * 创建重置设置
     * @returns {HTMLElement}
     */
  }, {
    key: "createResetSettings",
    value: function createResetSettings() {
      var _this2 = this;
      var resetContainer = createElement('div', {
        style: {
          marginTop: '20px',
          borderTop: '1px solid var(--border_color)',
          paddingTop: '15px'
        }
      });
      var resetHeader = createElement('h4', {
        style: {
          margin: '0 0 10px 0'
        }
      }, '重置设置');
      var resetButton = createElement('button', {
        className: 'menu_button',
        style: {
          width: '100%',
          padding: '8px 12px',
          backgroundColor: 'var(--SmartThemeBlurple)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, '重置所有设置为默认值');
      resetButton.addEventListener('click', function () {
        if (confirm('确定要将所有设置重置为默认值吗？此操作不可撤销。')) {
          // 重置所有设置为默认值
          resetSettings();
          _this2.settings = getSettings();

          // 更新UI显示
          _this2.updateUIFromSettings();

          // 保存设置
          (window.saveSettingsDebounced || window.saveSettings)();

          // 显示成功消息
          console.log('设置已重置为默认值');
          alert('设置已重置为默认值');
        }
      });
      resetContainer.appendChild(resetHeader);
      resetContainer.appendChild(resetButton);
      return resetContainer;
    }

    /**
     * 从设置更新UI
     */
  }, {
    key: "updateUIFromSettings",
    value: function updateUIFromSettings() {
      var _document$querySelect, _document$querySelect2, _apiTypeSelect$parent, _apiTypeSelect$parent2, _apiTypeSelect$parent3;
      // 更新复选框
      var optionsEnabledCheckbox = (_document$querySelect = document.querySelector('#options-api-type')) === null || _document$querySelect === void 0 || (_document$querySelect = _document$querySelect.parentElement) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.querySelector('input[type="checkbox"]');
      if (optionsEnabledCheckbox) {
        optionsEnabledCheckbox.checked = this.settings.optionsGenEnabled;
      }
      var debugCheckbox = (_document$querySelect2 = document.querySelector('#options-api-type')) === null || _document$querySelect2 === void 0 || (_document$querySelect2 = _document$querySelect2.parentElement) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.querySelectorAll('input[type="checkbox"]')[1];
      if (debugCheckbox) {
        debugCheckbox.checked = this.settings.debug;
      }

      // 更新输入框
      var apiTypeSelect = document.getElementById('options-api-type');
      if (apiTypeSelect) {
        apiTypeSelect.value = this.settings.optionsApiType;
      }
      var apiKeyInput = apiTypeSelect === null || apiTypeSelect === void 0 || (_apiTypeSelect$parent = apiTypeSelect.parentElement) === null || _apiTypeSelect$parent === void 0 ? void 0 : _apiTypeSelect$parent.querySelector('input[type="password"]');
      if (apiKeyInput) {
        apiKeyInput.value = this.settings.optionsApiKey;
      }
      var modelInput = apiTypeSelect === null || apiTypeSelect === void 0 || (_apiTypeSelect$parent2 = apiTypeSelect.parentElement) === null || _apiTypeSelect$parent2 === void 0 ? void 0 : _apiTypeSelect$parent2.querySelectorAll('input[type="text"]')[0];
      if (modelInput) {
        modelInput.value = this.settings.optionsApiModel;
      }
      var baseUrlInput = apiTypeSelect === null || apiTypeSelect === void 0 || (_apiTypeSelect$parent3 = apiTypeSelect.parentElement) === null || _apiTypeSelect$parent3 === void 0 ? void 0 : _apiTypeSelect$parent3.querySelectorAll('input[type="text"]')[1];
      if (baseUrlInput) {
        baseUrlInput.value = this.settings.optionsBaseUrl;
      }

      // 更新UI状态
      if (this.optionsSettingsContainer) {
        this.optionsSettingsContainer.style.display = this.settings.optionsGenEnabled ? 'block' : 'none';
      }
      if (this.baseUrlGroup) {
        this.baseUrlGroup.style.display = this.settings.optionsApiType === API_TYPES.OPENAI ? 'block' : 'none';
      }
    }
  }]);
}();
;// ./src/ui/styles.js
function styles_typeof(o) { "@babel/helpers - typeof"; return styles_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, styles_typeof(o); }
function styles_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function styles_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, styles_toPropertyKey(o.key), o); } }
function styles_createClass(e, r, t) { return r && styles_defineProperties(e.prototype, r), t && styles_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function styles_toPropertyKey(t) { var i = styles_toPrimitive(t, "string"); return "symbol" == styles_typeof(i) ? i : i + ""; }
function styles_toPrimitive(t, r) { if ("object" != styles_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != styles_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


/**
 * 样式管理类
 */
var StyleManager = /*#__PURE__*/function () {
  function StyleManager() {
    styles_classCallCheck(this, StyleManager);
    this.injectGlobalStyles();
    this.applyBasicStyle();
  }

  /**
   * 应用基本样式
   */
  return styles_createClass(StyleManager, [{
    key: "applyBasicStyle",
    value: function applyBasicStyle() {
      var styleTag = document.getElementById('typing-indicator-theme-style');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'typing-indicator-theme-style';
        document.head.appendChild(styleTag);
      }

      // 恢复为原始透明背景样式，移除所有渐变、圆角和阴影
      styleTag.textContent = "\n            .typing_indicator {\n                background-color: transparent; /* \u6062\u590D\u900F\u660E\u80CC\u666F */\n                padding: 8px 16px;\n                margin: 8px auto;\n                width: fit-content;\n                max-width: 90%;\n                text-align: center;\n                color: var(--text_color); /* \u4F7F\u7528\u4E3B\u9898\u7684\u9ED8\u8BA4\u6587\u5B57\u989C\u8272 */\n            }\n        ";
    }

    /**
     * 注入全局样式
     */
  }, {
    key: "injectGlobalStyles",
    value: function injectGlobalStyles() {
      var css = "\n            /* \u6838\u5FC3\u6307\u793A\u5668\u6837\u5F0F\u4FEE\u590D */\n            #typing_indicator.typing_indicator {\n                opacity: 1 !important;\n                background-color: transparent !important;\n            }\n\n            /* \u9009\u9879\u5BB9\u5668\u6837\u5F0F */\n            .ti-options-container {\n                display: flex;\n                flex-wrap: wrap;\n                gap: 8px;\n                margin: 10px 0;\n                padding: 10px;\n                background: var(--SmartThemeBlurple);\n                border-radius: 8px;\n                animation: fadeIn 0.3s ease-in;\n            }\n\n            .ti-options-capsule {\n                background: var(--SmartThemeBlurple);\n                color: white;\n                border: 1px solid var(--border_color);\n                border-radius: 20px;\n                padding: 8px 16px;\n                margin: 4px;\n                cursor: pointer;\n                transition: all 0.2s ease;\n                font-size: 14px;\n                white-space: nowrap;\n                overflow: hidden;\n                text-overflow: ellipsis;\n                max-width: 200px;\n            }\n\n            .ti-options-capsule:hover {\n                background: var(--SmartThemeBlurple);\n                transform: translateY(-2px);\n                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);\n            }\n\n            /* \u751F\u6210\u4E2DUI\u6837\u5F0F */\n            .ti-generating-container {\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                gap: 10px;\n                margin: 10px 0;\n                padding: 10px;\n                background: var(--SmartThemeBlurple);\n                border-radius: 8px;\n                color: white;\n            }\n\n            .ti-spinner {\n                width: 20px;\n                height: 20px;\n                border: 2px solid rgba(255, 255, 255, 0.3);\n                border-top: 2px solid white;\n                border-radius: 50%;\n                animation: spin 1s linear infinite;\n            }\n\n            .ti-generating-text {\n                font-size: 14px;\n                font-weight: 500;\n            }\n\n            /* \u52A8\u753B */\n            @keyframes spin {\n                0% { transform: rotate(0deg); }\n                100% { transform: rotate(360deg); }\n            }\n\n            @keyframes fadeIn {\n                from { opacity: 0; transform: translateY(10px); }\n                to { opacity: 1; transform: translateY(0); }\n            }\n\n            /* \u6253\u5B57\u6307\u793A\u5668\u6837\u5F0F */\n            .typing_indicator {\n                background-color: transparent;\n                padding: 8px 16px;\n                margin: 8px auto;\n                width: fit-content;\n                max-width: 90%;\n                text-align: center;\n                color: var(--text_color);\n                opacity: 1 !important;\n            }\n\n            .typing-ellipsis {\n                display: inline-block;\n                animation: typing-dots 1.5s infinite;\n            }\n\n            @keyframes typing-dots {\n                0%, 20% { opacity: 0; }\n                50% { opacity: 1; }\n                100% { opacity: 0; }\n            }\n\n            .typing-ellipsis::after {\n                content: '...';\n                animation: typing-dots 1.5s infinite;\n            }\n\n            /* \u8BBE\u7F6E\u9762\u677F\u6837\u5F0F */\n            .inline-drawer {\n                margin-bottom: 10px;\n            }\n\n            .inline-drawer-toggle {\n                cursor: pointer;\n                padding: 10px;\n                background: var(--SmartThemeBlurple);\n                color: white;\n                border-radius: 4px;\n                display: flex;\n                justify-content: space-between;\n                align-items: center;\n            }\n\n            .inline-drawer-content {\n                padding: 15px;\n                border: 1px solid var(--border_color);\n                border-top: none;\n                border-radius: 0 0 4px 4px;\n                background: var(--SmartThemeBody);\n            }\n\n            .checkbox_label {\n                display: flex;\n                align-items: center;\n                gap: 8px;\n                margin-bottom: 10px;\n                cursor: pointer;\n            }\n\n            .checkbox_label input[type=\"checkbox\"] {\n                margin: 0;\n            }\n\n            /* \u54CD\u5E94\u5F0F\u8BBE\u8BA1 */\n            @media (max-width: 768px) {\n                .ti-options-container {\n                    flex-direction: column;\n                }\n\n                .ti-options-capsule {\n                    max-width: none;\n                    width: 100%;\n                }\n            }\n        ";
      injectCSS(css, 'ai-assistant-styles');
    }
  }]);
}();
;// ./src/index.js
function src_typeof(o) { "@babel/helpers - typeof"; return src_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, src_typeof(o); }
function src_classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function src_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, src_toPropertyKey(o.key), o); } }
function src_createClass(e, r, t) { return r && src_defineProperties(e.prototype, r), t && src_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function src_toPropertyKey(t) { var i = src_toPrimitive(t, "string"); return "symbol" == src_typeof(i) ? i : i + ""; }
function src_toPrimitive(t, r) { if ("object" != src_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != src_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// 导入内部模块







/**
 * AI助手扩展主类
 */
var AIAssistantExtension = /*#__PURE__*/function () {
  function AIAssistantExtension() {
    src_classCallCheck(this, AIAssistantExtension);
    this.typingIndicator = null;
    this.optionsGenerator = null;
    this.settingsPanel = null;
    this.styleManager = null;
    this.isInitialized = false;
  }

  /**
   * 获取SillyTavern的全局变量
   */
  return src_createClass(AIAssistantExtension, [{
    key: "getSillyTavernGlobals",
    value: function getSillyTavernGlobals() {
      // 尝试不同的全局变量名称
      var eventSource = window.eventSource || window.EventSource;
      var event_types = window.event_types || window.eventTypes || window.EVENT_TYPES;
      var extension_settings = window.extension_settings || window.extensionSettings;
      var saveSettingsDebounced = window.saveSettingsDebounced || window.saveSettings;
      var name2 = window.name2;
      var selected_group = window.selected_group || window.selectedGroup;
      var isStreamingEnabled = window.isStreamingEnabled;
      console.log('AI助手扩展：获取到的全局变量', {
        eventSource: !!eventSource,
        event_types: !!event_types,
        extension_settings: !!extension_settings,
        saveSettingsDebounced: !!saveSettingsDebounced,
        name2: !!name2,
        selected_group: !!selected_group,
        isStreamingEnabled: !!isStreamingEnabled
      });
      return {
        name2: name2,
        eventSource: eventSource,
        event_types: event_types,
        isStreamingEnabled: isStreamingEnabled,
        saveSettingsDebounced: saveSettingsDebounced,
        extension_settings: extension_settings,
        selected_group: selected_group
      };
    }

    /**
     * 初始化扩展
     */
  }, {
    key: "initialize",
    value: function initialize() {
      if (this.isInitialized) {
        logger.warn('扩展已经初始化');
        return;
      }
      try {
        logger.log('开始初始化AI助手扩展...');

        // 初始化样式管理器
        this.styleManager = new StyleManager();

        // 初始化打字指示器
        this.typingIndicator = new TypingIndicator();

        // 初始化选项生成器
        this.optionsGenerator = new OptionsGenerator();

        // 创建设置面板
        this.settingsPanel = new SettingsPanel();
        this.settingsPanel.createSettingsPanel();

        // 绑定事件监听器
        this.bindEventListeners();
        this.isInitialized = true;
        logger.log('AI助手扩展初始化完成');
      } catch (error) {
        logger.error('初始化扩展时出错:', error);
      }
    }

    /**
     * 绑定事件监听器
     */
  }, {
    key: "bindEventListeners",
    value: function bindEventListeners() {
      var _this = this;
      var globals = this.getSillyTavernGlobals();
      var settings = getSettings();

      // 打字指示器事件
      var showIndicatorEvents = [globals.event_types.GENERATION_AFTER_COMMANDS];
      var hideIndicatorEvents = [globals.event_types.GENERATION_STOPPED, globals.event_types.GENERATION_ENDED, globals.event_types.CHAT_CHANGED];
      showIndicatorEvents.forEach(function (e) {
        globals.eventSource.on(e, function (type, args, dryRun) {
          _this.typingIndicator.show(type, args, dryRun);
        });
      });
      hideIndicatorEvents.forEach(function (e) {
        globals.eventSource.on(e, function () {
          _this.typingIndicator.hide();
        });
      });

      // 手动中止事件
      globals.eventSource.on(globals.event_types.GENERATION_STOPPED, function () {
        logger.log('GENERATION_STOPPED event triggered. 设置 isManuallyStopped 为 true。');
        _this.optionsGenerator.isManuallyStopped = true;
      });

      // 生成结束事件
      globals.eventSource.on(globals.event_types.GENERATION_ENDED, function () {
        logger.log('GENERATION_ENDED event triggered.', {
          isManuallyStopped: _this.optionsGenerator.isManuallyStopped,
          optionsGenEnabled: getSettings().optionsGenEnabled
        });

        // 只有当选项生成功能启用且没有手动中止时才生成选项
        if (getSettings().optionsGenEnabled && !_this.optionsGenerator.isManuallyStopped) {
          logger.log('GENERATION_ENDED: 条件满足，触发选项生成。');
          _this.optionsGenerator.generateOptions();
        } else {
          logger.log('GENERATION_ENDED: 不满足选项生成条件，跳过。');
        }

        // 无论是否生成选项，都重置标志，为下一次生成做准备
        _this.optionsGenerator.isManuallyStopped = false;
      });

      // 聊天切换事件
      globals.eventSource.on(globals.event_types.CHAT_CHANGED, function () {
        logger.log('CHAT_CHANGED event triggered.');

        // 首先，像往常一样隐藏所有UI
        _this.typingIndicator.hide();
        _this.optionsGenerator.hideGeneratingUI();
        _this.optionsGenerator.hideOptions();

        // 然后，在新聊天加载后，检查是否需要自动生成选项
        setTimeout(function () {
          logger.log('开始延时检查...');
          var currentSettings = getSettings();
          if (!currentSettings.optionsGenEnabled) {
            logger.log('选项生成已禁用，跳过检查。');
            return;
          }
          var isLastFromAI = _this.isLastMessageFromAI();
          var optionsContainer = document.getElementById('ti-options-container');
          if (isLastFromAI && !optionsContainer) {
            logger.log('条件满足 (AI消息且无选项)，准备自动生成选项。');
            _this.optionsGenerator.generateOptions();
          } else {
            logger.log('不满足自动生成条件:', {
              isLastFromAI: isLastFromAI,
              hasOptionsContainer: !!optionsContainer,
              isGenerating: _this.optionsGenerator.isGenerating
            });
          }
        }, 500); // 延迟500毫秒以确保新聊天渲染完成
      });
    }

    /**
     * 检查最后一条消息是否来自AI
     * @returns {boolean}
     */
  }, {
    key: "isLastMessageFromAI",
    value: function isLastMessageFromAI() {
      var messages = document.querySelectorAll('.mes, .message');
      if (messages.length === 0) return false;
      var lastMessage = messages[messages.length - 1];
      return lastMessage.classList.contains('mes_assistant') || lastMessage.classList.contains('assistant');
    }

    /**
     * 获取扩展实例
     * @returns {AIAssistantExtension}
     */
  }], [{
    key: "getInstance",
    value: function getInstance() {
      if (!AIAssistantExtension.instance) {
        AIAssistantExtension.instance = new AIAssistantExtension();
      }
      return AIAssistantExtension.instance;
    }
  }]);
}();
/**
 * 等待核心系统就绪
 */
function waitForCoreSystem() {
  console.log('AI助手扩展：检查核心系统状态...');

  // 检查所有可能的全局变量
  var globalVars = {
    eventSource: window.eventSource,
    event_types: window.event_types,
    extension_settings: window.extension_settings,
    saveSettingsDebounced: window.saveSettingsDebounced,
    // 可能的替代名称
    eventSourceAlt: window.EventSource,
    extensionSettingsAlt: window.extensionSettings,
    saveSettingsAlt: window.saveSettings,
    // 检查SillyTavern特有的全局变量
    sillyTavern: window.SillyTavern,
    st: window.st,
    api: window.api,
    // 检查其他可能的变量
    name2: window.name2,
    selected_group: window.selected_group,
    isStreamingEnabled: window.isStreamingEnabled
  };
  console.log('AI助手扩展：所有全局变量检查结果', globalVars);

  // 检查必要的全局变量
  var hasEventSource = typeof window.eventSource !== 'undefined' && window.eventSource && window.eventSource.on;
  var hasExtensionSettings = typeof window.extension_settings !== 'undefined';
  var hasSaveSettingsDebounced = typeof window.saveSettingsDebounced !== 'undefined';

  // 尝试替代名称
  var hasEventSourceAlt = typeof window.EventSource !== 'undefined' && window.EventSource && window.EventSource.on;
  var hasExtensionSettingsAlt = typeof window.extensionSettings !== 'undefined';
  var hasSaveSettingsAlt = typeof window.saveSettings !== 'undefined';
  console.log('AI助手扩展：系统检查结果', {
    hasEventSource: hasEventSource,
    hasExtensionSettings: hasExtensionSettings,
    hasSaveSettingsDebounced: hasSaveSettingsDebounced,
    hasEventSourceAlt: hasEventSourceAlt,
    hasExtensionSettingsAlt: hasExtensionSettingsAlt,
    hasSaveSettingsAlt: hasSaveSettingsAlt
  });

  // 如果找到任何可用的全局变量，就尝试初始化
  if ((hasEventSource || hasEventSourceAlt) && (hasExtensionSettings || hasExtensionSettingsAlt) && (hasSaveSettingsDebounced || hasSaveSettingsAlt)) {
    console.log('AI助手扩展：核心事件系统已就绪，初始化插件。');
    var extension = AIAssistantExtension.getInstance();
    extension.initialize();
  } else {
    console.log('AI助手扩展：等待核心事件系统加载...');
    // 增加延迟时间，避免过于频繁的检查
    setTimeout(waitForCoreSystem, 1000);
  }
}

// 启动就绪检查
waitForCoreSystem();

// 暴露给全局作用域，确保SillyTavern能够找到扩展
window.typing_indicator_extension = {
  initialize: function initialize() {
    var extension = AIAssistantExtension.getInstance();
    extension.initialize();
  },
  getInstance: function getInstance() {
    return AIAssistantExtension.getInstance();
  }
};

// 兼容性：也暴露为全局函数
window.initializeTypingIndicator = function () {
  var extension = AIAssistantExtension.getInstance();
  extension.initialize();
};
/******/ })()
;