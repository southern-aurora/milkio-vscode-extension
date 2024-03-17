import * as vscode from "vscode";
import { exec } from "node:child_process";
import { join } from "path";
import { getWorkspaceStates, states } from "../states";
import { waitingGenerated } from "../utils/waiting-generated";
import { readFile } from "node:fs/promises";
import { env } from "node:process";

const validator = (file: vscode.Uri, workspace: vscode.WorkspaceFolder) => {
  // if return true, trigger generation
  if (file.fsPath.startsWith(join(workspace.uri.fsPath, "src", "databases"))) return true;
  return false;
};

export const generate = async (file: vscode.Uri) => {
  const output = states.pull("output") as vscode.OutputChannel;
  const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
  if (!workspace) return;

  await waitingGenerated(getWorkspaceStates(workspace));

  let packageJson = await JSON.parse((await readFile(join(workspace.uri.fsPath, "package.json"))).toString());
  let command1 = `bun run ./node_modules/milkio/c.ts gen:database`;
  let command2 = packageJson?.scripts?.["database:migrate"];
  if (!command2) {
    vscode.window.showErrorMessage(
      'No ("scripts" -> "database:migrate") found in package.json. You need to write this command to instruct how to migrate your database.'
    );
    return;
  }

  vscode.window.terminals.find((terminal) => terminal.name.endsWith(`Milkio API Test`))?.dispose();
  vscode.window.terminals.find((terminal) => terminal.name.endsWith(`Milkio All API Test`))?.dispose();
  // If there is no terminal launched at startup, launch one. This is not necessary for Milkio but to optimize user experience. Otherwise, when Milkio exits, the entire panel will also exit.
  if (vscode.window.terminals.length === 0) vscode.window.createTerminal({ cwd: workspace.uri.fsPath }).show();

  const terminal = vscode.window.createTerminal({
    cwd: workspace.uri.fsPath,
  });

  let command = "";
  if (process.platform === "win32") {
    command = `$ErrorActionPreference = "Stop"; clear; ` + command1 + `; ` + command2 + `;`;
  } else {
    command = `clear && ` + command1 + ` && ` + command2;
  }
  terminal.sendText(command);
  terminal.show();
};

export const useGenerateDatabase = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand("milkio.generate-database", async () => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    generate(workspace.uri);
  });

  context.subscriptions.push(disposable);
};
