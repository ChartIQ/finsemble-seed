const path = require("path");
const preloadFilesToBuild = require("./webpack.preloads.entries.json");
const { EnvironmentPlugin } = require("webpack");
const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";

let entries = {};
for (let key in preloadFilesToBuild) {
	let component = preloadFilesToBuild[key];
	entries[component.output] = component.entry;
}

module.exports = {
    plugins: [],
    devtool: env === 'production' ? 'source-map' : 'eval-source-map',
    entry: entries,
    stats: "minimal",
    module: {
        rules: [
            {
                test: /\.js(x)?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        cacheDirectory: '.webpack-file-cache',
                        presets: [
                            ["@babel/preset-env", {
                                targets: {
                                    browsers: "Chrome 70"
                                },
                                modules: "commonjs"
                            }],
                            "@babel/preset-react"],
                        plugins: [
                            "babel-plugin-add-module-exports",
                            "@babel/plugin-proposal-export-default-from",
                            "@babel/plugin-transform-modules-commonjs",
                            "@babel/plugin-proposal-class-properties",
                            ["@babel/plugin-proposal-decorators", { decoratorsBeforeExport: false }],
                            ["@babel/plugin-transform-runtime", { regenerator: true }]
                        ]
                    }
                }
            },
            {
                test: /\.ts(x)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    output: {
        filename: "[name].js",
        sourceMapFilename: "[name].map.js",
        path: path.resolve(__dirname, '../../dist/')
    },
    resolve: {
        extensions: ['.ts','.tsx','.js', '.jsx', '.json', 'scss', 'html']
    },
};