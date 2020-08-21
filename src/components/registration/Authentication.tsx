/*!
 * Copyright 2020 by ChartIQ, Inc.
 * All rights reserved.
 *
 * This is a sample Finsemble Authentication Component written using React hooks. It is meant as a starting point
 * for you to build your own Authentication Component. Use the `useAuth()` react hook, or the Finsemble client API
 * to interact with Finsemble's authentication capabilities.
 *
 * See https://documentation.chartiq.com/finsemble/tutorial-Authentication.html for a tutorial on how to use authentication.
 */

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@chartiq/finsemble-ui/react/components/FinsembleProvider";
import { useAuth } from "@chartiq/finsemble-ui/react/hooks/useAuth";
import "@chartiq/finsemble-ui/react/assets/css/finsemble.css";
import "@chartiq/finsemble-ui/react/assets/css/dialogs.css";
import "@chartiq/finsemble-ui/react/assets/css/authentication.css";
import "../../../assets/css/theme.css";
import "./Authentication.css"

export const Authentication = () => {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [jobTitle, setJobTitle] = useState("");
	const [company, setCompany] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [payload, setPayload] = useState<{
		firstName: string;
		lastName: string;
		jobTitle: string;
		company: string;
		email: string;
		phone: string;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { quitApplication, publishAuthorization } = useAuth();

	/**
	 * With React Hooks we must use `useEffect()` for effects such as server calls. Here, we use
	 * the "payload" state as a way to trigger an effect to authenticate the user against a back
	 * end server. Whenever the value of payload changes, this effect will run. The value of payload
	 * changes when the form is submitted (see <form> element in the jsx).
	 */
	useEffect(() => {
		// Check whether user has already registered
		const username = localStorage.getItem("username");
		if (username) {
			// User has already registered
			publishAuthorization(username, { username });

			// Close authentication window
			FSBL.Clients.WindowClient.getCurrentWindow().close();
		} else {
			// Hiding splash screen because it can sometimes obscure the registration form.
			FSBL.System.hideSplashScreen();

			// Show registration form for user to register.
			FSBL.Clients.WindowClient.getCurrentWindow().show();
		}

		if (!payload) return;

		const authenticate = async () => {
			await sendToServer();

			// save username to prevent having to register again.
			localStorage.setItem("username", payload.firstName);

			/**
			 * This is the most important step. Once your back end server has authenticated the user
			 * call publishAuthorization() from the useAuth() hook. The first parameter (username) is
			 * required. The second parameter (credentials) is option. Credentials can contain anything
			 * that is useful for session management, such as user ID, tokens, etc.
			 */
			publishAuthorization(payload.firstName, { username: payload.firstName });

			// Close authentication window
			FSBL.Clients.WindowClient.getCurrentWindow().close();
		};

		authenticate();
	}, [payload]);

	const submit = () => {
		setPayload({
			firstName: firstName,
			lastName: lastName,
			jobTitle: jobTitle,
			company: company,
			email: email,
			phone: phone
		});
	};

	const sendToServer = async () => {
		// encode payload into body string
		let body = "";
		Object.keys(payload).forEach(key => {
			const encodedValue = encodeURIComponent(payload[key]);
			if (body.length > 0) {
				body += "&";
			}
			body += `${key}=${encodedValue}`;
		});

		// Send user information to server
		await fetch("https://go.cosaic.io/l/834693/2020-08-21/61q65", {
			"headers": {
				"content-type": "application/x-www-form-urlencoded",
			},
			"body": body,
			"method": "POST",
			"mode": "no-cors"
		});
	}

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
				<div className="fsbl-auth-welcome">Thank you for downloading Finsemble. Please register to begin your evaluation.</div>
				{error && <div className="fsbl-input-error-message">{error}</div>}
				<form
					onSubmit={(event) => {
						submit();
						event.preventDefault();
					}}
				>
					<div className="fsbl-registration">
						<label>First Name*</label>
						<input
							className="fsbl-auth-input"
							type="text"
							name="first-name"
							required
							value={firstName}
							onChange={(event) => {
								setFirstName(event.target.value);
							}}
						/>
						<label>Last Name*</label>
						<input
							className="fsbl-auth-input"
							type="text"
							name="last-name"
							required
							value={lastName}
							onChange={(event) => {
								setLastName(event.target.value);
							}}
						/>

						<label>Job Title*</label>
						<input
							className="fsbl-auth-input"
							type="text"
							name="job-title"
							required
							value={jobTitle}
							onChange={(event) => {
								setJobTitle(event.target.value);
							}}
						/>

						<label>Company*</label>
						<input
							className="fsbl-auth-input"
							type="text"
							name="company"
							required
							value={company}
							onChange={(event) => {
								setCompany(event.target.value);
							}}
						/>

						<label>Email*</label>
						<input
							className="fsbl-auth-input"
							type="email"
							name="email"
							value={email}
							required
							onChange={(event) => {
								setEmail(event.target.value);
							}}
						/>

						<label>Phone</label>
						<input
							className="fsbl-auth-input"
							type="tel"
							name="phone"
							value={phone}
							onChange={(event) => {
								setPhone(event.target.value);
							}}
						/>
					</div>
					<button type="submit" className="fsbl-button fsbl-button-affirmative">
						Submit
					</button>
				</form>
				<div className="fsbl-copyright">
					© 2020 Cosaic, Inc. All Rights Reserved |
					<div className="fsbl-link" onClick={() => FSBL.System.openUrlWithBrowser("https://cosaic.io/privacy-policy/")}>Privacy Policy</div> |
					<div className="fsbl-link" onClick={() => FSBL.System.openUrlWithBrowser("https://cosaic.io/developer-license-agreement/")}>Developer License Agreement</div>
				</div>
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
