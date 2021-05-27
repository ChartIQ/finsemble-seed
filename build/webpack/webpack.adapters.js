const { generateDefaultConfig } = require("./defaultWebpackConfig");
const adaptersToBuild = require("./webpack.adapters.entries.json");

let entries = {};
for (let key in adaptersToBuild) {
	let component = adaptersToBuild[key];
	entries[component.output] = component.entry;
}

let webpackConfig = generateDefaultConfig();
webpackConfig.entry = entries;

module.exports = webpackConfig;
