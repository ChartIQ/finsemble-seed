import { HotkeyCombination } from "./hotkeyTypes";

/**
 * Enum defining valid values for `InputType.format` which define the form that the data comes in.
 */
export type InputFormat = "text" | "json" | "table";

/** Type representing data that can be used as Input to an action or workflow. */
export type InputValue = string | object | Array<InputValue>;

/**
 * Enum defining valid values for `Workflow.inputSource` which control how the workflow will accept input.
 */
export enum InputSource {
	Clipboard = "clipboard",
	ManualEntry = "manual entry",
	FDC3RaiseIntent = "fdc3.raiseIntent",
}

/** Type representing the input data type accepted by a workflow or action.
 */
export type InputType = {
	/** Unique string id that may be used to refer to the InputType */
	id: string;
	/** Display name for the InputType */
	name: string;
	/** Data format for the InputType. */
	format: InputFormat;
	/** An input validation tool that can be used to confirm that a string input's format is valid */
	validators: InputTypeValidator[] | null;
	/** */
	/** A JSONSchema that can be used to confirm that a json input's format is valid.*/
	schemaURL: URL | null;
};

/**
 * Type representing the result of an input validation attempt. If `true` validation was successful,
 * otherwise this type will be a string indicating the validation error.
 */
export type ValidationResult = true | string;

/**
 * A Function used to validate an input value or a particular type, usually supplied as a string,
 * but supporting other formats.
 */
export type InputTypeValidator = (inputValue: InputValue) => ValidationResult;

/**
 * A type representing an application that can perform applications as part of a workflow.
 */
export type WorkflowApplication = {
	/** String identifier for the application, should be unique amongst the set of applications. */
	id: string;
	/** Display name for the WorkflowApplication */
	name: string;
	/** Actions that may be performed by the application and used in a workflow*/
	actionTypes: WorkflowActionType[];
};

/**
 * An enum representing the different types of option setting that might be applied to an action
 * in a workflow. These values will be used to render an appropriate control to set the value of
 * the option setting when creating a workflow.
 */
export enum WorkflowActionOptionType {
	/** Choose from a set of string options, which may be a staic set, or returned by a function.
	 * Note boolean options should use this type and be string encoded (`"true"` or `"false"`).*/
	MultipleChoice,
	/** Free Text entry. */
	TextEntry,
	/** JSON encoded as a String. */
	JSON,
	/** Numbers from a fixed set. */
	NumericMultipleChoice,
	/** Whole numbers within a fixed range. */
	NumericRange,
	/** Path to File on disk */
	File,
}

/**
 * A type representing the value set for an option setting applied to an action in a workflow.
 * Note that JSON setting types should be string encoded.
 */
export type WorkflowActionOptionValue = string | number;

/**
 * A type representing an option setting that may be applied to an action in a workflow. Each option
 * has a unique string identifier, display name, type (to enable rendering of an appropriate control
 * for setting the option),
 */
export type WorkflowActionOption = {
	/** String identifier for the option, should be unique amongst the set of options and subOptions for the action. */
	id: string;
	/** Display name for the WorkflowActionOption. */
	name: string;
	/** Defines the type of option value entry that should be presented (e.g a drop down menu, text
	 *  entry, numeric entry etc.)*/
	optionType: WorkflowActionOptionType;
	/** Values that may be selected for this option, depending on its type. Note that a function returning
	 *  an array of String values is allowed. Note that for `NumericRange` type, two numbers should be
	 * specified `[minimum, maximum]. If null, input values are not constrained - this will usually be the
	 * case for the `TextEntry` type.`*/
	values: WorkflowActionOptionValue[] | (() => WorkflowActionOptionValue[]) | null;
	/** If true, this option does not have to be set, otherwise it is required. This only applies to
	 * subOptions if they are relevant due to teh value of the parent option.*/
	allowUndefined: boolean;
	/** The default value to set. If `values` is set, then this field should match one of the available
	 *  values. */
	defaultValue?: WorkflowActionOptionValue;
	/** Map of additional options that are relevant if this option is set to a particular value. */
	subOptions?: Record<WorkflowActionOptionValue, WorkflowActionOption[]>;
	/** Optional custom validation function */
	validate?: (value: WorkflowActionOptionValue) => ValidationResult;
};

