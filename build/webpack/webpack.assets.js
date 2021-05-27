/**
 * This webpack configuration is responsible for building the "assets" directory.
 * This is just a matter of copying files. First, files from @finsemble/finsemble-ui's assets directory
 * are copied into dist. Then the seed's assets folder is copied over.
 *
 * Note, webpack isn't really the right tool to be doing this but it gives us "watch" capability.
 * In the future, gulp + chokidar would probably be a better place for this work.
 */
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { generateDefaultConfig } = require("./defaultWebpackConfig");

/**
 * First retrieve the seed project's default webpack configuration. We will use this
 * as the base for building our assets directory.
 */
let config = generateDefaultConfig();

/**
 * We use the CopyWebpackPlugin to copy assets from the source folder to our dist directory.
 * This plugin is smart enough not to copy over any files that are built by webpack (like finsemble.css)
 */

config.plugins.push(
	new CopyWebpackPlugin({
		patterns: [
			{
				from: "./node_modules/@finsemble/finsemble-ui/react/assets/",
				to: "./assets/",
			},
			{
				from: "./assets/",
				to: "./assets/",
			},
		],
	})
);

/**
 * Webpack needs an entry in order to run the CopyWebpackPlugin.
 * There's nothing to build in theme.css but it kicks webpack off.
 */
config.entry = {
	"assets/css/finsemble": "./assets/css/theme.css",
};

module.exports = config;
