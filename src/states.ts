import * as vscode from "vscode";
import { definePurinPubsub } from "./utils/purin-pubsub";

export const runtime = {
  // If it is the first time, do not execute quick generation.
  notFirstGen: false,
};

export const states = definePurinPubsub<{
  output: vscode.OutputChannel;
  statusBar: vscode.StatusBarItem;
  activeProject: null | vscode.WorkspaceFolder;
}>();

states.publish("output", vscode.window.createOutputChannel("Milkio"));
states.publish("statusBar", vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100));
states.publish("activeProject", null);

export const workspaceStatesMap = new Map<string, ReturnType<typeof makeWorkspaceState>>();

export const makeWorkspaceState = () => {
  const workspaceStates = definePurinPubsub<{
    generating: boolean;
    generatingPromise: null | Promise<unknown>;
    cookbookBuilding: boolean;
    cookbookBuildingPromise: null | Promise<unknown>;
    httpServerReloading: boolean;
    httpServerTerminalName: null | string;
  }>();
  workspaceStates.publish("generating", false);
  workspaceStates.publish("generatingPromise", null);
  workspaceStates.publish("cookbookBuilding", false);
  workspaceStates.publish("cookbookBuildingPromise", null);
  workspaceStates.publish("httpServerReloading", false);
  workspaceStates.publish("httpServerTerminalName", null);

  return workspaceStates;
};

export const getWorkspaceStates = (workspace?: vscode.WorkspaceFolder | null) => {
  if (!workspace) return undefined;
  if (workspaceStatesMap.has(workspace.uri.fsPath)) {
    return workspaceStatesMap.get(workspace.uri.fsPath);
  } else {
    const state = makeWorkspaceState();
    workspaceStatesMap.set(workspace.uri.fsPath, state);
    return state;
  }
};
