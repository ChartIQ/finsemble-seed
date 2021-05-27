/*!
 * Copyright 2017 by ChartIQ, Inc.
 * All rights reserved.
 */
import React from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@finsemble/finsemble-ui/react/components/FinsembleProvider";
import { AppCatalog } from "@finsemble/finsemble-ui/react/components/appCatalog";
import "@finsemble/finsemble-ui/react/assets/css/finsemble.css";
import "../../../assets/css/theme.css";

ReactDOM.render(
	<FinsembleProvider>
		<AppCatalog />
	</FinsembleProvider>,
	document.getElementById("AppCatalog-tsx")
);
