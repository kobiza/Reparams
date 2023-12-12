const path = require("path");
// const webpack = require("webpack")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
    entry: {
        content: [path.join(__dirname, 'src/content')],
        Popup: [path.join(__dirname, 'src/popup/Popup')],
        Settings: [path.join(__dirname, 'src/settings/Settings')],
        // hot: 'webpack/hot/dev-server.js',
        // background: [path.join(__dirname, 'src/background')],
    },
    output: {
        path: __dirname + '/build',
        filename: '[name].bundle.js',
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
                {from: "src/options.html"},
                {from: "src/popup.html"},
                {
                    from: "src/icons",
                    to: "icons"
                }
            ],
        }),
    ],
    mode: 'development',
    devtool: 'source-map',
    optimization: {
        minimize: false
    },
};
