const path = require("path");
const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
const { DefinePlugin, DllPlugin } = require("webpack");

console.log("ENVIRONMENT", env);
let plugins = [
	new DllPlugin({
		name: "vendor_lib",
		path: path.join(__dirname, "vendor-manifest.json"),
	}),
	new DefinePlugin({
		"process.env": {
			NODE_ENV: JSON.stringify(env),
		},
	}),
];

/**
 * Entries come from seed/build/webpack/vendor.js
 */
module.exports = {
	entry: {
		vendor: [path.join(__dirname, "./vendor")],
	},
	output: {
		filename: "vendor.bundle.js",
		path: path.join(__dirname, "../../dist"),
		library: "vendor_lib",
	},
	plugins: plugins,
};
