/*!
 * Copyright 2017 by ChartIQ, Inc.
 * All rights reserved.
 */

import React, { useState, useEffect, FunctionComponent } from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@finsemble/finsemble-ui/react/components/FinsembleProvider";
import {
	ToolbarShell,
	FavoritesShell,
	DragHandle,
	RevealAll,
	MinimizeAll,
	AutoArrange,
	Search,
	AdvancedAppLauncherMenu,
	AppLauncherMenu,
	WorkspaceManagementMenu,
	ToolbarSection,
} from "@finsemble/finsemble-ui/react/components/toolbar";
import { FileMenu } from "./FileMenu";
import { useHotkey } from "@finsemble/finsemble-ui/react/hooks/useHotkey";
import "@finsemble/finsemble-ui/react/assets/css/finsemble.css";
import "../../../../assets/css/theme.css";

/* #region Customisation for dynamically configurable menus */
type MenuConfig = {
	label?: string;
	menuType: string;
	align: string;
	customData: {
		list?: any[];
		mode?: string;
	};
	icon?: string;
	fontIcon?: string;
};
type AppLaunchersProps = {
	align: string;
	dynamicMenus: MenuConfig[];
	components: any;
};
const AppLaunchers: FunctionComponent<AppLaunchersProps> = (props) => {
	const { dynamicMenus, components, align } = props;

	if (dynamicMenus.length === 0) {
		return (
			<>
				<AppLauncherMenu enableQuickComponents={true} />
			</>
		);
	} else {
		return (
			<>
				{dynamicMenus.map((config, i) => {
					if (align == config.align) {
						let theTitle: JSX.Element | string = "Apps";
						if (config.icon) {
							theTitle = <span>
								<img src={config.icon} style={{verticalAlign: "middle", marginRight: "5px"}}/>
								{config.label ? config.label : ""}
							</span>
						} else if (config.fontIcon) {
							theTitle = <span>
								<i className={config.fontIcon} style={{verticalAlign: "middle", marginRight: "5px"}}/>
								{config.label ? config.label : ""}
							</span>
						} else if (config.label) {
							theTitle = config.label;
						}
						
						if (config.menuType === "Advanced App Launcher"){
							return (
								<AdvancedAppLauncherMenu 
									title={theTitle}
									id={`menu-${i}`}
									enableQuickComponents={true} 
								/>
							);
						} else {
							if (config.customData.mode) {
								let allComps = Object.keys(components);
								let list: string[] = [];
								allComps.forEach(key => {
									if (components[key].component && components[key].component.mode == config.customData.mode){
										list.push(key);
									}
								});

								return (
									<AppLauncherMenu
										title={theTitle}
										id={`menu-${i}`}
										componentFilter={list}
										enableQuickComponents={false}
									/>
								);
							} else {
								return (
									<AppLauncherMenu
										title={theTitle}
										id={`menu-${i}`}
										componentFilter={config.customData.list}
										enableQuickComponents={false}
									/>
								);
							}
						}
					}
				})}
			</>
		);
	}
};

/* #endregion */

/**
 * Note: Set `FSBL.debug = true` if you need to reload the toolbar during development.
 * By default, it prevents the system from closing it so that users aren't lost without
 * a main window into finsemble functionality.
 */
const Toolbar = () => {
	useHotkey(["ctrl", "alt", "shift", "r"], () => FSBL.restartApplication());
	useHotkey(["ctrl", "alt", "up"], () => FSBL.Clients.LauncherClient.bringWindowsToFront());
	useHotkey(["ctrl", "alt", "down"], () => window.FSBL.Clients.WorkspaceClient.minimizeAll());

	/* #region retrieve Finsemble config for dynamically configured menus */
	const [dynamicMenus, setDynamicMenus] = useState([] as any[]);
	const [components, setComponents] = useState([] as any[]);
	useEffect(() => {
		FSBL.Clients.ConfigClient.getValue("finsemble", (err: any, config: any) => {
			const menuConfig = config.menus;
			const components = config.components;
			if (Array.isArray(menuConfig)) {
				setDynamicMenus(
					menuConfig.filter((menu) => menu.menuType === "App Launcher" || menu.menuType === "Advanced App Launcher"),
				);
				setComponents(
					components
				);
			}
		});
	}, []);
	/* endregion */

	return (
		<ToolbarShell hotkeyShow={["ctrl", "alt", "t"]} hotkeyHide={["ctrl", "alt", "h"]}>
			<ToolbarSection className="left">
				<DragHandle />
				<FileMenu />
				<Search openHotkey={["ctrl", "alt", "f"]} />
				<WorkspaceManagementMenu />
				{/* Component that generates dynamically configured menus */}
				<AppLaunchers dynamicMenus={dynamicMenus} components={components} align="left"/>
			</ToolbarSection>
			<ToolbarSection className="center" hideBelowWidth={115}>
				<div className="divider" />
				<FavoritesShell />
			</ToolbarSection>
			<ToolbarSection className="right">
				<div className="divider"></div>
				<AppLaunchers dynamicMenus={dynamicMenus} components={components} align="right"/>
				<AutoArrange />
				<MinimizeAll />
				<RevealAll />
			</ToolbarSection>
			<div className="resize-area"></div>
		</ToolbarShell>
	);
};

ReactDOM.render(
	<FinsembleProvider>
		<Toolbar />
	</FinsembleProvider>,
	document.getElementById("Toolbar-tsx")
);
