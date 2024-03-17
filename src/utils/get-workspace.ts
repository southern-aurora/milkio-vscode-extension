import * as vscode from "vscode";

export const getWorkspace = (fsPath: string) => {
  if (vscode.workspace.workspaceFolders === undefined) {
    return undefined;
  }
  for (const folder of vscode.workspace.workspaceFolders) {
    if (fsPath.startsWith(folder.uri.fsPath) + "/" || fsPath.startsWith(folder.uri.fsPath) + "\\") {
      return folder;
    }
  }

  return undefined;
};
