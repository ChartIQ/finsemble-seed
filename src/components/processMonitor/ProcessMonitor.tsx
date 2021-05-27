/*!
 * Copyright 2017 by ChartIQ, Inc.
 * All rights reserved.
 */
import React from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@finsemble/finsemble-ui/react/components/FinsembleProvider";
import { ProcessMonitor } from "@finsemble/finsemble-ui/react/components/processMonitor";
import "@finsemble/finsemble-ui/react/assets/css/finsemble.css";
import "../../../assets/css/theme.css";

ReactDOM.render(
	<FinsembleProvider>
		<ProcessMonitor />
	</FinsembleProvider>,
	document.getElementById("ProcessMonitor-tsx")
);
