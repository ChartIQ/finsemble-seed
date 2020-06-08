
//references to securities set on the runCommand form
let UIReady = false;
let connectionEventListener = null;
let groupEventListener = null

//-----------------------------------------------------------------------------------------
//Ready function that sets up the form
const FSBLReady = () => {
	try {
		setupFormUX();
		UIReady = true;
	} catch (e) {
		FSBL.Clients.Logger.error(e);
	}
}

//-----------------------------------------------------------------------------------------
//API client functions
/** Callback is called only on disconnect to trigger polling. */
const _setConnectionEventListener = (cb) => {
	if (connectionEventListener) {
		_removeConnectionEventListener();
	}
	console.log("Set new Listener for Bloomberg connection events...");
	connectionEventListener = (err, resp) => {
		console.log("Received connection event... Response: ", resp);
		if (err) {
			console.error("Received Bloomberg connection error: ", err);
		} else {
			console.log("Received Bloomberg connection event: ", resp);
		}
		cb(err, resp);
	};
	FSBL.Clients.RouterClient.addListener("BBG_connection_status", connectionEventListener);
};

const _removeConnectionEventListener = () => {
	if (connectionEventListener) {
		FSBL.Clients.RouterClient.removeListener("BBG_connection_status", connectionEventListener);
		console.log("Removed connection event listener");
	} else {
		console.warn("Tried to remove non-existent connection event listener");
	}
};

const _setGroupEventListener = (cb) => {
	if (groupEventListener) {
		_removeGroupEventListener();
	}
	console.log("Set new listener for Bloomberg group context events...");
	groupEventListener = (err, resp) => {
		if (err) {
			console.error("Received Bloomberg group context error: ", err);
		} else {
			console.log("Received Bloomberg group context event: ", resp);
		}
		cb(err, resp);
	};
	FSBL.Clients.RouterClient.addListener("BBG_group_context_events", groupEventListener);
};

const _removeGroupEventListener = () => {
	if (groupEventListener) {
		FSBL.Clients.RouterClient.removeListener("BBG_group_context_events", groupEventListener);
		console.log("Removed group context event listener");
	} else {
		console.warn("Tried to remove non-existent group context event listener");
	}

};

const _checkConnection = (cb) => {
	console.log("Checking connection status...");

	FSBL.Clients.RouterClient.query("BBG_connection_status", {}, (err, resp) => {
		if (err) {
			console.warn("Received error when checking connection status: ", err);
			cb(err, false);
		} else {
			if (resp && resp.data && resp.data["loggedIn"]) {
				console.log("Received connection status: ", resp.data);
				cb(null, resp.data["loggedIn"]);
			} else {
				console.log("Received negative or empty response when checking connection status: ", resp);
				cb("Received negative or empty response when checking connection status", null);
			}

		}
	});
};

const queryBloombergBridge = (message, cb) => {
	console.log("BBG_run_terminal_function query:", message);
	FSBL.Clients.Logger.log("BBG_run_terminal_function query:", message);
	FSBL.Clients.RouterClient.query("BBG_run_terminal_function", message, apiResponseHandler(cb));
}

const apiResponseHandler = (cb) => {
	return (err, resp) => {
		if (err) {
			let errMsg = "Error returned by BBG_run_terminal_function: ";
			console.error(errMsg, err);
			FSBL.Clients.Logger.error(errMsg, err);
			cb(err, resp);
		} else if (!resp || !resp.data || !resp.data.status) {
			let errMsg = "Negative status returned by BBG_run_terminal_function: ";
			console.error(errMsg, resp);
			FSBL.Clients.Logger.error(errMsg, resp);
			cb("Command returned negative status", resp);
		} else {
			let msg = "BBG_run_terminal_function successful, response: ";
			console.log(msg, resp.data);
			FSBL.Clients.Logger.log(msg, resp);
			cb(null, resp.data);
		}
	};
};

const _runBBGCommand = (mnemonic, securities, panel, tails, cb) => {
	let message = {
		function: "RunFunction",
		mnemonic: mnemonic,
		securities: securities,
		tails: tails,
		panel: panel
	};

	queryBloombergBridge(message, cb);
};

const _runCreateWorksheet = (worksheetName, securities, cb) => {
	let message = {
		function: "CreateWorksheet",
		name: worksheetName,
		securities: securities
	};

	queryBloombergBridge(message, cb);
};

const _runGetAllWorksheets = (cb) => {
	let message = {
		function: "GetAllWorksheets"
	};

	queryBloombergBridge(message, cb);
};

