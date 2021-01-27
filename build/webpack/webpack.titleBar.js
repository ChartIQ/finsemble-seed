/**
 * The webpacking for WindowTitleBar differs from other components because it does not make use of the "vendor bundle".
 * The vendor bundle allows common libraries such as react, react-dom to be consolidated into a single js file.
 * Finsemble's built-in UI components make use of this vendor bundle but this cannot be counted on for external
 * components, particularly QuickComponents.
 *
 * Note: this will be unnecessary once WindowTitleBar is separated from app content via a BrowserView.
 */
const { generateDefaultConfig } = require("./defaultWebpackConfig");

const entries = {
	"components/windowTitleBar/WindowTitleBar": "./src/components/windowTitleBar/windowTitleBarLoader.js",
};

let webpackConfig = generateDefaultConfig();
webpackConfig.entry = entries;

module.exports = webpackConfig;
