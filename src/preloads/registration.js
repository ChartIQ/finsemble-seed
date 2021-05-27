// Checks whether the registration has completed and publishes authorization
const registrationHandler = () => {
	// When the thank you message is displayed, the registration has been completed.
	const registrationComplete = !!document.getElementsByClassName("hs-form__thankyou-message").length;
	if (registrationComplete) {
		// save username to prevent having to register again.
		localStorage.setItem("username", "default");
	}

	let username = localStorage.getItem("username");
	fin.desktop.System.getEnvironmentVariable("EVAL_FORM", (env) => {
		if (username || env !== "yes") {
			// If user has already registered, or not in evaluation mode (yarn start), don't show registration form
			username = username ? username : "default";

			// User has already registered
			FSBL.Clients.AuthenticationClient.publishAuthorization(username, { username });

			// Close registration window
			finsembleWindow.close();
		} else {
			// Hiding splash screen because it can sometimes obscure the registration form.
			FSBL.System.hideSplashScreen();

			// Show registration form for user to register.
			finsembleWindow.show();
		}
	});
};

// Wait briefly for page to render before looking for the submit button
setTimeout(() => {
	const buttons = document.getElementsByTagName("button");
	if (buttons.length == 1) {
		buttons[0].onclick = () => {
			// Wait briefly for page to render before checking the registration
			setTimeout(registrationHandler, 2000);
		};
	}

	const buttonRowDiv = document.getElementsByClassName("hs-form__actions")[0];

	const nbsp = document.createTextNode("\u00A0");
	buttonRowDiv.appendChild(nbsp);
	
	const closeButton = document.createElement("button");
	closeButton.setAttribute("class", "hs-form__actions__submit");
	closeButton.appendChild(document.createTextNode("Close"));
	closeButton.onclick = () => FSBL.System.exit();
	buttonRowDiv.appendChild(closeButton);
}, 2000);

// Startup pattern for preload. Preloads can come in any order, so we need to wait on either the window event or the
// FSBL event
if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", registrationHandler);
} else {
	window.addEventListener("FSBLReady", registrationHandler);
}
