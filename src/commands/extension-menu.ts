import * as vscode from "vscode";
import { getWorkspaceStates, states, workspaceStatesMap } from "../states";

export const registerExtensionMenu = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand("milkio.open-extension-menu", async () => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    const workspaceStates = getWorkspaceStates(workspace);
    if (!workspace || !workspaceStates) return;

    const items: Array<vscode.QuickPickItem> = [];
    items.push({ label: "$(run-all) Run HTTP Server" });
    items.push({ label: "$(database) Database Generate & Migrate" });
    items.push({ label: "$(beaker) Test All APIs" });
    items.push({ label: "$(remote) Build DTO" });
    items.push({ label: "$(refresh) Generate" });
    items.push({ label: "$(window) Open Milkio Documents (via Browser)" });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: (process.platform !== "darwin" ? "(ALT + F6)" : "(⌘ + ⇧ + L)") + ` Can Open This Menubar`,
    });
    if (!selected) return;
    else if (selected.label === "$(run-all) Run HTTP Server") {
      vscode.commands.executeCommand("milkio.http-server");
    } else if (selected.label === "$(beaker) Test All APIs") {
      vscode.commands.executeCommand("milkio.run-all-api-test");
    } else if (selected.label === "$(remote) Build DTO") {
      vscode.commands.executeCommand("milkio.build-dto");
    } else if (selected.label === "$(window) Open Milkio Documents (via Browser)") {
      vscode.env.openExternal(vscode.Uri.parse("https://southern-aurora.github.io/milkio/"));
    } else if (selected.label === "$(refresh) Generate") {
      if (vscode.window.terminals.find((terminal) => terminal.name.endsWith(`Milkio HTTP Server`))) {
        vscode.window.showErrorMessage(
          "Milkio HTTP Server is in the open, generate will cause it to throw an exception. Please close and try again."
        );
      } else {
        await vscode.commands.executeCommand("milkio.generate");
      }
    } else if (selected.label === "$(database) Database Generate & Migrate") {
      await vscode.commands.executeCommand("milkio.generate-database");
    }
  });

  context.subscriptions.push(disposable);
};
