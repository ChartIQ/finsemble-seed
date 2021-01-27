(() => {
	"use strict";

	let users = {};

	/**
	 * Gets the configuration for a user and applies it to Finsemble application.
	 * 
	 * @param {string} username the username
	 */
	const applyUserConfig = username => {
		// Get user configuration. Replace with get from database/remote service
		const config = users[username];

		if (!config) {
			console.error(`No configuration found for user: ${username}`);
			return;
		}

		// Apply the configuration to Finsemble
		FSBL.Clients.ConfigClient.processAndSet(
			{
				newConfig: config,
				overwrite: true,
				replace: true
			},
			(err, config) => {
				if (err) {
					console.error(err);
					return;
				}

				// Applied successfully, publish authorization and close window
				FSBL.Clients.AuthenticationClient.publishAuthorization(username);
				FSBL.Clients.WindowClient.getCurrentWindow().close();
			});
	};

	window.onload = async () => {
		//retrieve the users file
		let data = await fetch("users.json", {cache: "no-cache"});
		users = await data.json();
		//console.log("got users JSON: " + users);

		FSBL.System.hideSplashScreen();

		// Populate dropdown with available users
		const select = document.getElementById("user");
		Object.keys(users).forEach((key, index) => {
			select.options[index] = new Option(key);
		});

		// Add onclick for quit button
		document.getElementById("quit").onclick = () => {
			FSBL.shutdownApplication();
			FSBL.Clients.WindowClient.getCurrentWindow().close();
		};

		// Add onclick for submit button
		document.getElementById("submit").onclick = () => {
			// Get selected user from form
			const username = document.getElementById("user").value;

			// Apply configuration to Finsemble.
			applyUserConfig(username);
		};
	};
})()