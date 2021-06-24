import {ValidationResult, WorkflowApplication, WorkflowAction, InputValue, ActionResult} from "./workflowTypes";

const defaultOptionValidator = () => (true as ValidationResult);

export const testApplication: WorkflowApplication = {
	id: "testId",
	name: "testName",
	actionTypes: [
		{
			id: "basic",
			name: "Basically does nothing",
			options: [],
			inputTypeIds: null, //action is defined by options so no input required
			outputType: null, //no output produced
			subActionTypes: null, //no output and hence no sub-actions
			validate: defaultOptionValidator, //On save validate that valid settings were provided
			execute: (action: WorkflowAction, inputValue?: InputValue): ActionResult => {
				console.log("You called testApplication action 'basic'");
				return { success: true};
			},
		},
		{
			id: "basic_options",
			name: "Basically just prints options",
			options: [],
			inputTypeIds: null,
			outputType: null, //no output produced
			subActionTypes: null, //no output and hence no sub-actions
			validate: defaultOptionValidator, //On save validate that valid settings were provided
			execute: (action: WorkflowAction, inputValue?: InputValue): ActionResult => {
				console.log(`testApplication action 'basic_options' with options: `, action.optionValues);
				return { success: true};
			},
		},
		{
			id: "basic_inputs",
			name: "Basically just prints inputs",
			options: [],
			inputTypeIds: null,
			outputType: null, //no output produced
			subActionTypes: null, //no output and hence no sub-actions
			validate: defaultOptionValidator, //On save validate that valid settings were provided
			execute: (action: WorkflowAction, inputValue?: InputValue): ActionResult => {
				console.log(`testApplication action 'basic_inputs' with inputs:`, inputValue);
				return { success: true};
			},
		},
		{
			id: "basic_errors",
			name: "Basically just errors",
			options: [],
			inputTypeIds: null,
			outputType: null, //no output produced
			subActionTypes: null, //no output and hence no sub-actions
			validate: defaultOptionValidator, //On save validate that valid settings were provided
			execute: (action: WorkflowAction, inputValue?: InputValue): ActionResult => {
				console.error(`testApplication action 'basic_errors' with inputs`);
				return { success: false, message: "This is a drill"};
			},
		},
	],
};