/**
 * Component used to spawn groups of other component windows, using configuration
 * provided as spawn data. Can also be used to listening for components closing
 * and will close all other components in the group. To ensure that components can 
 * be closed together after being rehydrated from a workspace, this component
 * should also be added to the workspace.
 */
import { spawnComponentGroup, getWindowIdentifiers, setupCloseListeners, closeAllWindows } from './spawnComponentGroup'

const FSBLReady = () => {
	try {
		FSBL.Clients.WindowClient.getComponentState({
			field: 'state',
		}, (err, state) => {
			if (!err && state) { //loading from a workspace
			   let {identifiers, spawnerData} = state;
				//set up listeners on each window so that we can close them all together
				setupCloseListeners(identifiers, true, () => {
					closeAllWindows(identifiers);
					//Close the spawner component as its no longer needed
					FSBL.Clients.WindowClient.close({ removeFromWorkspace: true, closeWindow: true });
				});
		    } else { //new spawn
				//get the spawner configuration provided in spawn data.
				let spawnerData = FSBL.Clients.WindowClient.getSpawnData();
				if (spawnerData && spawnerData.toSpawn) {
					//get the spawner's own config and position info (the spawned components will offset from that position)
					finsembleWindow.getOptions(async (err,data) => {
						if(!err) {
							let spawnerOptions = data;
							//let spawnerConfig = FSBL.Clients.WindowClient.options.customData;

							spawnerOptions.bottom = spawnerOptions.defaultTop + spawnerOptions.defaultHeight;
							spawnerOptions.right = spawnerOptions.defaultLeft + spawnerOptions.defaultWidth;
							if (!spawnerOptions.monitorDimensions) {
								const monitor = await FSBL.Clients.LauncherClient.getMonitor(finsembleWindow.windowIdentifier);
								spawnerOptions.monitorDimensions = monitor.availableRect;
							}
							let params = {
								//make position data relative to the current monitor (and convert bottom/right to distance from those edges)
								top: spawnerOptions.defaultTop, // - spawnerOptions.monitorDimensions.top, /* disabled due to changes in Finsemble claimed space) */ 
								left: spawnerOptions.defaultLeft, // - spawnerOptions.monitorDimensions.left, /* disabled due to changes in Finsemble claimed space) */
								bottom: spawnerOptions.monitorDimensions.bottom - spawnerOptions.bottom,
								right: spawnerOptions.monitorDimensions.right - spawnerOptions.right,
								width: spawnerOptions.defaultWidth,
								height: spawnerOptions.defaultHeight,
								linkerGroup: spawnerData.linkerGroup,
								addToWorkspace: typeof spawnerData.addToWorkspace != "undefined" ? spawnerData.addToWorkspace : true //assume components should be in workspace if not explicitly set
							}

							spawnComponentGroup(spawnerData.toSpawn, params)
								.then((spawnResponses) => { 
									FSBL.Clients.Logger.log("Group components spawn responses:", spawnResponses);
									
									if (spawnerData.closeComponentsTogether) {
										// get the windowIdentifiers for each of the windows spawned
										let identifiers = getWindowIdentifiers(spawnResponses);

										console.log("identifiers:", identifiers);
										console.log("spawnerData:", spawnerData);
										

										//save as state in the workspace
										FSBL.Clients.WindowClient.setComponentState({
											field: "state", 
											value: {
												identifiers: identifiers,
												spawnerData: spawnerData
											}});

										//set up listeners on each window so that we can close them all together
										setupCloseListeners(identifiers, true, async () => {
											await closeAllWindows(identifiers);
											//Close the spawner component as its no longer needed
											FSBL.Clients.WindowClient.close({ removeFromWorkspace: true, closeWindow: true });
										});
									} else {
										//Close the spawner component as its no longer needed
										FSBL.Clients.WindowClient.close({ removeFromWorkspace: true, closeWindow: true });
									}
								})
								.catch((err) => { 
									FSBL.Clients.Logger.error("Failed to spawn component group, error:", err);
								});
						} else {
							FSBL.Logger.error("Failed to retrieve spawner's dimensions! Error: ", err);
						}
					});
				} else {
					FSBL.Logger.error("Received no spawner data, spawnerData: ", spawnerData);
				}
			}
	    });
	} catch (e) {
		FSBL.Clients.Logger.error(e);
	}
}

if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", FSBLReady)
} else {
	window.addEventListener("FSBLReady", FSBLReady)
} 