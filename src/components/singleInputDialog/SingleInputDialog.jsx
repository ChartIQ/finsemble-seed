/*!
 * Copyright 2017 by ChartIQ, Inc.
 * All rights reserved.
 */
import React from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@chartiq/finsemble-ui/react/components";
import { SingleInputDialog } from "@chartiq/finsemble-ui/react/components";
import "@chartiq/finsemble-ui/react/assets/css/finsemble.css";
import "../../../assets/css/theme.css";

ReactDOM.render(
	<FinsembleProvider>
		<SingleInputDialog />
	</FinsembleProvider>,
	document.getElementById("singleInputDialog-component-wrapper")
);
