/*
	Finsemble Zoom preload, which adds support for:
	- Zoom hotkeys (Ctrl +, Ctrl -, Ctrl 0, Ctrl Mousewheel),
	- A Chrome style popup showing the current zoom level,
	- Global zoom configuration settings:
	  - finsemble.Window Manager.zoom.timeout: how long to display the zoom popup for (default 3000ms)
	  - finsemble.Window Manager.zoom.step: Zoom step size (default 0.1)
	  - finsemble.Window Manager.zoom.min: Minimum zoom level (default 0.2)
	  - finsemble.Window Manager.zoom.max Maximum zoom level (default 5)
	- Zoom level being preserved in window state/workspaces
	- Default zoom level config with-in the component configuration at:
	  `foreign.components.['Window Manager'].zoomDefault`
*/

// This global will contain our current zoom level
window.fsblZoomLevel = 1;

// Global variables hold our zoom heuristics. We set the defaults here but they can be overridden
// with the config finsemble.Window Manager.zoom
window.zoomTimeout = 3000;
window.zoomStep = 0.1;
window.zoomMin = 0.2;
window.zoomMax = 5;

// This gets flipped to false once the initial zoom is set.
// We use this flag to prevent the zoom level pop up from displaying when the component is first loaded.
window.settingInitialZoom = true;

/**
 * Show a pop up control that displays the current zoom level and allows users to manipulate it with the mouse.
 * @param {int} pct
 */
const showPopup = (pct) => {
	const popup = document.querySelector("#zoom-popup");

	if (popup) {
		popup.style.zoom = 1;

		const span = document.querySelector("#zoom-popup-text");
		span.innerHTML = `${Math.floor(pct * 100)}%`;

		popup.style.display = "block";

		if (window.timerHandle) {
			// Clear timer to reset hide timeout
			clearTimeout(window.timerHandle);
			window.timerHandle = null;
		}

		window.timerHandle = setTimeout(() => (popup.style.display = "none"), window.zoomTimeout);
	}
};
/**
 * Sets the zoom by setting the CSS "zoom" value on the body.
 *
 * It sets an opposing zoom on the Finsemble header in order that it maintains its size
 * @param {Number} pct The zoom level (1 is 100%)
 */
const setZoom = (pct) => {
	// enforce min/max zoom
	if (pct < window.zoomMin) {
		pct = window.zoomMin;
	} else if (pct > window.zoomMax) {
		pct = window.zoomMax;
	}

	document.querySelectorAll("body > *").forEach((el) => (el.style.zoom = pct));

	const FSBLHeader = document.querySelector("#FSBLHeader");
	if (FSBLHeader) {
		FSBLHeader.style.zoom = 1;
	}

	if (!window.settingInitialZoom) showPopup(pct);

	// Zoom levels are saved as component state "fsbl-zoom"
	FSBL.Clients.WindowClient.setComponentState({
		field: "fsbl-zoom",
		value: window.fsblZoomLevel,
	});
};

const roundTo1Decimal = (input) => Math.round((input + Number.EPSILON) * 10) / 10;

/**
 * Zooms the page in one step.
 */
const zoomIn = () => {
	window.fsblZoomLevel = roundTo1Decimal(window.fsblZoomLevel + window.zoomStep);
	if (window.fsblZoomLevel < window.zoomMin) {
		window.fsblZoomLevel = window.zoomMin;
	}
	setZoom(window.fsblZoomLevel);
};

/**
 * Zooms the page out one step.
 */
const zoomOut = () => {
	window.fsblZoomLevel = roundTo1Decimal(window.fsblZoomLevel - window.zoomStep);
	if (window.fsblZoomLevel > window.zoomMax) {
		window.fsblZoomLevel = window.zoomMax;
	}
	setZoom(window.fsblZoomLevel);
};

/**
 * Resets the zoom level to 100%.
 */
const resetZoom = () => {
	window.fsblZoomLevel = 1;
	setZoom(window.fsblZoomLevel);
};

const handleWheel = (event) => {
	const e = window.event || event;
	//if Control key was held down while scrolling mouse wheel interpret as zoom
	if (e.ctrlKey) {
		if (e.wheelDelta > 0) {
			zoomIn();
		} else if (e.wheelDelta < 0) {
			zoomOut();
		}
		e.preventDefault();
	}
};

/**
 * Inserts the pop up element into the page if needed.
 */
const insertPopUp = () => {
	let popup = document.querySelector("#zoom-popup");
	if (popup) {
		// Pop up already created.
		return;
	}

	// Create popup div, with ID, class and text
	popup = document.createElement("div");
	popup.id = "zoom-popup";
	popup.style.display = "none";
	popup.style.position = "absolute";
	popup.style.top = "0px";
	popup.style.right = "10px";
	popup.style.padding = "5px";
	popup.style.background = "grey";
	popup.style.color = "white";
	popup.style.opacity = "80%";

	const heading = document.createElement("div");
	heading.className = "fsbl-zoom-popup-heading";
	heading.style.marginLeft = "4px";
	heading.style.marginBottom = "4px";
	popup.appendChild(heading);

	const title = document.createElement("span");
	title.className = "fsbl-zoom-popup-title";
	title.style.marginLeft = "0px";
	title.appendChild(document.createTextNode("Zoom:"));
	heading.appendChild(title);

	// Create Div to contain the zoom level text
	const span = document.createElement("span");
	span.className = "fsbl-zoom-popup-text";
	span.style.marginLeft = "3px";
	span.id = "zoom-popup-text";
	heading.appendChild(span);

	// Create zoom out button
	const zoomOutBtn = document.createElement("button");
	zoomOutBtn.style.width = "unset";
	zoomOutBtn.style.padding = "1px 5px 1px 5px";
	zoomOutBtn.style.margin = "0px 2px 0px 2px";
	zoomOutBtn.appendChild(document.createTextNode("-"));
	zoomOutBtn.onclick = zoomOut;
	popup.appendChild(zoomOutBtn);

	// Create reset button
	const resetBtn = document.createElement("button");
	resetBtn.style.width = "unset";
	resetBtn.style.padding = "1px 5px 1px 5px";
	resetBtn.style.margin = "0px 2px 0px 2px";
	resetBtn.appendChild(document.createTextNode("Reset"));
	resetBtn.onclick = resetZoom;
	popup.appendChild(resetBtn);

	// Create zoom in button
	const zoomInBtn = document.createElement("button");
	zoomInBtn.style.width = "unset";
	zoomInBtn.style.padding = "1px 5px 1px 5px";
	zoomInBtn.style.margin = "0px 2px 0px 2px";
	zoomInBtn.appendChild(document.createTextNode("+"));
	zoomInBtn.onclick = zoomIn;
	popup.appendChild(zoomInBtn);

	document.body.appendChild(popup);
};

