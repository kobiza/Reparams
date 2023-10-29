const path = require("path");

module.exports = {
    entry: {
        content: [path.join(__dirname, 'src/content')],
        Popup: [path.join(__dirname, 'src/popup/Popup')],
        Settings: [path.join(__dirname, 'src/settings/Settings')],
        // background: [path.join(__dirname, 'src/background')],
    },
    output: {
        path: __dirname + '/build/js',
        filename: '[name].bundle.js',
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

    mode: 'development',
    devtool: 'source-map',
    optimization: {
        minimize: false
    },
};