const _runGetWorksheet = (worksheetId, cb) => {
	let message = {
		function: "GetWorksheet",
		id: worksheetId
	};

	queryBloombergBridge(message, cb);
}

const _runReplaceWorksheet = (worksheetId, securities, cb) => {
	let message = {
		function: "ReplaceWorksheet",
		id: worksheetId,
		securities: securities
	};

	queryBloombergBridge(message, cb);
};

const _runGetAllGroups= (cb) => {
	let message = {
		function: "GetAllGroups"
	};

	queryBloombergBridge(message, cb);
};

const _runGetGroupContext = (groupName, cb) => {
	let message = {
		function: "GetGroupContext",
		name: groupName
	};

	queryBloombergBridge(message, cb);
};

const _runSetGroupContext = (groupName, value, cookie, cb) => {
	let message = {
		function: "SetGroupContext",
		name: groupName,
		value: value
	};

	if (cookie) {
		message.cookie = cookie;
	}

	queryBloombergBridge(message, cb);
}

//-----------------------------------------------------------------------------------------
//functions related to connection status

window.setupConnectionLifecycleChecks = () => { 
	//do the initial check
	checkConnection();
	//listen for connection events (listen/transmit)
	_setConnectionEventListener(checkConnection);
	//its also possible to poll for connection status,
	//  worth doing in case the bridge process is killed off and doesn't get a chance to send an update
	setInterval(checkConnection, 30000);
};

window.checkConnection = () => {
	_checkConnection((err, resp) => { 
		if (!err && resp === true) {
			showConnectedIcon();
		} else {
			showDisconnectedIcon();
		}
	});
};

//-----------------------------------------------------------------------------------------
//functions related to runCommand

window.runBBGCommand = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	let mnemonic = document.getElementById("mnemonic").value;
	mnemonic = mnemonic ? mnemonic.trim() : null;
	let securities = getSecurities("securities");
	let tails = document.getElementById("tails").value;
	tails = tails ? tails.trim() : null;
	let panel = document.getElementById("panel").value;
	
	//validate input
	let error = false;
	if (!mnemonic || mnemonic == "") {
		showElement("mnemonicError");
		error = true;
	}
	//many commands are valid with only one security, most can also be run with none
	// if (!instrument || instrument == "") {
	// 	showElement("securityError");
	// 	error = true;
	// }
	if (!error) {
		_runBBGCommand(mnemonic, securities, panel, tails, (err, response) => {
			if (err) {
				showElement("commandError");
			} else {
				showElement("commandSuccess");
			}
		});
	}
};



//-----------------------------------------------------------------------------------------
//functions related to worksheets

window.createWorksheet = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	let worksheetName = document.getElementById("worksheetName").value;
	worksheetName = worksheetName ? worksheetName.trim() : null;
	let securities = getSecurities("worksheetSecurities");

	//validate input
	let error = false;
	if (!worksheetName || worksheetName == "") {
		showElement("worksheetNameError");
		error = true;
	}
	if (!error) {
		_runCreateWorksheet(worksheetName, securities, (err, data) => { 
			if (err) {
				showElement("worksheetError");
			} else {
				renderWorksheet(data.worksheet.name, data.worksheet.id, data.worksheet.securities);
				showElement("worksheetCreateSuccess");
			}
			getAllWorksheets();
		});
	}
};

window.getAllWorksheets = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	_runGetAllWorksheets((err, response) => {
		if (response && response.worksheets && Array.isArray(response.worksheets)) {
			//clear the list
			let theList = document.getElementById("allWorksheets");
			while (theList.lastElementChild) {
				theList.removeChild(theList.lastElementChild);
			}
			//render the updated list
			response.worksheets.forEach(element => {
				let li = document.createElement("li");
				li.id = "li_worksheet_" + element.id;
				li.className = "worksheetLi";
				let worksheetLabel = document.createElement("span");
				worksheetLabel.className = "worksheetLabel hover";
				worksheetLabel.textContent = element.name;
				worksheetLabel.onclick = (e) => {
					e.preventDefault();
					loadWorkSheet(element.id);
				};
				li.appendChild(worksheetLabel);

				theList.appendChild(li);
			});
		} else {
			console.error("invalid response from _runGetAllWorksheets", response);
			showElement("allWorksheetsError");
		}
	});
};

window.loadWorkSheet = (worksheetId) => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");
	
	_runGetWorksheet(worksheetId, (err, response) => {
		//TODO: support other types of worksheet
		if (response && response.worksheet && Array.isArray(response.worksheet.securities)) {
			renderWorksheet(response.worksheet.name, response.worksheet.id, response.worksheet.securities);
		} else {
			console.error("invalid response from _runGetWorksheet");
			showElement("worksheetError");
		}
	
	});
};