/**
 * Handles the zoom configuration.
 * @param {*} err The error getting zoom config, if one occurred.
 * @param {object} zoom The zoom configuration object
 * @param {Number} zoom.timeout The number of milliseconds the zoom pop up should be displayed before it is hidden (Default 3000).
 * @param {Number} zoom.step How much the zoom should increase or decrease when zooming in or out (Default 0.1).
 * @param {Number} zoom.max The maximum allowed zoom level (Default 5).
 * @param {Number} zoom.min The minimum allowed zoom level (Default 0.2).
 */
const zoomConfigHandler = (err, zoom) => {
	if (err) {
		return FSBL.Clients.Logger.error(err);
	}

	if (!zoom) {
		// No config, use defaults.
		return;
	}

	window.zoomTimeout = zoom.timeout ? zoom.timeout : window.zoomTimeout;
	window.zoomStep = zoom.step ? zoom.step : window.zoomStep;
	window.zoomMin = zoom.min ? zoom.min : window.zoomMin;
	window.zoomMax = zoom.max ? zoom.max : window.zoomMax;
};

/**
 * Applies the zoom level from the component state or default configuration.
 *
 * @param {*} err The error, if one occurred, from getting the zoom level from component state.
 * @param {Number} zoomLevel The zoom level saved in the component.
 */
const getZoomLevelHandler = (err, zoomLevel) => {
	if (err) {
		FSBL.Clients.Logger.info('No "fsbl-zoom" settings found in component state', err);
	} else if (zoomLevel != null) {
		FSBL.Clients.Logger.info(`Retrieved zoomLevel from state: ${zoomLevel}`);
		window.fsblZoomLevel = zoomLevel;
		setZoom(window.fsblZoomLevel);
	} else {
		//check for default configuration for zoom level and apply as needed
		let defaultLevel =
			FSBL?.Clients?.WindowClient?.options?.customData?.foreign?.components?.["Window Manager"]?.zoomDefault;
		if (defaultLevel) {
			FSBL.Clients.Logger.info(`Retrieved default zoom level from config: ${defaultLevel}`);
			window.fsblZoomLevel = defaultLevel;
			setZoom(defaultLevel);
		} else {
			FSBL.Clients.Logger.info("No default zoom level retrieved from configuration ");
		}
	}
	window.settingInitialZoom = false;
};

/**
 * Initializes the zoom handler.
 */
const runZoomHandler = () => {
	//Override FEA window zoom function to do nothing
	//which prevents manual use of this function which conflicts with zoom preload
	//N.B. window.options.accelerator.zoom setting is not affected by this and will still conflict with Zoom preload if set
	FSBL.Clients.WindowClient.getCurrentWindow().setZoomLevel = function (level, callback, errorCallback) {
		callback();
	};

	// Insert the zoom pop up, if needed.
	insertPopUp();

	// Update the zoom configuration.
	FSBL.Clients.LauncherClient.getComponentDefaultConfig(
		FSBL.Clients.WindowClient.getWindowIdentifier().componentType,
		(err, componentConfig) => {
			// Read component config for zoom
			try {
				const zoomConfig = componentConfig.foreign.components["Window Manager"].zoom;
				if (zoomConfig) {
					return zoomConfigHandler(null, zoomConfig);
				}
			} catch (e) {
				// component config does not have foreign or foreign.components
			}

			// If component doesn't have a config, read global config for zoom
			FSBL.Clients.ConfigClient.getValue({ field: "finsemble.Window Manager.zoom" }, zoomConfigHandler);
		}
	);

	// Create hot keys for zooming.
	FSBL.Clients.HotkeyClient.addBrowserHotkey(["ctrl", "="], zoomIn);
	//TODO: enable when finsemble supports mapping + key
	FSBL.Clients.HotkeyClient.addBrowserHotkey(["ctrl", "+"], zoomIn);
	FSBL.Clients.HotkeyClient.addBrowserHotkey(["ctrl", "-"], zoomOut);
	FSBL.Clients.HotkeyClient.addBrowserHotkey(["ctrl", "0"], resetZoom);

	// Updates the component with the zoom level from the previous load, if one exists.
	FSBL.Clients.WindowClient.getComponentState({ field: "fsbl-zoom" }, getZoomLevelHandler);

	window.addEventListener("wheel", handleWheel, {
		capture: false,
		passive: false,
	});
};

// TODO, catch and recall scroll position

// Startup pattern for preload. Preloads can come in any order, so we need to wait on either the window event or the
// FSBL event
if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", runZoomHandler);
} else {
	window.addEventListener("FSBLReady", runZoomHandler);
}
