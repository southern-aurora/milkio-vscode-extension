import * as vscode from "vscode";
import { getWorkspaceStates, states } from "../states";
import { debounce } from "lodash";

export const useStatusBar = (context: vscode.ExtensionContext) => {
  const stdout = states.pull("stdout") as vscode.OutputChannel;
  const statusBar = states.pull("statusBar") as vscode.StatusBarItem;
  statusBar.command = "milkio.open-extension-menu";
  context.subscriptions.push(statusBar);

  const getText = () => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    const workspaceStates = getWorkspaceStates(workspace);
    if (!workspace || !workspaceStates) return;
    let text = "$(run-all) Milkio";
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
      const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
      text += ` (${workspace.name})`;
    }
    return text;
  };

  const toIdle = () => (statusBar.text = `${getText()}`);
  const toGenerating = () => (statusBar.text = `${getText()} | $(sync~spin) Generating..`);

  const checkGenerating = (generating: boolean) => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    const workspaceStates = getWorkspaceStates(workspace);
    if (!workspace || !workspaceStates) return;
    if (generating) {
      toGenerating();
    } else toIdle();
  };

  let subscribedWorkspace = new Set();
  const switchProject = debounce(async () => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    const workspaceStates = getWorkspaceStates(workspace);
    if (!workspace || !workspaceStates) {
      statusBar.hide();
      return;
    }
    checkGenerating(false);
    if (!subscribedWorkspace.has(workspace)) {
      subscribedWorkspace.add(workspace);
      workspaceStates.subscribe("generating", (e) => checkGenerating(e.value));
    }
    statusBar.show();
  }, 256);

  states.subscribe("activeProject", switchProject);

  switchProject();

  vscode.window.onDidOpenTerminal(switchProject);
  vscode.window.onDidCloseTerminal(switchProject);
};
