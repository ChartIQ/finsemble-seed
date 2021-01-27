# Extending server functionality

Sometimes during development, it is necessary to create new API your application requires. The Finsemble seed project
already includes a server to host files locally for development, so it makes sense to use this server to design the API
required by your application. To allow for extension of the server provided in the Finsemble seed project, without
breaking the upgrade path, the server attempts to import the _server-extensions.js_ file from the _server_ directory of
the project. If _server-extensions.js_ exists, it's methods are called by the server to provide additional
functionality. The _server-extensions.js_ file should return an object that contains the following functions:

- `pre` - called before _server.js_ starts defining the default server functionality
- `post` - called after the server is up and running
- `updateServer` - called after the default server functionality has been defined, but before the server is started

The `pre` and `post` functions do not take any arguments. The `updateServer` function takes two arguments, the first is
an instance of the [Express server](https://www.npmjs.com/package/express) that can be used to add functionality, and
the second is a callback, that takes not arguments, that must be called when the server is ready to be started. Please
see the sample _server-extensions.js_ below:

```javascript
((module) => {
	"use strict";

	module.exports = {
		/**
		 * Method called before starting the server.
		 *
		 * @param done Function used to signal when pre function has finished. Can optionally pass an error message if
		 * one occurs.
		 */
		pre: (done) => {
			console.log("pre server startup");
			done();
		},

		/**
		 * Method called after the server has started.
		 *
		 * @param done Function used to signal when pre function has finished. Can optionally pass an error message if
		 * one occurs.
		 */
		post: (done) => {
			console.log("post server startup");
			done();
		},

		/**
		 * Method called to update the server.
		 *
		 * @param {express} app The express server.
		 * @param {function} cb The function to call once finished adding functionality to the server. Can optionally
		 * pass an error message if one occurs.
		 */
		updateServer: (app, cb) => {
			console.log("modifying server");
			cb();
		},
	};
})(module);
```
