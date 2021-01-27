const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { DllReferencePlugin } = require("webpack");
const { generateDefaultConfig } = require("./defaultWebpackConfig");

let VENDOR_MANIFEST = null;
try {
	VENDOR_MANIFEST = require("./vendor-manifest.json");
} catch (e) {
	//This should never happen. Vendor-manifest is built automatically by the DLLPlugin. But it's here just in case.
	console.error(
		`[WEBPACK ERROR:] vendor-manifest.json not found. Check to ensure that webpack.vendor.js is running before any other webpack processes and that DLLPlugin is configured correctly.`
	);
	process.exit(1);
}

const __homename = path.resolve(__dirname, "..", "..");

// The standard webpack files that we always look in
// webpack.finsemble-built-in.entries.json - src components
// webpack.components.entries.json - components that have been added with finsemble-cli
var listOfWebpackEntryFiles = [
	path.join(__dirname, "webpack.finsemble-built-in.entries.json"),
	path.join(__dirname, "webpack.components.entries.json"),
];

// Look through the src directory for webpack.entries.json files at the top level.
const srcPath = path.join(__homename, "src");

/**
 * Recursively searches a path for files of a specific name.
 *
 * @param {string} base The base path
 * @param {string} searchFilename the name of the file to search for
 * @param {string[]} array of file/folder names to search in base path
 * @param {string[]} result array of files found
 */
const recursiveFind = (base, searchFilename, files, result) => {
	files = files || fs.readdirSync(base);
	result = result || [];

	files.forEach((file) => {
		const newBase = path.join(base, file);
		if (fs.statSync(newBase).isDirectory()) {
			result = recursiveFind(newBase, searchFilename, fs.readdirSync(newBase), result);
		} else {
			if (path.basename(file) === searchFilename) {
				result.push(newBase);
			}
		}
	});

	return result;
};

// For each file in the directory (src/*)
listOfWebpackEntryFiles.push(...recursiveFind(srcPath, "finsemble.webpack.json"));

// Compile all of those files into a single webpack entries object "componentsToBuild"
// If a file doesn't exist, then no big deal ": {}"
let componentsToBuild = {};
listOfWebpackEntryFiles.forEach((filename) => {
	let entries = fs.existsSync(filename) ? require(filename) : {};

	let additionalComponents = {};
	if (Array.isArray(entries)) {
		// Process arrays (finsemble.webpack.json files) by automatically building the output & entry fields that webpack needs
		entries.forEach((assetName) => {
			const dirName = path.dirname(filename);
			const outputPath = path.relative(srcPath, dirName);
			const assetNoSuffix = assetName.replace(/\.[^/.]+$/, ""); // Remove the .js or .jsx extension
			const entryPath = path.relative(__homename, dirName);
			const output = path.join(outputPath, assetNoSuffix).replace(/\\/g, "/");
			//ensure key is unique
			additionalComponents[output] = {
				output: output,
				entry: `.${path.sep}${path.join(entryPath, assetName)}`.replace(/\\/g, "/"),
			};
		});
	} else {
		// Otherwise assume it's already in object format (webpack.components.entries.json)
		additionalComponents = entries;
	}

	componentsToBuild = Object.assign(componentsToBuild, additionalComponents);
});

let entries = {};

// Convert componentsToBuild into the format that webpack likes
for (let key in componentsToBuild) {
	let component = componentsToBuild[key];
	entries[component.output] = component.entry;
}

// Set up an actual webpack config object. Start with a default that we've set up, then add our entries
let webpackConfig = generateDefaultConfig();
webpackConfig.entry = entries;

// This function iterates through src, building a list of all the directories but eliminating duplicates.
function collapseBuiltInFiles() {
	var srcList = {}; // contains the final compressed list
	let componentSrcPath = path.join(__homename, "src/components"); // path to src components

	// Now put all the src items into our combined list. If there's a dup, then it will override the built in
	var srcItems = fs.readdirSync(componentSrcPath);
	for (let i = 0; i < srcItems.length; i++) {
		let folder = srcItems[i];
		if (folder === ".gitignore") {
			// Don't copy a .gitignore folder.
			continue;
		}
		srcList[folder] = path.join(componentSrcPath, folder);
	}
	return srcList;
}

/**
 * Creates the copy-webpack-plugin config.
 * We use this to copy all assets from component folders over to dist.
 *
 * TODO, define a way for a component's webpack entry to specify whether it does or doesn't need to have assets copied
 */
function createCopyWebpackConfig() {
	// Copy configs and finsemble library
	var config = {
		patterns: [
			{
				from: "./configs/",
				to: "./configs/",
			},
			/* // Enabling this causes the favicon to show up as a background image in localhost:9090
		{
			from: './assets/img/favicon.ico',
			to: './favicon.ico'
		},
		*/
			{
				from: "./node_modules/@finsemble/finsemble-core/dist",
				to: path.join(__dirname, "../../finsemble/"),
			},
		],
	};

	// Create a copy entry for each folder in our collapsed list
	// ignore node_modules/* and */node_modules/*
	var folders = collapseBuiltInFiles();
	for (let name in folders) {
		config.patterns.push({
			from: folders[name],
			to: `./components/${name}`,
			globOptions: {
				ignore: ["node_modules/**/*", "**/*/node_modules/**/*"],
			},
		});
	}
	return config;
}

webpackConfig.plugins.push(new CopyWebpackPlugin(createCopyWebpackConfig()));
webpackConfig.plugins.push(
	new DllReferencePlugin({
		manifest: VENDOR_MANIFEST,
	})
);

module.exports = webpackConfig;
