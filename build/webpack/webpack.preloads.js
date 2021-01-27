const { generateDefaultConfig } = require("./defaultWebpackConfig");
const preloadsToBuild = require("./webpack.preloads.entries.json");

let entries = {};
for (let key in preloadsToBuild) {
	let component = preloadsToBuild[key];
	entries[component.output] = component.entry;
}

let webpackConfig = generateDefaultConfig();
webpackConfig.entry = entries;

module.exports = webpackConfig;
