const path = require("path");
// const webpack = require("webpack")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    entry: {
        popup: [path.join(__dirname, 'src/js/components/popup/index')],
        options: [path.join(__dirname, 'src/js/components/options/index')],
        content: [path.join(__dirname, 'src/js/components/content/index')],
        // hot: 'webpack/hot/dev-server.js',
        // background: [path.join(__dirname, 'src/background')],
    },
    output: {
        path: __dirname + '/build',
        filename: '[name].bundle.js',
    },
    performance: {
        hints: false
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'build'),
        },
        compress: true,
        port: 9000,
        // hot: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".jsx"],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader"],
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: ["ts-loader"],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            // modules: true,
                            // sourceMap: true,
                            importLoaders: true,
                        },
                    },
                    'sass-loader'
                ],
            },
        ]
    },
    plugins: [
        // new webpack.HotModuleReplacementPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "src/manifest.json",
                    transform: function (content, path) {
                        return Buffer.from(JSON.stringify({
                            description: process.env.npm_package_description,
                            version: process.env.npm_package_version,
                            ...JSON.parse(content.toString())
                        }))
                    }
                },
                {
                    from: "src/icons",
                    to: "icons"
                }
            ],
        }),
        new HtmlWebpackPlugin({
            template: 'src/popup.html',
            filename: 'popup.html',
            chunks: ['vendors', 'popup'],
            inject: 'body'
        }),
        new HtmlWebpackPlugin({
            template: 'src/options.html',
            filename: 'options.html',
            chunks: ['vendors', 'options'],
            inject: 'body'
        }),
    ],
    mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
    devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false,
    optimization: {
        minimize: process.env.NODE_ENV !== 'development',
        // splitChunks: {
        //     chunks: (chunk) => chunk.name !== 'content',
        //     cacheGroups: {
        //         vendor: {
        //             test: /[\\/]node_modules[\\/]/,
        //             name: 'vendors',
        //             chunks: 'all',
        //         },
        //     },
        // },
    },
};
