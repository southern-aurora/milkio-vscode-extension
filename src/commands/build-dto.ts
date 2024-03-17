import * as vscode from "vscode";
import { getWorkspaceStates, states } from "../states";
import { runCommandByTerminal } from "../utils/run-command-by-terminal";

export const buildDTO = (context: vscode.ExtensionContext) => {
  const output = states.pull("output") as vscode.OutputChannel;
  const disposable = vscode.commands.registerCommand("milkio.build-dto", async () => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    const workspaceStates = getWorkspaceStates(workspace);
    if (!workspace || !workspaceStates) return;

    const terminalName =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1
        ? `(${workspace.name}) Milkio Build DTO`
        : `Milkio Build DTO`;
    const commands = [
      //
      "bun run ./node_modules/milkio/c.ts build:dto",
    ];

    void runCommandByTerminal(workspace, workspaceStates, terminalName, commands, false);
  });

  context.subscriptions.push(disposable);
};
