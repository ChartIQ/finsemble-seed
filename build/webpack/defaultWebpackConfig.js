const path = require("path");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");
const { DefinePlugin } = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const { getWebpackPublicPathVariable } = require("../buildHelpers");
const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";

/**
 * This rule will compile all imported CSS files into local <style> tags which are inlined into .js files.
 * When in development, sourceMap may cause style-loader to convert to <link> tags. This seems to vary from
 * version to version of style-loader.
 */
const CSS_RULE = {
	test: /\.s?css$/i,
	use: [
		"style-loader",
		{
			loader: "css-loader",
			options: {
				sourceMap: env !== "production",
			},
		},
	],
};

/**
 * This rule will convert imported images and fonts into standalone assets.
 * The assets are compiled into /assets/file-loader/ to distinguish them from static assets.
 * See webpack url-loader to convert this into inlining as desired.
 */
const IMAGE_AND_FONT_RULE = {
	test: /\.(png|img|ttf|ottf|eot|woff|woff2|svg)$/,
	use: {
		loader: "file-loader",
		options: {
			name: "[name].[ext]",
			outputPath: "/assets/file-loader/",
		},
	},
};

/**
 * This is a rule for compiling JSX files using babel.
 */
const JSX_RULE = {
	test: /\.js(x)?$/,
	exclude: /node_modules/,
	use: {
		loader: "babel-loader",
		options: {
			cacheDirectory: ".webpack-file-cache",
			presets: [
				[
					"@babel/preset-env",
					{
						targets: {
							browsers: "Chrome 70",
						},
						modules: "commonjs",
					},
				],
				"@babel/preset-react",
			],
			plugins: [
				"babel-plugin-add-module-exports",
				"@babel/plugin-proposal-export-default-from",
				"@babel/plugin-transform-modules-commonjs",
				"@babel/plugin-proposal-class-properties",
				["@babel/plugin-proposal-decorators", { decoratorsBeforeExport: false }],
				["@babel/plugin-transform-runtime", { regenerator: true }],
			],
		},
	},
};

/**
 * This rule will compile all .ts and .tsx files. ts-loader uses tsc. Modify the .tsconfig file to change typescript compilation behavior.
 */
const TSX_RULE = {
	test: /\.ts(x)?$/,
	loader: "ts-loader",
	exclude: /node_modules/,
};

/**
 * This rule allows webpack to transfer source maps from imported libraries, combining them into the source map for the actual file that
 * it is bundling. This gives developers the ability to debug all the way down into imports from node_modules.
 */
const SOURCE_MAPS_RULE = {
	enforce: "pre",
	test: /\.js$/,
	loader: "source-map-loader",
};

/**
 * The DefinePlugin is used to set environment variables that are used by gulpfile.js tasks.
 *
 * The HardSourceWebpackPlugin implements incremental compilation. This greatly speeds up build time. Use `npm dev clean` to erase cache files in case of any build problems.
 */
let plugins = [
	new DefinePlugin({
		"process.env": {
			NODE_ENV: JSON.stringify(env),
		},
	}),
	new CaseSensitivePathsPlugin(),
];

/**
 * HardSourceWebpackPlugin is currently not working correctly on Mac when using non-default cache folder.
 * https://github.com/mzgoddard/hard-source-webpack-plugin/issues/456
 */
if (process.platform !== "darwin") {
	plugins.push(
		new HardSourceWebpackPlugin({
			info: {
				level: "warn",
			},
			cacheDirectory: "../.webpack-file-cache/[confighash]",
		})
	);
}

/**
 * Uncomment this plugin if you want to analyze bundle size. Separate tabs should open in chrome browser for each webpack script.
 */
//plugins.push(new BundleAnalyzerPlugin({ analyzerMode: "static" }));

/**
 * Aliases ensure that singleton libraries, such as react-dom, are only imported once.
 * When external libraries themselves depend upon react-dom, it becomes possible for webpack to include more
 * than one instance of the library which confuses react-dom. The alias webpack entry will
 * ensure that all unpacked dependencies point to the same physical import.
 *
 * These imports are also packed using DllPlugin into vendor.bundle.js in order to speed loading times for commonly used imports.
 */
const aliases = {
	"@babel/runtime": path.resolve("./node_modules/@babel/runtime"),
	async: path.resolve("./node_modules/async"),
	react: path.resolve("./node_modules/react"),
	"react-dom": path.resolve("./node_modules/react-dom"),
};

const generateDefaultConfig = () => {
	return {
		devtool: env === "production" ? "source-map" : "eval-source-map",
		entry: {},
		stats: "minimal",
		module: {
			rules: [CSS_RULE, IMAGE_AND_FONT_RULE, JSX_RULE, TSX_RULE, SOURCE_MAPS_RULE],
		},
		mode: env,
		plugins: plugins,
		optimization: {
			usedExports: true,
		},
		output: {
			filename: "[name].js",
			sourceMapFilename: "[name].map.js",
			path: path.resolve(__dirname, "../../dist/"),
			// if you want to serve assets from a subdirectory, you need
			// to set WEBPACK_PUBLIC_PATH on process.env, or set webpackPublicPath
			// in `server-environment-startup.json` for your given environment
			publicPath: getWebpackPublicPathVariable(),
		},
		resolve: {
			alias: aliases,
			extensions: [".tsx", ".ts", ".js", ".jsx", ".json", ".scss", ".css", ".html"],
			modules: ["./node_modules"],
		},
	};
};

module.exports = { generateDefaultConfig };
