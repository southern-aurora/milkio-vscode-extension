import * as vscode from "vscode";
import { states } from "../states";
import { generate } from "../uses/auto-generate";
import { waitingGenerated } from "./waiting-generated";

const output = states.pull("output") as vscode.OutputChannel;

export const runCommandByTerminal = async (
  workspace: vscode.WorkspaceFolder,
  workspaceStates: any,
  terminalName: string,
  commands: Array<string>,
  exit: boolean
) => {
  vscode.window.terminals.find((terminal) => terminal.name === terminalName)?.dispose();
  await waitingGenerated(workspaceStates);

  // If there is no terminal launched at startup, launch one. This is not necessary for Milkio but to optimize user experience. Otherwise, when Milkio exits, the entire panel will also exit.
  if (vscode.window.terminals.length === 0) vscode.window.createTerminal({ cwd: workspace.uri.fsPath }).show();

  workspaceStates.publish("httpServerReloading", false);
  const terminal = vscode.window.createTerminal({
    name: terminalName,
    cwd: workspace.uri.fsPath,
    iconPath: new vscode.ThemeIcon("symbol-method"),
    isTransient: true,
  });

  let command = "";
  if (exit) {
    if (process.platform === "win32") {
      command = `$ErrorActionPreference = "Stop"; clear; ` + commands.join("; ");
    } else {
      command = "clear && " + commands.join(" && ");
    }
  } else {
    if (process.platform === "win32") {
      command = `$ErrorActionPreference = "Stop"; clear; ` + commands.join("; ") + `; echo "Press (Enter) to quit.."; pause; exit;`;
    } else {
      command = "clear && " + commands.join(" && ") + ` && echo "Press (Enter) to quit.." && read -n 1 && exit`;
    }
  }
  terminal.sendText(command);
  terminal.show();
};
