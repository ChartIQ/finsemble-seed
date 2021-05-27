(() => {
	"use strict";

	// #region Imports
	// NPM
	const async = require("async");
	const { spawn } = require("child_process");
	const fs = require("fs");
	const gulp = require("gulp");
	const shell = require("shelljs");
	const path = require("path");
	const treeKill = require("tree-kill");
	let FEA;
	// Internal Cosaic development: exports doesn't exist when running yarn clean
	try {
		FEA = require("@finsemble/finsemble-electron-adapter/exports");
	} catch (e) {}
	const FEA_PATH = path.resolve("./node_modules/@finsemble/finsemble-electron-adapter");
	const FEAPackager = FEA ? FEA.packager : undefined;
	const startupConfig = require("./configs/other/server-environment-startup");
	const { envOrArg, runWebpackAndCallback, logToTerminal, runWebpackInParallel } = require("./build/buildHelpers");
	const INSTALLER_CERT_PASS = "INSTALLER_CERTIFICATE_PASSPHRASE";

	// local
	const extensions = fs.existsSync("./gulpfile-extensions.js") ? require("./gulpfile-extensions.js") : undefined;
	const isMacOrNix = process.platform !== "win32";

	let angularComponents;
	try {
		angularComponents = require("./build/angular-components.json");
	} catch (ex) {
		angularComponents = null;
	}
	// If you specify environment variables to child_process, it overwrites all environment variables, including
	// PATH. So, copy based on our existing env variables.
	const { env } = process;

	if (!env.NODE_ENV) {
		env.NODE_ENV = "development";
	}

	if (!env.PORT) {
		env.PORT = startupConfig[env.NODE_ENV].serverPort;
	}

	// This variable controls whether the build should watch files for changes. This `startsWith` catches all of the
	// tasks that are dev * (dev, dev: fresh, dev: nolaunch), but excludes build:dev because it is intended to only
	// build for a development environment and not watch for changes.
	const isRunningDevTask = process.argv[2].startsWith("dev");

	// This is a reference to the server process that is spawned. The server process is located in server/server.js
	// and is an Express server that runs in its own node process (via spawn() command).
	let serverProcess = null;

	let launchTimestamp = 0;

	/**
	 * Returns an object containing the absolute paths of the socket certificate files used to secure Finsemble Transport
	 * If both a key and certificate path are not configured nothing is returned.
	 */
	const deriveSocketCertificatePaths = () => {
		const cfg = taskMethods.startupConfig[env.NODE_ENV];
		let socketCertificatePath;
		if (cfg.socketCertificateKey && cfg.socketCertificateCert) {
			socketCertificatePath = {
				key: path.resolve(path.join(__dirname, cfg.socketCertificateKey)),
				cert: path.resolve(path.join(__dirname, cfg.socketCertificateCert)),
			};
		}
		return socketCertificatePath;
	};

	/**
	 * Object containing all of the methods used by the gulp tasks.
	 */
	const taskMethods = {
		/**
		 * Attach some variables to the taskMethods so that they are available to gulp-extensions.
		 */
		distPath: path.join(__dirname, "dist"),
		srcPath: path.join(__dirname, "src"),
		startupConfig: startupConfig,

		/**
		 * Builds the application in the distribution directory. Internal only, don't use because no environment is set!!!!
		 */
		build: (done) => {
			async.series([taskMethods.buildWebpack, taskMethods.buildAngular], done);
		},
		buildAngular: (done) => {
			if (!angularComponents) return done();
			let processRow = (row) => {
				const compName = row.source.split("/").pop();
				const cwd = path.join(__dirname, row.source);
				const outputPath = path.join(__dirname, row.source, row["output-directory"]);
				const command = `ng build --base-href "/angular-components/${compName}/" --outputPath "${outputPath}"`;

				// switch to components folder
				const dir = shell.pwd();
				shell.cd(cwd);
				logToTerminal(`Executing: ${command}\nin directory: ${cwd}`);

				const output = shell.exec(command);
				logToTerminal(`Built Angular Component, exit code = ${output.code}`, "green");
				shell.cd(dir);
			};

			if (angularComponents) {
				angularComponents.forEach((comp) => {
					processRow(comp);
				});
			} else {
				logToTerminal("No Angular components found to build", "yellow");
			}

			done();
		},
		"build:dev": (done) => {
			async.series([taskMethods.setDevEnvironment, taskMethods.build], done);
		},
		"build:prod": (done) => {
			async.series([taskMethods.setProdEnvironment, taskMethods.build], done);
		},
		/**
		 * Builds files using webpack.
		 */
		buildWebpack: (done) => {
			const watchFiles = isRunningDevTask;
			logToTerminal(`Starting webpack. Environment:"${process.env.NODE_ENV}"`);
			// when we're running our dev tasks, we want to leave the parallel workers up,
			// working away. When we're building, we want those guys to tear themselves down
			// so the build doesn't hang indefinitely. If we aren't watching, exit the processes
			// after building.
			const exitOnCompletion = !watchFiles;
			async.series(
				[
					// Build the vendor bundle first, as other webpack instances will use it to speed
					// up their compilation time.
					(done) => {
						const configPath = require.resolve("./build/webpack/webpack.vendor.js");
						const bundleName = "Vendor";
						runWebpackAndCallback(configPath, watchFiles, bundleName, done);
					},
					(done) => {
						const webpackConfigs = [
							{
								configPath: require.resolve("./build/webpack/webpack.assets"),
								prettyName: "Assets",
								watch: watchFiles,
							},
							{
								configPath: require.resolve("./build/webpack/webpack.adapters"),
								prettyName: "Adapters",
								watch: watchFiles,
							},
							{
								configPath: require.resolve("./build/webpack/webpack.preloads.js"),
								prettyName: "Preloads",
								watch: watchFiles,
							},
							{
								configPath: require.resolve("./build/webpack/webpack.titleBar.js"),
								prettyName: "Titlebar",
								watch: watchFiles,
							},
							{
								configPath: require.resolve("./build/webpack/webpack.services.js"),
								prettyName: "Custom Services",
								watch: watchFiles,
							},
							{
								configPath: require.resolve("./build/webpack/webpack.components.js"),
								prettyName: "Components",
								watch: watchFiles,
							},
						];
						runWebpackInParallel(webpackConfigs, exitOnCompletion, done);
					},
				],
				done
			);
		},

		/**
		 * Cleans the project folder of generated files.
		 */
		clean: (done) => {
			shell.rm("-rf", taskMethods.distPath);
			shell.rm("-rf", ".babel_cache");
			shell.rm("-rf", "finsemble");
			shell.rm("-rf", path.join(__dirname, "build/webpack/vendor-manifest.json"));
			shell.rm("-rf", ".webpack-file-cache");
			shell.rm("-rf", "installer-tmp");
			shell.rm("-rf", "finsemble");
			done();
		},
		checkSymbolicLinks: (done) => {
			const FINSEMBLE_PATH = path.join(__dirname, "node_modules", "@finsemble", "finsemble-core");
			const FINSEMBLE_UI_PATH = path.join(__dirname, "node_modules", "@finsemble", "finsemble-ui");
			const FINSEMBLE_VERSION = require(path.join(FINSEMBLE_PATH, "package.json")).version;
			const FINSEMBLE_UI_VERSION = require(path.join(FINSEMBLE_UI_PATH, "package.json")).version;
			const CLI_PATH = path.join(__dirname, "node_modules", "@finsemble", "finsemble-cli");
			const CLI_VERSION = require(path.join(CLI_PATH, "package.json")).version;

			// Check version before require so optionalDependency can stay optional
			const FEA_VERSION = require(path.join(FEA_PATH, "package.json")).version;

			function checkLink(params, cb) {
				let { path, name, version } = params;
				if (fs.existsSync(path)) {
					fs.readlink(path, (err, str) => {
						if (str) {
							logToTerminal(`LINK DETECTED: ${name}. @Version ${version} Path: ${str}.`, "yellow");
						} else {
							logToTerminal(`Using: @finsemble/${name} @Version ${version}`, "magenta");
						}
						cb();
					});
				} else {
					logToTerminal(`MISSING FINSEMBLE DEPENDENCY!: ${name}.\nPath: ${path}`, "red");
					process.exit(1);
				}
			}
			async.parallel(
				[
					(cb) => {
						checkLink(
							{
								path: FINSEMBLE_PATH,
								name: "finsemble",
								version: FINSEMBLE_VERSION,
							},
							cb
						);
					},
					(cb) => {
						checkLink(
							{
								path: CLI_PATH,
								name: "finsemble-cli",
								version: CLI_VERSION,
							},
							cb
						);
					},
					(cb) => {
						checkLink(
							{
								path: FINSEMBLE_UI_PATH,
								name: "finsemble-ui",
								version: FINSEMBLE_UI_VERSION,
							},
							cb
						);
					},
					(cb) => {
						if (!FEA_VERSION) {
							// electron not found so skip check
							return cb();
						}

						checkLink(
							{
								path: FEA_PATH,
								name: "finsemble-electron-adapter",
								version: FEA_VERSION,
							},
							cb
						);
					},
				],
				done
			);
		},

		/**
		 * Builds the application, starts the server, launches the Finsemble application and watches for file changes.
		 */
		dev: (done) => {
			async.series([taskMethods["build:dev"], taskMethods.startServer, taskMethods.launchApplication], done);
		},
		/**
		 * Wipes the babel cache and webpack cache, clears dist, rebuilds the application, and starts the server.
		 */
		"dev:fresh": (done) => {
			async.series(
				[taskMethods.setDevEnvironment, taskMethods.rebuild, taskMethods.startServer, taskMethods.launchApplication],
				done
			);
		},
		/**
		 * Builds the application and runs the server *without* launching.
		 */
		"dev:noLaunch": (done) => {
			async.series([taskMethods["build:dev"], taskMethods.startServer], done);
		},

		launchElectron: (done) => {
			const cfg = taskMethods.startupConfig[env.NODE_ENV];

			/**
			 * handleElectronClose() gets called when Electron is closed, in other words when the user quits Finsemble from the file menu or some other way.
			 * When Electron is closed, we will want to terminate this gulp process, and also make certain that any other child
			 * processes that we've spun up are closed (such as server.js or watch processes).
			 *
			 * On Unix (Mac) child processes are not automatically killed when the current process exits, so we use "treeKill"
			 * to ensure that all child processes are killed off. Otherwise, those processes would show up as stray "node" processes in ActivityMonitor/ps
			 * and eventually eat up memory.
			 *
			 * treeKill makes use of shell commands (taskkill and pgrep) because Node doesn't currently support the concept of process groups.
			 * The result is that this gulp process will terminate with an error that _isn't really_ an error, which yarn/npm will pick up and print out "Command failed with exit code 1".
			 * Orchestrating a graceful exit to avoid that error would involve rearchitecting the entire gulp process or forking treeKill, so on Unix/Mac we allow the spurious error.
			 */
			const handleElectronClose = () => {
				if (isMacOrNix) treeKill(process.pid);
				else process.exit(0);
			};

			const socketCertificatePath = deriveSocketCertificatePaths();
			let config = {
				manifest: cfg.serverConfig,
				onElectronClose: handleElectronClose,
				chromiumFlags: JSON.stringify(cfg.chromiumFlags),
				socketCertificatePath,
				breakpointOnStart: cfg.breakpointOnStart,
			};

			// Copy any command line args from server-environment-startup.json
			config.args = taskMethods.startupConfig[env.NODE_ENV]["args"];

			if (!FEA) {
				console.error("Could not launch ");
				process.exit(1);
			}

			return FEA.e2oLauncher(config, done);
		},
		makeInstaller: async (done) => {
			if (!env.NODE_ENV) throw new Error("NODE_ENV must be set to generate an installer.");
			function resolveRelativePaths(obj, properties, rootPath) {
				properties.forEach((prop) => {
					obj[prop] = path.resolve(rootPath, obj[prop]);
				});
				return obj;
			}

			// Inline require because this file is so large, it reduces the amount of scrolling the user has to do.
			let installerConfig = require("./configs/other/installer.json");
			let seedpackagejson = require("./package.json");
			// Command line overrides

			installerConfig.name = process.env.installername || installerConfig.name;
			installerConfig.version = process.env.installerversion || installerConfig.version || seedpackagejson.version;
			installerConfig.authors = process.env.installerauthors || installerConfig.authors;
			installerConfig.description = process.env.installerdescription || installerConfig.description;

			//check if we have an installer config matching the environment name, if not assume we just have a single config for all environments
			if (installerConfig[env.NODE_ENV]) {
				installerConfig = installerConfig[env.NODE_ENV];
			}

			if (installerConfig.certificateFile && !installerConfig.certificatePassword) {
				const certPassphraseFromEnv = process.env[INSTALLER_CERT_PASS];

				//If a certificate file is provided and a plain text password is not, look for environment variable
				if (certPassphraseFromEnv) {
					installerConfig.certificatePassword = certPassphraseFromEnv.trim();
				} else {
					// If a certificate file was provided and a password can't be found, show error and exit
					throw new Error(
						`A certificate file was provided but a password cannot be found. Please provide one in the config or as an environment variable: INSTALLER_CERTIFICATE_PASSPHRASE`
					);
				}
			}

			// need absolute paths for certain installer configs
			installerConfig = resolveRelativePaths(installerConfig, ["icon", "macIcon", "background"], "./");

			const manifestUrl = process.env.manifesturl || taskMethods.startupConfig[env.NODE_ENV].serverConfig;
			console.log("The manifest location is: ", manifestUrl);
			let { updateUrl } = taskMethods.startupConfig[env.NODE_ENV];
			const { chromiumFlags } = taskMethods.startupConfig[env.NODE_ENV];

			// Installer won't work without a proper manifest. Throw a helpful error.
			if (!manifestUrl) {
				throw new Error(
					`Installer misconfigured. No property in 'serverConfig' in configs/other/server-environment-startup.json under ${env.NODE_ENV}. This is required in order to generate the proper config.`
				);
			}

			// If an installer is pointing to localhost, it's likely an error. Let the dev know with a helpful error.
			if (manifestUrl.includes("localhost")) {
				logToTerminal(
					`>>>> WARNING: Installer is pointing to a manifest hosted at ${manifestUrl}. Was this accidental?
				NODE_ENV: ${env.NODE_ENV}`,
					"yellow"
				);
			}

			// UpdateURL isn't required, but we let them know in case they're expecting it to work.
			if (!updateUrl) {
				logToTerminal(
					`[Info] Did not find 'updateUrl' in configs/other/server-environment-startup.json under ${env.NODE_ENV}. The application will still work, but it will not update itself with new versions of the finsemble-electron-adapter.`,
					"white"
				);
				updateUrl = null;
			}

			if (!FEAPackager) {
				console.error("Cannot create installer because Finsemble Electron Adapter is not installed");
				process.exit(1);
			}
			const socketCertificatePath = deriveSocketCertificatePaths();

			FEAPackager.setFeaPath(FEA_PATH);
			await FEAPackager.setApplicationFolderName(installerConfig.name);
			await FEAPackager.setManifestURL(manifestUrl);
			await FEAPackager.setUpdateURL(updateUrl);
			await FEAPackager.setChromiumFlags(chromiumFlags || {});
			await FEAPackager.copySocketCertificates(socketCertificatePath);
			await FEAPackager.createFullInstaller(installerConfig);
			done();
		},
		launchApplication: (done) => {
			logToTerminal("Launching Finsemble", "black", "bgCyan");

			launchTimestamp = Date.now();
			taskMethods.launchElectron(done);
		},
		logToTerminal: (...args) => logToTerminal.apply(this, args),
		envOrArg: (...args) => envOrArg.apply(this, args),
		/**
		 * Starts the server, launches the Finsemble application. Use this for a quick launch, for instance when working on finsemble-electron-adapter.
		 */
		"nobuild:dev": (done) => {
			async.series([taskMethods.setDevEnvironment, taskMethods.startServer, taskMethods.launchApplication], done);
		},

		/**
		 * Method called after tasks are defined.
		 * @param done Callback function used to signal function completion to support asynchronous execution. Can
		 * optionally return an error, if one occurs.
		 */
		post: (done) => {
			done();
		},

		/**
		 * Method called before tasks are defined.
		 * @param done Callback function used to signal function completion to support asynchronous execution. Can
		 * optionally return an error, if one occurs.
		 */
		pre: (done) => {
			// taskMethods.checkSymbolicLinks();
			done();
		},
		launch: (done) => {
			async.series([taskMethods.launchApplication], done);
		},
		/**
		 * Builds the application, starts the server and launches the application. Use this to test production mode on your local machine.
		 */
		prod: (done) => {
			async.series([taskMethods["build:prod"], taskMethods.startServer, taskMethods.launchApplication], done);
		},
		/**
		 * Builds the application in production mode and starts the server without launching the application.
		 */
		"prod:nolaunch": (done) => {
			async.series([taskMethods["build:prod"], taskMethods.startServer], done);
		},
		rebuild: (done) => {
			async.series([taskMethods.clean, taskMethods.build], done);
		},
		/**
		 * Launches the server in dev environment. No build, no application launch.
		 */
		server: (done) => {
			async.series([taskMethods.setDevEnvironment, taskMethods.startServer], done);
		},
		/**
		 * Launches the server in prod environment. No build, no application launch.
		 */
		"server:prod": (done) => {
			async.series([taskMethods.setProdEnvironment, taskMethods.startServer], done);
		},
		/**
		 * Starts the server.
		 *
		 * @param {function} done Function called when execution has completed.
		 */
		startServer: (done) => {
			const serverPath = path.join(__dirname, "server", "server.js");

			serverProcess = spawn(
				"node",
				[
					serverPath,
					{
						stdio: "inherit",
					},
				],
				{
					env: env,
					stdio: [process.stdin, process.stdout, "pipe", "ipc"],
				}
			);

			serverProcess.on("message", (data) => {
				if (!data || !data.action) {
					console.log("Unproperly formatted message from server:", data);
					return;
				}
				if (data.action === "serverStarted") {
					done();
				} else if (data.action === "serverFailed") {
					process.exit(1);
				} else if (data.action === "timestamp") {
					// The server process can send timestamps back to us. We will output the results here.
					let duration = (data.timestamp - launchTimestamp) / 1000;
					logToTerminal(`${data.milestone} ${duration}s after launch`);
				} else {
					console.log("Unhandled message from server: ", data);
				}
			});

			serverProcess.on("exit", (code) => logToTerminal(`Server closed: exit code ${code}`, "magenta"));

			// Prints server errors to your terminal.
			serverProcess.stderr.on("data", (data) => {
				console.error(`ERROR: ${data}`);
			});
		},

		setDevEnvironment: (done) => {
			process.env.NODE_ENV = "development";
			done();
		},

		setProdEnvironment: (done) => {
			process.env.NODE_ENV = "production";
			done();
		},
	};
	// #endregion

	// Update task methods with extensions
	if (extensions) {
		extensions(taskMethods);
	}

	// #region Task definitions
	const defineTasks = (err) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}

		// Convert every taskMethod into a gulp task that can be run
		for (var taskName in taskMethods) {
			var task = taskMethods[taskName];
			if (typeof task === "function") gulp.task(taskName, taskMethods[taskName]);
		}

		// By default run dev
		gulp.task("default", taskMethods["dev"]);

		taskMethods.post((err) => {
			if (err) {
				console.error(err);
				process.exit(1);
			}
		});
	};
	// #endregion

	// Run anything that we need to do before the gulp task is run
	taskMethods.pre(defineTasks);
})();
