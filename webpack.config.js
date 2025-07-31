const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  mode: 'production',
  optimization: {
    minimize: false, // 保持代码可读性，便于调试
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    }
  },
  externals: {
    // 外部依赖，这些将由SillyTavern提供
    '../../../../script.js': 'commonjs2 ../../../../script.js',
    '../../../extensions.js': 'commonjs2 ../../../extensions.js',
    '../../../group-chats.js': 'commonjs2 ../../../group-chats.js',
  }
}; 