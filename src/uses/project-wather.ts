import { nextTick } from "process";
import * as vscode from "vscode";
import { getWorkspace } from "../utils/get-workspace";
import { states } from "../states";
import { checkMilkioProject } from "../utils/check-milkio-project";

export const useProjectWatcher = async (context: vscode.ExtensionContext) => {
  const checkProject = async (workspace: vscode.WorkspaceFolder | null | undefined) => {
    if (!workspace || !(await checkMilkioProject(workspace.uri.fsPath))) {
      states.publish("activeProject", null);
      vscode.commands.executeCommand(`setContext`, `isMilkioProject`, false);
      return;
    }

    vscode.commands.executeCommand(`setContext`, `isMilkioProject`, true);
    states.publish("activeProject", workspace);
  };

  // If there is only one workspace, there is no need to judge based on the way files are opened
  if (vscode.workspace.workspaceFolders?.length === 1) {
    await checkProject(vscode.workspace.workspaceFolders[0]);
    return;
  }

  // Monitor the active file to determine the selected workspace based on the file.
  const handler = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      states.publish("activeProject", null);
      return;
    }
    const workspace = getWorkspace(editor.document.uri.fsPath);
    await checkProject(workspace);
  };
  vscode.window.onDidChangeActiveTextEditor(handler);
  await handler();
};
