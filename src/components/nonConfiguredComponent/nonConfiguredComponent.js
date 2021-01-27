import "./nonConfiguredComponent.css";

if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", init);
} else {
	window.addEventListener("FSBLReady", init);
}

function init() {
	let contentElement = document.getElementById("contentURL");
	let previousURL = "Missing previous";
	let spData = FSBL.Clients.WindowClient.options.customData;
	if (spData && spData.previousURL) previousURL = spData.previousURL;
	contentElement.innerText = `URL: ${previousURL}.`;
}
