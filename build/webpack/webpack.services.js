const path = require("path");
const { generateDefaultConfig } = require("./defaultWebpackConfig");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const glob_entries = require("webpack-glob-entries");
const services = glob_entries(path.join(__dirname, "../../", "/src/services/**/*.@(js|ts)"));
let entry = {};

//process service files found
for (let key in services) {
	let currentPath = services[key];
	let splitPath = currentPath.split("/services/");
	let folder = key.replace("Service", "");
	//This loop builds up an object where every key is the output directory of the file, and the value is the entry file. Typically we want to preserve the path. For services, we default to putting them in their named folder (below).
	let entryKey = `services/${splitPath[1]}`;

	if (key.includes("Service")) {
		//for service files, we default to service/SERVICENAME/SERVICENAME
		entryKey = `services/${folder}/${key}`;
	}
	entry[entryKey] = currentPath;
}

if (Object.keys(entry).length === 0) {
	return (module.exports = null); //If we don't have services there is no need to create an entry json
}

let config = generateDefaultConfig();
config.entry = entry;
config.plugins.push(
	new CopyWebpackPlugin({
		patterns: [
			{
				from: "./src/services/",
				to: "./services/",
			},
		],
	})
);

module.exports = config;
