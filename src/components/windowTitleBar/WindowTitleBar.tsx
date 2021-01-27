/*!
 * Copyright 2017 - 2020 by ChartIQ, Inc.
 * All rights reserved.
 */
import React from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@finsemble/finsemble-ui/react/components/FinsembleProvider";
import {
	AlwaysOnTopButton,
	GroupingButton,
	LinkerButton,
	ShareButton,
	TabRegion,
	CloseButton,
	MaximizeButton,
	MinimizeButton,
	WindowTitleBarShell,
} from "@finsemble/finsemble-ui/react/components/windowTitleBar";

/**
 * The following css import assumes that WindowTitleBar is running in a BrowserView.
 * If not running in a BrowserView then some of the CSS directives may conflict with
 * your content. You can remove this line and manually import CSS files from @finsemble/finsemble-ui as necessary.
 */
import "@finsemble/finsemble-ui/react/assets/css/finsemble.css";
import "../../../assets/css/theme.css";

/**
 * This is the Window Title Bar component, which is rendered at
 * the top of every HTML window.
 *
 * You can customize this template by adding or removing
 * elements and styling as you see fit.
 *
 * The visibility of each of the controls can be controlled by
 * config. For example, setting the
 * "foreign.components.Window Manager.showLinker" property
 * to false will hide the <LinkerButton/>.
 *
 * Other buttons are dynamic, such as <GroupingButton> which will only
 * appear when windows are docked or can be docked.
 */
const WindowTitleBar = () => {
	return (
		<WindowTitleBarShell>
			<div className="fsbl-header-left">
				<LinkerButton />
				<ShareButton />
			</div>
			<div className="fsbl-header-center">
				{/* If tabbing is disabled, <TabRegion/> will
					only display the title */}
				<TabRegion />
			</div>
			<div className="fsbl-header-right">
				<GroupingButton />
				<AlwaysOnTopButton />
				<MinimizeButton />
				<MaximizeButton />
				<CloseButton />
			</div>
		</WindowTitleBarShell>
	);
};

const setUpDOMContainer = () => {
	// Check if the page already has a spot for the header
	let fsblHeader = document.getElementById("FSBLHeader");
	if (fsblHeader) return;

	// If there's no existing spot, then we create one
	const wrapper = document.createElement("div");
	fsblHeader = document.createElement("div");
	fsblHeader.setAttribute("id", "FSBLHeader");
	wrapper.appendChild(fsblHeader);
	if (wrapper.firstChild) document.body.insertBefore(wrapper.firstChild, document.body.firstChild);
};

setUpDOMContainer();

ReactDOM.render(
	<FinsembleProvider>
		<WindowTitleBar />
	</FinsembleProvider>,
	document.getElementById("FSBLHeader")
);
