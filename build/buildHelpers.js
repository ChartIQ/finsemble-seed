const webpack = require("webpack");
const chalk = require("chalk");
const workerFarm = require("worker-farm");
const prettyHrtime = require("pretty-hrtime");
chalk.enabled = true;
//setting the level to 1 will force color output.
chalk.level = 1;
const errorOutColor = chalk.hex("#FF667E");
/**
 * @typedef WebpackParallelConfig
 * @property {string} configPath absolute path to the webpack configuration
 * @property {boolean} watch whether we should watch files or exit upon build
 * @property {string} prettyName "label" to use when printing out completion messages (e.g., 'Adapters' or 'Vendor')
 */

/**
 * Logs a message to the terminal
 * @param {string} msg Message to output
 * @param {string} color Color of the text
 * @param {string} bgcolor Color of the background
 */
const logToTerminal = (msg, color = "white", bgcolor = "bgBlack") => {
	if (!chalk[color]) color = "white";
	if (!chalk[color][bgcolor]) bgcolor = "bgBlack";
	console.log(`[${new Date().toLocaleTimeString()}] ${chalk[color][bgcolor](msg)}.`);
};

const runWebpackAndCallback = (configPath, watch, bundleName, callback) => {
	const config = require(configPath);
	if (!config) return callback();
	logToTerminal(`Starting to build ${bundleName}`);
	config.watch = watch;
	config.bail = true; // Causes webpack to break upon first encountered error. Pretty annoying when build errors scroll off the screen.
	let startTime = process.hrtime();
	const finish = (err) => {
		// Webpack will call this function every time the bundle is built.
		// Webpack is run in "watch" mode which means this function will be called over and over and over.
		// We only want to invoke the async callback back to the gulp file once - the initial webpack build.
		if (callback) {
			callback(err);
			callback = undefined;
		}
	};
	webpack(config, (err, stats) => {
		// err is a fatal webpack error. stats.hasErrors represents compilation errors,
		// which are not fatal. Exit on fatal errors.
		if (err) {
			logToTerminal(`FATAL WEBPACK ERROR: ${err.stack || err}`, "red");
			if (err.details) {
				logToTerminal(`ERROR DETAILS: ${err.details}`, "red");
			}
			return finish(err);
		}

		let msg = `Finished building ${bundleName}`;
		//first run, add nice timer.
		if (callback) {
			let end = process.hrtime(startTime);
			msg = `${msg} after ${chalk.magenta(prettyHrtime(end))}`;
		}
		logToTerminal(msg, "cyan");

		const info = stats.toJson();

		if (stats.hasErrors()) {
			logToTerminal(`WEBPACK ERRORS: ${configPath}`, "red");
			console.error(info.errors);
		}

		/* Uncomment to see webpack warnings.
		if (stats.hasWarnings()) {
			logToTerminal(`WEBPACK WARNINGS: ${configPath}`, "yellow");
			console.warn(info.warnings);
		}
		*/
		finish();
	});
};

/**
 * Returns the value for the given name, looking in (1) environment variables, (2) command line args
 * and (3) startupConfig. For instance, `set BLAH_BLAH=electron` or `npx gulp dev --blah_blah:electron`
 * This will search for both all caps, all lowercase and camelcase.
 * @param {string} name The name to look for in env variables and args
 * @param {string} defaultValue The default value to return if the name isn't found as an env variable or arg
 */
const envOrArg = (name, defaultValue) => {
	let lc = name.toLowerCase();
	let uc = name.toUpperCase();
	let cc = name.replace(/(-|_)([a-z])/g, (g) => g[1].toUpperCase());

	// Check environment variables
	if (env[lc]) return env[lc];
	if (env[uc]) return env[uc];

	// Check command line arguments
	lc = `--${lc}:`;
	uc = `--${uc}:`;
	let rc = null;
	process.argv.forEach((arg) => {
		if (arg.startsWith(lc)) rc = arg.split(lc)[1];
		if (arg.startsWith(uc)) rc = arg.split(uc)[1];
	});

	// Look in startupConfig
	if (!rc) {
		rc = startupConfig[env.NODE_ENV][cc] || startupConfig[env.NODE_ENV][lc] || startupConfig[env.NODE_ENV][uc];
	}
	rc = rc || defaultValue;
	return rc;
};

/**
 * Given an array of webpack parallel config objects, this function will spool up a maximum
 * of N workers (where N is limited by CPU cores). When all of them finish building, the done
 * callback will be invoked.
 *
 * @param {WebpackParallelConfig[]} WebpackParallelConfigs An array of objects that describe a webpack config
 * @param {Function} done
 */
const runWebpackInParallel = (webpackParallelConfigs, exitOnCompletion, done) => {
	let finishedBuilds = 0;
	// We set maxRetries to zero in order to avoid an infinite loop if a build process fails.
	// workerFarm is probably the wrong tool for the job here. A simple thread forking mechanism
	// is all that's needed but maybe we can get parallelism for free by using a site builder
	// https://nodejs.org/api/worker_threads.html
	const parallelWorkers = workerFarm({ maxRetries: 0 }, require.resolve("./buildWorker.js"));

	webpackParallelConfigs.forEach((config) => {
		parallelWorkers(config, (e, output) => {
			if (++finishedBuilds === webpackParallelConfigs.length) {
				done(e);
				if (exitOnCompletion) {
					workerFarm.end(parallelWorkers);
				}
			}
		});
	});
};

/**
 * Retrieves webpack public path from config. This is used when serving finsemble from a subdirectory instead of at the root
 * of a host.
 */
const getWebpackPublicPathFromConfig = () => {
	const config = require("../configs/other/server-environment-startup.json");
	const { NODE_ENV } = process.env;
	if (config[NODE_ENV]) {
		return config[NODE_ENV].webpackPublicPath;
	} else {
		console.error(`Cannot find webpack public path for environment ${NODE_ENV}`);
		return;
	}
};

/**
 * Optional override for CI systems.
 */
const getWebpackPublicPathFromEnv = () => process.env.WEBPACK_PUBLIC_PATH;

/**
 * Returns an Environment variable, a config setting, or undefined.
 */
const getWebpackPublicPathVariable = () => {
	const webpackPublicPathEnv = getWebpackPublicPathFromEnv();
	// if we have it set on the ENV, overwrite config
	if (webpackPublicPathEnv) return webpackPublicPathEnv;
	// if the variable is set in config, use that. Otherwise, public path will be undefined
	return getWebpackPublicPathFromConfig();
};

module.exports = {
	runWebpackAndCallback,
	logToTerminal,
	envOrArg,
	runWebpackInParallel,
	getWebpackPublicPathVariable,
};
