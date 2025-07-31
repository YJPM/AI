const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const serverConfig = {
    devtool: 'source-map',
    target: 'browserslist',
    entry: './src/index.js',
    output: {
        path: path.resolve('.', 'dist'),
        filename: 'index.js',
        libraryTarget: 'module',
        libraryExport: 'default',
    },
    resolve: {
        extensions: ['.js'],
    },
    module: {
        rules: [
            {
                test: /\.js/,
                exclude: /node_modules/,
                options: {
                    cacheDirectory: true,
                    presets: [
                        ['@babel/preset-env', { "modules": false }],
                    ],
                    sourceMaps: true,
                },
                loader: 'babel-loader',
            },
        ],
    },
    experiments: {
        outputModule: true,
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
            }),
        ],
    },
    plugins: [],
    externals: function({ context, request }, callback) {
        if (request.startsWith('../../') || request.includes('libs/')) {
            if(context.search(/(\/|\\)src\1/) > 0)
                return callback(null, request.substring(3));
            return callback(null, request);
        } else if(request.startsWith('https://') || request.startsWith('http://')) {
            return callback(null, request);
        }
        callback();
    },
};

module.exports = [serverConfig]; 