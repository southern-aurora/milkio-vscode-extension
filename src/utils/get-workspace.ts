import { join } from "node:path";
import * as vscode from "vscode";

export const getWorkspace = (fsPath: string) => {
  if (vscode.workspace.workspaceFolders === undefined) {
    return [];
  }
  let matched = [] as Array<vscode.WorkspaceFolder>;
  for (const folder of vscode.workspace.workspaceFolders) {
    if (fsPath.startsWith(join(folder.uri.fsPath, "/"))) {
      matched.push(folder);
    }
  }

  return matched;
};
