const { runWebpackAndCallback } = require("./buildHelpers");

/**
 * workerFarm, which will run this script eventually, requires only a single export, which
 * must be a function. Don't add another export here or change it this file to ES6-style imports.
 * @param {WebpackParallelConfig} args An object describing where to find the webpack config, whether to watch files,
 * and what to label it when outputting numbers.
 */
module.exports = function worker(args, callback) {
	runWebpackAndCallback(args.configPath, args.watch, args.prettyName, callback);
};
