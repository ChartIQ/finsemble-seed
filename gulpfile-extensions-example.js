/**
 * This file allows you to customize the Finsemble build behavior which runs through gulpfile.js.
 * You can do three things:
 * 1) Run code before a normal gulp task (PRE)
 * 2) Modify or add code that is called within a gulp task (CODE)
 * 3) Override or add new gulp tasks (TASKS)
 *
 * See comments in each section to understand how to complete your desired customization.
 *
 * Once completed, rename this file gulpfile-extensions.js. The Finsemble build process will then begin
 * processing this file during builds.
 */
module.exports = (taskMethods) => {
	"use strict";

	const gulp = require("gulp");
	const ON_DEATH = require("death")({ debug: false });
	const path = require("path");
	const { exec } = require("child_process");
	const chalk = require("chalk");
	//Force colors on terminals.
	const errorOutColor = chalk.hex("#FF667E");
	let watchClose;

	/** -------------------------------------- PRE ----------------------------------------
	 * You can use this section to run code that should execute *before* any gulp tasks run.
	 * For instance, if you need to spin up a server or run a shell command, do it here.
	 */
	let preOriginal = taskMethods.pre;
	taskMethods.pre = (done) => {
		preOriginal(() => {
			// Call the built-in tasks from gulpfile.js
			// <------  Put your code to run "pre" tasks here
			done();
		});
	};

	/**
	 * overwrites the launchElectron function in gulpfile.js
	 */
	/*
	taskMethods.launchElectron = done => {
		let electronProcess = null;
		let manifest = taskMethods.startupConfig[process.env.NODE_ENV].serverConfig;
		process.env.ELECTRON_DEV = true;
		ON_DEATH((signal, err) => {

			if (electronProcess) electronProcess.kill();

			exec("taskkill /F /IM electron.* /T", (err, stdout, stderr) => {
				// Only write the error to console if there is one and it is something other than process not found.
				if (err && err !== 'The process "electron.*" not found.') {
					console.error(errorOutColor(err));
				}

				if (watchClose) watchClose();
				process.exit();
			});
		});

		let FEALocation = "node_modules/@finsemble/finsemble-electron-adapter";
		const electronPath = path.join(__dirname, FEALocation, "node_modules", "electron", "dist", "electron.exe");
		let debug = taskMethods.envOrArg("electronDebug");
		let debugArg = "";
		if (debug) {
			debugArg = taskMethods.envOrArg("breakpointOnStart") ? " --inspect-brk=5858" : " --inspect=5858";
		}
		let command = "set ELECTRON_DEV=true && " + electronPath + " index.js --auth-server-whitelist='*' --remote-debugging-port=9090" + debugArg +  " --manifest " + manifest;
		taskMethods.logToTerminal(command);
		electronProcess = exec(command,
			{
				cwd: FEALocation
			}, function (err) {
				taskMethods.logToTerminal(err);
				taskMethods.logToTerminal("Finsemble Electron Adapter not installed? Try `npm install`", "red");
			}
		);

		electronProcess.stdout.on("data", function (data) {
			console.log(data.toString());
		});

		electronProcess.stderr.on("data", function (data) {
			console.error("stderr:", data.toString());
		});

		electronProcess.on("close", function (code) {
			console.log("child process exited with code " + code);
		});

		process.on('exit', function (code) {
			console.log("child process exited with code " + code)
		});

		if (done) done();
	};
	*/

	/** --------------------------------------- CODE -------------------------------------
	 * Add or override any internal methods used by gulp tasks (a gulp task for instance would be "build" or "dev", called with npm run dev)
	 *
	 * We've included overrides for a few common tasks
	 */

	// Extend copyStaticFiles to do more stuff, for instance if you need to copy other stuff to dist
	/*
	let copyStaticFilesOriginal = taskMethods.copyStaticFiles
	taskMethods.copyStaticFiles = (done) => {

		copyStaticFilesOriginal().on("end", // Execute the original function, which, in this case, returns a stream.
			() => {
				// <------- Put code here that you want to be called after the original copyStaticFiles task

				done(); // Execute callback to signal completion.
		});
	};
	*/

	// Add SASS compilation. You'll need to add gulp-sass and sass-loader to your package.json
	/*
		taskMethods.buildSass = done => {
			console.log("Starting buildSass");
			if (!global.sass) global.sass = require("gulp-sass");
			if (!global.path) global.path = require("path");

			const source = [
				path.join(taskMethods.srcPath, "components", "**", "*.scss"),
			];

			var stream = gulp
				.src(source)
				.pipe(sass().on("error", sass.logError))
				.pipe(gulp.dest(path.join(taskMethods.distPath, "components")));

			stream.on("end", function () {
				console.log("Finished buildSass");
				done();
			});
			stream.on("error", function (err) {
				done(err);
			});
		};
	*/

	/** ---------------------------------------- TASKS ----------------------------------------------
	 * Here is where you can override the actual gulp tasks. For instance, npm run dev, npm run build, etc.
	 * You'll find these all in the "defineTasks" section in gulpfile.js.
	 *
	 * To run new tasks from the command line you will also need to add them to your package.json. For instance
	 * the task "myTask" below would require a new line in package.json in the scripts section. Alternatively,
	 * you can install gulp globally and run directly with gulp.
	 *
	 * For information on configuring gulp tasks:
	 * https://github.com/gulpjs/gulp/blob/master/docs/API.md#gulptaskname-fn
	 *
	 */
	taskMethods.post = (done) => {
		// Example, add a new gulp task that first calls the built in "build" task and then does something of your choosing
		/*
		gulp.task("myTask", gulp.series("build"), function (done) {
			// do something
			done();
		});
		*/

		// Example of how to redefine the built in build task. Note that all of the built in npm run commands use "build"
		/*
		 gulp.task("build", gulp.series(
				"clean",
				taskMethods.copyStaticFiles,
				taskMethods.buildWebpack,
				taskMethods.buildSass
			)
		);
		*/

		done();
	};
};
