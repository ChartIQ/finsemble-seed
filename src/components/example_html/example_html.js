const FSBLReady = () => {
	try {
		// Subscribe to router message
		FSBL.Clients.RouterClient.addListener('color', onRouterValueChanged)
		restoreState()
	} catch (e) {
		FSBL.Clients.Logger.error(e);
	}
}

function onRouterValueChanged(err, response) {
	if (!err) {
		if (response.data) {
			changeColor(response.data.r, response.data.g, response.data.b)
		}
	}
}

function changeColor(r, g, b) {
	document.getElementById('color').style.backgroundColor = "rgb(" + r + ", " + g + ", " + b + ")";
	saveState(r, g, b)
}

function saveState(r, g, b) {
	const params = {
		fields: [{
				field: "r",
				value: r
			},
			{
				field: "g",
				value: g
			},
			{
				field: "b",
				value: b
			}
		]
	}
	FSBL.Clients.WindowClient.setComponentState(params);
}

function restoreState(){
	const params = {
		fields: [
			"r",
			"g",
			"b"
		]
	};

	// TODO: Change to await so show can be after restore
	FSBL.Clients.WindowClient.getComponentState(params, componentStateHandler);
}

function componentStateHandler(err, state){
	changeColor(state.r, state.g, state.b)
}

if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", FSBLReady)
} else {
	window.addEventListener("FSBLReady", FSBLReady)
}