window.replaceWorksheet = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	let worksheetId = document.getElementById("worksheetId").value;
	worksheetId = worksheetId ? worksheetId.trim() : null;
	let securities = getSecurities("worksheetSecurities");

	//validate input
	let error = false;
	if (!worksheetId || worksheetId == "") {
		showElement("worksheetIdError");
		error = true;
	}
	if (!error) {
		_runReplaceWorksheet(worksheetId, securities, (err, data) => {
			if (err) {
				showElement("worksheetError");
			} else {
				renderWorksheet(data.worksheet.name, data.worksheet.id, data.worksheet.securities);
				showElement("worksheetSaveSuccess");
			}
			getAllWorksheets();
		});
	}
};


//-----------------------------------------------------------------------------------------
//UI functions related to groups

window.getAllGroups = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	_runGetAllGroups((err, response) => {
		if (response && response.groups && Array.isArray(response.groups)) {
			//clear the list
			let theList = document.getElementById("allGroups");
			while (theList.lastElementChild) {
				theList.removeChild(theList.lastElementChild);
			}
			//render the updated list
			response.groups.forEach(element => {
				let li = document.createElement("li");
				li.className = "groupLi";
				li.id = "li_group_" + encodeURI(element.name);
				let groupLabel = document.createElement("span");
				groupLabel.textContent = element.name + " (" + element.type + ")";
				groupLabel.className = " groupLabel hover";
				groupLabel.onclick = (e) => {
					e.preventDefault();
					toggleGroup(li.id, element);
				};
				li.appendChild(groupLabel);

				theList.appendChild(li);
			});
		} else {
			console.error("invalid response from _runGetAllGroups", response);
			showElement("allGroupsError");
		}
	});
};

window.toggleGroup = (elementId, group) => {
	let element = document.getElementById(elementId);
	let detailsArr = element.getElementsByClassName("groupDetails");
	if (detailsArr.length > 0) {
		Array.prototype.forEach.call(detailsArr, (deets) => { deets.remove() });
	} else {
		
		let template = document.querySelector('#groupDetails');
		let details = template.content.cloneNode(true).firstElementChild;
		let nameField = details.children[0].children[0];
		let typeField = details.children[1].children[0];
		let valueField = details.children[2].children[0];
		nameField.value = group.name;
		typeField.value = group.type;
		valueField.value = group.value;

		element.appendChild(details);
	}
}

window.setGroupContext = (detailsElement, sector) => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	let name = detailsElement.children[0].children[0].value;
	let newValueField = detailsElement.getElementsByClassName("newGroupValue")[0];
	
	let newValue = newValueField.value;
	if (sector) {
		newValue += " " + sector;
	}

	_runSetGroupContext(name, newValue, null, (err, data) => {
		if (err) {
			showElement("setGroupContextError");
		} else {
			showElement("setGroupContextSuccess");
		}

		//Retrieve context and update values 
		refreshGroupContext(detailsElement);
	});

};

window.refreshGroupContext = (detailsElement) => { 
	let nameField = detailsElement.children[0].children[0];
	let typeField = detailsElement.children[1].children[0];
	let valueField = detailsElement.children[2].children[0];

	//Retrieve context and update values 
	_runGetGroupContext(nameField.value, (err, data2) => {
		if (err) {
			showElement("getGroupContextError");
		} else {
			nameField.value = data2.group.name;
			typeField.value = data2.group.type;
			valueField.value = data2.group.value;
		}
	});
};

window.setupGroupEventListener = () => {
	_setGroupEventListener((err, resp) => {
		let logElement = document.getElementById("groupEventLog");
		let logEntry = "\n";
		if (err) {
			logEntry += JSON.stringify(err, null, 2) + "\n---";
		} else {
			logEntry += JSON.stringify(resp.data, null, 2) + "\n---";
		}
		//TODO: cap total length of log
		
		logElement.value += logEntry;
		//scroll to bottom
		logElement.scrollTop = logElement.scrollHeight;

	});
};

//-----------------------------------------------------------------------------------------
//UI functions related to components




//-----------------------------------------------------------------------------------------
//Util functions for the form UI

// auto-hit add button on enter
const setupFormUX = () => {
	console.log("Setting up form UX");
	clickButtonOnEnter("securityInput", "addSecurityButton");
	clickButtonOnEnter("mnemonic", "runCommandButton");
	clickButtonOnEnter("createWorksheetSecurityInput", "cwAddSecurityButton");
	setupConnectionLifecycleChecks();
	setupGroupEventListener();
};

