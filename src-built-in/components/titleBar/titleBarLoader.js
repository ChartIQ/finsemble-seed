function init() {
	if (window.headerLoaded) return;
	window.headerLoaded = true;
	require("./TitleBar.jsx");
}

if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", init);
} else {
	window.addEventListener("FSBLReady", init);
}
