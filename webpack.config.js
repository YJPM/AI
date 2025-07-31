const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      library: {
        name: 'AIAssistantExtension',
        type: 'umd',
        export: 'default'
      },
      globalObject: 'this'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not dead']
                  },
                  useBuiltIns: 'usage',
                  corejs: 3
                }]
              ]
            }
          }
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.json']
    },
    devtool: isProduction ? false : 'source-map',
    optimization: {
      minimize: isProduction
    },
    externals: {
      // 外部依赖，这些将由SillyTavern提供
      'script.js': 'commonjs script.js',
      'extensions.js': 'commonjs extensions.js',
      'group-chats.js': 'commonjs group-chats.js'
    }
  };
}; 