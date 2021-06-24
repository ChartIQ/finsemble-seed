/*!
 * Copyright 2017 by ChartIQ, Inc.
 * All rights reserved.
 */
import {testApplication} from "./actions/TestActions";
import { Workflow, WorkflowAction } from "./actions/workflowTypes";
const Finsemble = require("@finsemble/finsemble-core");
const BaseService = Finsemble.baseService;
const {
  RouterClient,
  LinkerClient,
  ConfigClient,
  DialogManager,
  WindowClient,
  LauncherClient,
  DistributedStoreClient,
  Logger,
} = Finsemble.Clients;

ConfigClient.initialize();
DialogManager.initialize();
LauncherClient.initialize();
Logger.start();
WindowClient.initialize();
DistributedStoreClient.initialize();

Logger.log("WorkflowService starting up");

const availableApplications = [testApplication];

class WorkflowService extends BaseService {
  constructor(params: {
    name: string;
    startupDependencies: {
      services: string[];
      clients: string[];
    };
  }) {
    super(params);
    this.initialize = this.initialize.bind(this);
    this.onBaseServiceReady(this.initialize);
    this.start();
    //Logger.log("WorkflowService started");
  }
  /**
   * Initializes service variables
   * @private
   */
  async initialize(cb: () => void) {
    this.createRouterEndpoints();

    console.log("WorkflowService initialized");
    // Confirm that testApplication was imported
    testApplication.actionTypes[0].execute({typeId: "basic"});
    ConfigClient.addListener({field: "finsemble.custom.workflow"}, (err: any, data: any) => {
      if(err === null){
        registerWorkflows(data.value);
      }
    });

    ConfigClient.getValue("finsemble.custom.workflow", generateFakeWorkflowIfEmpty);
    cb();
  }

  /**
   * Creates router endpoints for all of our client APIs. Add servers or listeners for requests coming from your clients.
   * @private
   */
  createRouterEndpoints() {
    console.log("createRouterEndpoints");

    this.createHotkeys();
  }

  createHotkeys() {
    Finsemble.Clients.HotkeyClient.removeAllHotkeys(() => {});
    Finsemble.Clients.ConfigClient.getValues(
      ["finsemble.custom.initiateWorkflowClipboard", "finsemble.custom.initiateWorkflowInput"],
      (err: any, values: any) => {
        console.log(values);
        if (err) {
          console.log(err);
        } else {
          Finsemble.Clients.HotkeyClient.addGlobalHotkey(
            values['finsemble.custom.initiateWorkflowClipboard'],
            showInitiateComponentClipboard,
            () => {}
          );
          Finsemble.Clients.HotkeyClient.addGlobalHotkey(
            values['finsemble.custom.initiateWorkflowInput'],
            showInitiateComponentInput,
            () => {}
          );
        }
      }
    );
  }
}

const registerWorkflows = (workflowsConfigValue: any[]) => {
  // TODO: Unregister previously registered hotkeys
  
  workflowsConfigValue.forEach((workflowConfig) => {
    Finsemble.Clients.HotkeyClient.addGlobalHotkey(
      workflowConfig.macroKeys,
      () => {
        runWorkflowConfig(workflowConfig);
      },
      () => {}
    );
  })

}

const generateFakeWorkflowIfEmpty = (err: any, response: any) => {
  // If workflow is already set, then register it
  if(err !== null && response !== null){
    registerWorkflows(response);
    return;
  }

  // If no workflow has been set, register this example:
  const value = [
    {
      id: "123",
      name: "My Test Workflow",
      inputTypeId: null,
      inputSources: [],
      macroKeys: ["Ctrl", "Shift", "V"],
      sequences: [
        {
          applicationId: "testId",
          actions: [
            {
              typeId: "basic"
            },
            {
              typeId: "basic_inputs"
            },
            {
              typeId: "basic_options",
              optionValues: ["Hello", "World"]
            }
          ]
        }
      ],
      validationMessage: null
    },
    {
      id: "456",
      name: "My Failing Test Workflow",
      inputTypeId: null,
      inputSources: [],
      macroKeys: ["Ctrl", "Alt", "Shift", "V"],
      sequences: [
        {
          applicationId: "testId",
          actions: [
            {
              typeId: "basic"
            },
            {
              typeId: "basic_errors"
            },
            {
              typeId: "basic_options",
              optionValues: ["Hello", "World"]
            }
          ]
        }
      ],
      validationMessage: null
    }
  ] as Workflow[];
  
  ConfigClient.setPreference({
    field: "finsemble.custom.workflow",
    value
  });
}

const runWorkflowConfig = (workflowsConfigValue: any) => {
  const {sequences} = workflowsConfigValue;

  // Each workflow sequence will go in, well, in a sequence
  for(const sequence of sequences){
    const {actions, applicationId} = sequence;
    const workflowAction = availableApplications.find((app) => (app.id === applicationId));
  
    // For each action in this workflow sequence
    for(const action of actions){
      // Figure out with application action matches this workflow sequence action
      const actionToExecute = workflowAction?.actionTypes.find((item) => (item.id === action.typeId));
      const result = actionToExecute?.execute(action, "Example input value");

      // Report errors
      if(result?.success !== true){
        console.log(`There was an error when executing action. Error message: ${result?.message}`);
        console.log("Executing action:", action);
        return;
      }
    }
  }
}

const showInitiateComponentClipboard = () => {
  Finsemble.Clients.LauncherClient.showWindow(
    { componentType: "InitiateWorkflow" },
    {
      spawnIfNotFound: true,
      data: { mode: "clipboard" },
      addToWorkspace: false,
      autoFocus: true,
      left: "center",
      top: "center",
    },
    (err: any, res: any) => {}
  );
};

const showInitiateComponentInput = () => {
  Finsemble.Clients.LauncherClient.showWindow(
    { componentType: "InitiateWorkflow" },
    {
      spawnIfNotFound: true,
      data: { mode: "input" },
      addToWorkspace: false,
      autoFocus: true,
      left: "center",
      top: "center",
    },
    (err: any, res: any) => {}
  );
};

const serviceInstance = new WorkflowService({
  name: "Workflow",
  startupDependencies: {
    // add any services or clients that should be started before your service
    services: [],
    clients: [],
  },
});

serviceInstance.start();
export default serviceInstance;