/**
 *  A type representing an action that could be taken as part of a workflow, including its display name,
 *  details of any options that may be set to configure it, input and output types and any sub-actions
 *  that may be used after this action. Functions should be provided to validate that options are correctly
 * set and to execute the action when necessary.
 */
export interface WorkflowActionType {
	/** String identifier for the action type, should be unique amongst the set of actions for the application. */
	id: string;
	/** Display name for the WorkflowActionType. */
	name: string;
	/** Options that control the behavior or the action. */
	options: WorkflowActionOption[];
	/** Optional ids for input types that may be required in order to perform the action. */
	inputTypeIds: string[] | null;
	/** Optional output type that may be produced and used as input to any subactions.*/
	outputType: InputType | null;
	/** Subactions that may be performed based on the output of this action. */
	subActionTypes: WorkflowActionType[] | null;
	/** Validate that an action's options have been fully and correctly set.*/
	validate: (options: WorkflowActionOption[], action: WorkflowAction) => ValidationResult;
	/** Perform the action as configured. */
	execute: (action: WorkflowAction, inputValue?: InputValue) => ActionResult;
}

/** Type representing an instance of a configured WorkflowActionType.
 */
export type WorkflowAction = {
	/** ID of the WorkflowActionType that this action was created from.*/
	typeId: string;
	/** Map of option ids to values. */
	optionValues?: Record<string, WorkflowActionOptionValue>;
	/** Configured sub-actions that should be run on the output of this action.*/
	subActions?: WorkflowAction[];
};

/** The result of executing a single action as part of a workflow. */
export type ActionResult = {
	/** Flag indicating whether the action was successfully executed. */
	success: boolean;
	/** Optional message associated with the result. If `success` is `false` this should always
	 * be set with an approporiate error message.*/
	message?: string;
	/** An (optional) output produced by the action*/
	output?: InputValue;
};

/**
 * A type representing a sequence of actions that should be performed, by a single applicaiton,
 * as part of a workflow.
 */
export type WorkflowSequence = {
	/** The id of the application that the sequence relates to. */
	applicationId: string;
	/** An ordered list of actions making up the sequence. */
	actions: WorkflowAction[];
};

/** Type representing a specific configued workflow and its steps, performed via a number of different applications.
 */
export type Workflow = {
	/** An externally defined identifier representing this specific workflow. Expected to be
	 * unique within the set of IDs for workflows.*/
	id: string;
	/** Display name for the workflow. */
	name: string;
	/** The input type that will be used to trigger the workflow. In most cases this will be required to
	 * start a workflow, but is allowed to be null in order to support workflows that will aquire input
	 * through one of their steps.
	 */
	inputTypeId: string | null;
	/** An array of source from which input can be received. In the event that a workflow requires no input
	 * this should be an empty array.
	 */
	inputSources: InputSource[];
	/** A hotkey combination that may be used to trigger input from clipboard for this workflow. */
	macroKeys?: HotkeyCombination;
	/** If the FDC3RaiseeIntent input source is selected, this field should contain the string intent that the workflow should be triggered by.*/
	intent?: string;
	/** An ordered list of `WorkflowSequence` objects that define this workflow. */
	sequences: WorkflowSequence[];
	/** If any issue with the workflow definition is found a validation message will be set with details.
	 * If there are no issues this should be null. Issues to report might include: missing id or name,
	 * missing priamaryInputTypeId, no InputSrouce set or no sequences set. */
	validationMessage: string | null;
};

/** The result of executing a workflow. */
export type WorkflowResult = {
	/** Flag indicating whether the workflow execution was successfull. */
	success: boolean;
	/** Optional message associated with the result. If `success` is `false` this should always
	 * be set with an approporiate error message.*/
	message?: string;
	/** An array of ActionResult arrays providing the results of each individual `WorkflowAction` in each
	 * `WorkflowSequence` that may be used to reconstruct the execution of the workflow.
	 */
	actionResults: ActionResult[][];
};

/** A type representing a function to execute a workflow. */
export type ExecuteWorkflow = (inputValue: InputValue, inputType: InputType, workflow: Workflow) => WorkflowResult;

/** Interface defining a class that can execute workflows. */
export interface WorkflowExecutor {
	/** Execute the workflow and return a result. */
	execute: ExecuteWorkflow;
}
