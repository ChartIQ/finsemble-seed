/*!
 * Copyright 2017 - 2020 by ChartIQ, Inc.
 * All rights reserved.
 */
import React from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@finsemble/finsemble-ui/react/components/FinsembleProvider";
import { SystemTrayComponentShell, SystemLog, Preferences } from "@finsemble/finsemble-ui/react/components/system";
import { CentralLogger, Documentation } from "@finsemble/finsemble-ui/react/components/system";
import { Restart, Reset, Quit } from "@finsemble/finsemble-ui/react/components/system";
import "@finsemble/finsemble-ui/react/assets/css/finsemble.css";
import "@finsemble/finsemble-ui/react/assets/css/menus.css";
import "../../../assets/css/theme.css";

/**
 * This component displays on right-click in your application's system tray icon.
 * Feel free to add/remove content or react components.
 * The SystemTrayComponentShell will automatically adjust the height of the window as necessary to display its content.
 * Use the component's config setting to adjust the window width if necessary.
 * This component will be hidden when it loses focus but will remain invisibly active.
 */
const SystemTrayComponent = () => (
	<SystemTrayComponentShell>
		<Preferences />
		<SystemLog />
		<CentralLogger />
		<Documentation />
		<Restart />
		<Reset />
		<Quit />
	</SystemTrayComponentShell>
);

ReactDOM.render(
	<FinsembleProvider>
		<SystemTrayComponent />
	</FinsembleProvider>,
	document.getElementById("SystemTrayComponent-tsx")
);
