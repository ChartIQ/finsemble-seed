/*!
* Copyright 2017 by ChartIQ, Inc.
* All rights reserved.
*/
import ReactDOM from "react-dom";
import React from "react";
import { ToolbarShell, FavoritesShell, DragHandle, RevealAll, MinimizeAll, AutoArrange, Search, AppLauncher, WorkspaceManagementMenu } from "@chartiq/finsemble-ui/lib/components";

import '../toolbar.css';
import { ExampleMenu, ExampleMenu2, AdvancedExample } from "./exampleMenu";
const Toolbar = () => {
	return (
		<ToolbarShell>
			<div className="finsemble-toolbar-section left">
				<DragHandle />
				<Search/>
				<AppLauncher />
				<WorkspaceManagementMenu/>
				{/* App Menu */}
			</div>
			<div className="finsemble-toolbar-section center">
				<FavoritesShell />
			</div>
			<div className="finsemble-toolbar-section right">
				<MinimizeAll />
				<AutoArrange />
				<RevealAll />
			</div>
			<div className="resize-area" ></div>



		</ToolbarShell>
	)
}

ReactDOM.render(<Toolbar />, document.getElementById("toolbar_refactored"));
