var componentToTrackName
var componentToTrack
var currentBounds

const FSBLReady = async () => {
	try {
		FSBL.Clients.WindowClient.getBounds(async (err, bound) => {
			let spawnData = FSBL.Clients.WindowClient.getSpawnData();
			componentToTrackName = spawnData.componentToTrack
			await restoreComponentToTrack(bound)
			moveComponentToTrack()

			//Add hotkey to move componentToTrack to current move position
			FSBL.Clients.HotkeyClient.addGlobalHotkey(["ctrl", "shift", "m"], moveComponentToTrackToMousePos, () => {})
		})
	} catch (e) {
		FSBL.Clients.Logger.error(e);
	}
}

const moveComponentToTrackToMousePos = () => {
	constgetMousePosition((err, mousePosition) => {
		componentToTrack.setBounds(mousePosition, () => {})
		currentBounds.top = mousePosition.top
		currentBounds.left = mousePosition.left

		componentToTrack.setBounds(currentBounds, () => {
			FSBL.Clients.WindowClient.setComponentState({
				field: 'bound',
				value: currentBounds
			});
		})
	})
}

constgetMousePosition = (cb) => {
	fin.desktop.System.getMousePosition((mousePosition) => {
		if (mousePosition.left || mousePosition.left === 0)
			mousePosition.x = mousePosition.left;
		if (mousePosition.top || mousePosition.top === 0)
			mousePosition.y = mousePosition.top;
		cb(null, mousePosition);
	}, (err) => {
		cb(err, null);
	});
}

const restoreComponentToTrack = async (bound) => {
	await FSBL.Clients.LauncherClient.showWindow({
		name: componentToTrackName,
		componentType: componentToTrackName
	}, {
		top: bound.top,
		left: bound.left,
		width: bound.width,
		height: bound.height,
		autoFocus: true,
		spawnIfNotFound: true
	}, async (err, windowIdentifier) => {
		componentToTrack = windowIdentifier.finWindow
		componentToTrack.restore(() => {
			componentToTrack.focus()
		})
	})
}

const moveComponentToTrack = () => {
	// use tracking Component's state
	FSBL.Clients.WindowClient.getComponentState({
		field: 'bound',
	}, (err, state) => {
		if (state) {
			currentBounds = state
			setTrackingComponentPosition(state)
		} else {
			FSBL.Clients.WindowClient.getBounds((err, bound) => {
				setTrackingComponentPosition(bound)
			})
		}
	});
}

const setTrackingComponentPosition = async (position) => {
	componentToTrack.setBounds(position, () => {
		componentToTrack.maximize(() => {
			componentToTrack.restore(() => {
				//FinsembleWindow to listen bounds-change-end
				componentToTrack.addEventListener("bounds-change-end", (event) => {
					FSBL.Clients.WindowClient.restore()
					bounds = event.data;
					delete bounds.right;
					delete bounds.bottom
					currentBounds = bounds
					//Save bound to trackingComponent's state
					FSBL.Clients.WindowClient.setComponentState({
						field: 'bound',
						value: bounds
					});
				});

				componentToTrack.addEventListener("closed", (event) => {
					FSBL.Clients.WindowClient.close()
				});

				componentToTrack.addEventListener("minimized", (event) => {
					FSBL.Clients.WindowClient.minimize()
				});

				componentToTrack.addEventListener("restored", (event) => {
					FSBL.Clients.WindowClient.restore()
				});
			})
		})
	})
}

const onunload = () => {
	componentToTrack.minimize()
}

if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", FSBLReady)
} else {
	window.addEventListener("FSBLReady", FSBLReady)
}

window.addEventListener("unload", onunload)