const displayType = (heading, column) => {
	if (UIReady) {
		// first child of the parent node
		let sibling = heading.parentNode.firstChild;

		// process all siblings of the selected heading 
		while (sibling) {
			if (sibling.nodeType === 1) {
				if (sibling !== heading) {
					sibling.className = "heading";
				}
			}
			sibling = sibling.nextSibling;
		}
		heading.className = "heading active";

		// process all siblings of the selected column
		sibling = column.parentNode.firstChild;
		while (sibling) {
			if (sibling.nodeType === 1) {
				if (sibling !== column) {
					sibling.className = "column hidden";
				}
			}
			sibling = sibling.nextSibling;
		}
		column.className = "column";

	} else {
		console.warn("User clicked on header before UI was ready, ignoring...");
	}
};

window.displayCol = (elementName) => {
	displayType(document.getElementById(elementName + "Heading"), document.getElementById(elementName + "Col"));
	//do any custom functionality for particular cols
	switch (elementName) {
		case "worksheets":
			window.getAllWorksheets();
			break;
		case "groups":
			window.getAllGroups();
		default:
			break;
	}
};

window.showElement = (id) => {
	let element = document.getElementById(id);
	element.classList.remove("hidden");
};

window.hideElement = (id) => {
	let element = document.getElementById(id);
	element.classList.add("hidden");
};

window.hideElementsByClass = (className) => {
	Array.from(document.getElementsByClassName(className)).forEach((el) => {
		el.classList.add("hidden");
	});
}

window.showConnectedIcon = () => {
	document.getElementById("connectedIndicator").classList.remove("hidden");
	document.getElementById("disconnectedIndicator").classList.add("hidden");
}

window.showDisconnectedIcon = () => {
	document.getElementById("connectedIndicator").classList.add("hidden");
	document.getElementById("disconnectedIndicator").classList.remove("hidden");
}

window.clickButtonOnEnter = (fieldId, buttonId) => {
	document.getElementById(fieldId).addEventListener("keyup", function (event) {
		// Number 13 is the "Enter" key on the keyboard
		if (event.keyCode === 13) {
			// Cancel the default action, if needed
			event.preventDefault();
			// Trigger the button element with a click
			document.getElementById(buttonId).click();
		}
	});
}

window.addSecurity = (input, list, sector) => {
	let security = document.getElementById(input).value;
	if (security) {
		hideElement("securityError");
		if (sector) {
			security = security + " " + sector;
		}

		let li = document.createElement("li");
		li.id = "li_security_" + encodeURI(security);
		li.appendChild(document.createTextNode(security));

		let removeButton = document.createElement("button");
		removeButton.className = "removeButton";
		removeButton.textContent = " X ";
		removeButton.onclick = (e) => {
			e.preventDefault();
			window.removeSecurity(security, list);
		};

		li.appendChild(removeButton);

		document.getElementById(list).appendChild(li);
		document.getElementById(input).value = "";
	} else {
		console.warn(`Already added security '${security}', ignoring...`);
	}
};

window.removeSecurity = (security, list) => {
	let element = document.getElementById("li_security_" + encodeURI(security));
	if (element) {
		document.getElementById(list).removeChild(element);
	}
};

window.getSecurities = (list) => {
	let element = document.getElementById(list).firstChild;
	let securitiesArr = [];
	while (element) {
		if (element.nodeType === 1) {

			securitiesArr.push(element.firstChild.textContent);
		}
		element = element.nextSibling;
	}
	return securitiesArr;
};

window.renderWorksheet = (worksheetName, id, securities) => {
	//clear the list
	let theList = document.getElementById("worksheetSecurities");
	while (theList.lastElementChild) {
		theList.removeChild(theList.lastElementChild);
	}
	//render the updated list
	securities.forEach(element => {
		let li = document.createElement("li");
		li.id = "li_security_" + encodeURI(element);
		li.appendChild(document.createTextNode(element));

		let removeButton = document.createElement("button");
		removeButton.className = "removeButton";
		removeButton.textContent = " X ";
		removeButton.onclick = (e) => {
			e.preventDefault();
			window.removeSecurity(element, "worksheetSecurities");
		};

		li.appendChild(removeButton);

		theList.appendChild(li);
	});
	document.getElementById("worksheetName").value = worksheetName;
	document.getElementById("worksheetId").value = id;
};

if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", FSBLReady)
} else {
	window.addEventListener("FSBLReady", FSBLReady)
}