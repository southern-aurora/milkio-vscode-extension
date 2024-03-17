import * as vscode from "vscode";
import { getWorkspaceStates, states } from "../states";
import { generate } from "../uses/auto-generate";
import { env } from "node:process";
import { buildCookbook } from "../utils/build-cookbook";

const output = states.pull("output") as vscode.OutputChannel;

export const registerAllApiTest = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand("milkio.run-all-api-test", async () => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    const workspaceStates = getWorkspaceStates(workspace);
    if (!workspace || !workspaceStates) return;
    if (!workspaceStates) return;
    const terminalName =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1
        ? `(${workspace.name}) Milkio All API Test`
        : `Milkio All API Test`;

    const generatePromise = generate(false, workspace.uri, true);
    await vscode.window.withProgress(
      {
        title: "Milkio Generating..",
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      (progress, token) => {
        return new Promise(async (resolve) => {
          await generatePromise;
          resolve(undefined);
        });
      }
    );

    vscode.window.terminals.find((terminal) => terminal.name.endsWith(`Milkio API Test`))?.dispose();
    vscode.window.terminals.find((terminal) => terminal.name.endsWith(`Milkio All API Test`))?.dispose();
    // If there is no terminal launched at startup, launch one. This is not necessary for Milkio but to optimize user experience. Otherwise, when Milkio exits, the entire panel will also exit.
    if (vscode.window.terminals.length === 0) vscode.window.createTerminal({ cwd: workspace.uri.fsPath }).show();

    const terminal = vscode.window.createTerminal({
      name: terminalName,
      cwd: workspace.uri.fsPath,
      iconPath: new vscode.ThemeIcon("beaker"),
      isTransient: true,
      env: {
        ...env,
        LOONGBAO_RUN_MODE: "API_TEST",
        LOONGBAO_TEST_RESERVED: "1",
      },
    });

    let command = `bun run ./node_modules/milkio/c.ts test`;
    if (process.platform === "win32") {
      command = `$ErrorActionPreference = "Stop"; clear; ` + command + `; exit;`;
    } else {
      command = `clear && ` + command + ` && exit`;
    }
    terminal.sendText(command);
    terminal.show();

    void buildCookbook(workspace, output, workspaceStates);
  });

  context.subscriptions.push(disposable);
};
