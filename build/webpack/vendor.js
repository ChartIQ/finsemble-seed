/**
 * This file is very important for reducing build times. We are using something called webpack.DLLPlugin. If you are familiar with "Common chunks", the functionality of the DLL plugin is very similar. What this plugin does in a nutshell is combine commonly used libraries into a single bundle that's built once. Instead of each of your components building and retrieving react and react-dom (et al), the components instead reference those libraries inside of this static bundle. The bundle is included via a script tag, and its output is called vendor.bundle.js. If you use the CLI to create your components, this script tag is included for you.
 */
const React = require("react"),
	ReactDom = require("react-dom"),
	async = require("async");

module.exports = { React, ReactDom, async };
