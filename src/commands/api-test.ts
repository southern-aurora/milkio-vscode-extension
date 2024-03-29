import * as vscode from "vscode";
import { getWorkspaceStates, states } from "../states";
import { waitingGenerated } from "../utils/waiting-generated";
import { checkMilkioProject } from "../utils/check-milkio-project";
import { buildCookbook } from "../utils/build-cookbook";

const output = states.pull("output") as vscode.OutputChannel;

export const registerApiTest = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand("milkio.run-api-test", async () => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    const workspaceStates = getWorkspaceStates(workspace);
    if (!workspace || !workspaceStates) return;
    await waitingGenerated(workspaceStates);
    const docment = vscode.window.activeTextEditor?.document;
    if (!docment) return;
    if (!(await checkMilkioProject(workspace.uri.fsPath))) {
      vscode.window.showInformationMessage(
        "Have you opened the parent or child folder? Please try reopening the directory or workspace using VSCode so that the Milkio Project is located in the root directory of VSCode."
      );
      return;
    }
    const filePath = docment.uri.fsPath.slice(workspace.uri.fsPath.length + "/src/app/".length).slice(0, -3);
    const terminalName =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1
        ? `(${workspace.name}) Milkio API Test`
        : `Milkio API Test`;

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
        ...process.env,
        LOONGBAO_RUN_MODE: "API_TEST",
      },
    });

    let command = `bun run ./node_modules/milkio/c.ts test "${filePath}" "1"`;
    if (process.platform === "win32") {
      command = `$ErrorActionPreference = "Stop"; clear; ` + command + `; exit;`;
    } else {
      command = "clear && " + command + ` && exit`;
    }
    terminal.sendText(command);
    terminal.show();

    void buildCookbook(workspace, output, workspaceStates);
  });

  context.subscriptions.push(disposable);
};
