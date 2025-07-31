module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'indent': ['error', 4],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  globals: {
    'eventSource': 'readonly',
    'event_types': 'readonly',
    'extension_settings': 'readonly',
    'selected_group': 'readonly',
    'name2': 'readonly',
    'isStreamingEnabled': 'readonly',
    'saveSettingsDebounced': 'readonly',
  }
}; 