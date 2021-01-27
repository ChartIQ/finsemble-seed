/*!
 * Copyright 2020 by ChartIQ, Inc.
 * All rights reserved.
 *
 * This is a sample Finsemble Authentication Component written using React hooks. It is meant as a starting point
 * for you to build your own Authentication Component. Use the `useAuth()` react hook, or the Finsemble client API
 * to interact with Finsemble's authentication capabilities.
 *
 * See https://documentation.finsemble.com/tutorial-Authentication.html for a tutorial on how to use authentication.
 */

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@finsemble/finsemble-ui/react/components/FinsembleProvider";
import { useAuth, useAuthSimulator } from "@finsemble/finsemble-ui/react/hooks";
import "@finsemble/finsemble-ui/react/assets/css/finsemble.css";
import "@finsemble/finsemble-ui/react/assets/css/dialogs.css";
import "@finsemble/finsemble-ui/react/assets/css/authentication.css";
import "../../../assets/css/theme.css";

const bringToFront = () => FSBL.Clients.WindowClient.bringWindowToFront();
export const Authentication = () => {
	// Make sure this dialog shows on top of the splash screen
	useEffect(bringToFront, []);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [payload, setPayload] = useState<{
		username: string;
		password: string;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { quitApplication, publishAuthorization } = useAuth();
	const { sendToServer } = useAuthSimulator();

	/**
	 * With React Hooks we must use `useEffect()` for effects such as server calls. Here, we use
	 * the "payload" state as a way to trigger an effect to authenticate the user against a back
	 * end server. Whenever the value of payload changes, this effect will run. The value of payload
	 * changes when the form is submitted (see <form> element in the jsx).
	 *
	 * In this example we're using Finsemble's useAuthSimulator() hook to simulate a back end server.
	 * This hook will allow any username/password combination by returning {result:"ok"}. But it will
	 * return {error: "error text"} if either username or password are left blank.
	 */
	useEffect(() => {
		if (!payload) return;

		const authenticate = async () => {
			const response = await sendToServer(payload.username, payload.password);
			if (response.result === "ok") {
				/**
				 * This is the most important step. Once your back end server has authenticated the user
				 * call publishAuthorization() from the useAuth() hook. The first parameter (username) is
				 * required. The second parameter (credentials) is option. Credentials can contain anything
				 * that is useful for session management, such as user ID, tokens, etc.
				 */
				publishAuthorization(payload.username, { username: payload.username });
			} else if (response.error) {
				setError(response.error);
			}
		};

		authenticate();
	}, [payload]);

	const submit = () => {
		setPayload({ username: username, password: password });
	};

	/**
	 * What follows is a cookie-cutter form written in React Hooks style. There is nothing here that
	 * is proprietary to Finsemble. Your form should be built as needed to support your login process.
	 * CSS Styles are imported from "Authentication.css" (see imports above).
	 */
	return (
		<>
			<div className="fsbl-auth-top">
				<img className="fsbl-company-logo" />
				<div className="fsbl-close">
					<i className="ff-close" onClick={quitApplication}></i>
				</div>
			</div>

			<div className="fsbl-auth-wrapper">
				<div className="fsbl-auth-logo"></div>
				{error && <div className="fsbl-input-error-message">{error}</div>}
				<form
					onSubmit={(event) => {
						submit();
						event.preventDefault();
					}}
				>
					<input
						className="fsbl-auth-input"
						type="text"
						name="username"
						placeholder="Username"
						value={username}
						onChange={(event) => {
							setUsername(event.target.value);
						}}
					/>

					<input
						className="fsbl-auth-input"
						type="password"
						name="password"
						placeholder="Password"
						value={password}
						onChange={(event) => {
							setPassword(event.target.value);
						}}
					/>

					<button type="submit" className="fsbl-button fsbl-button-affirmative">
						Login
					</button>
				</form>
			</div>
		</>
	);
};

ReactDOM.render(
	<FinsembleProvider>
		<Authentication />
	</FinsembleProvider>,
	document.getElementById("Authentication-tsx")
);
