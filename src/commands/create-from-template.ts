import * as vscode from "vscode";
import { getWorkspaceStates, states } from "../states";
import { join } from "path";
import { existsSync } from "fs";
import { exec } from "child_process";

export const createFromTemplate = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand("milkio.create-from-template", async (uri: vscode.Uri) => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    const workspaceStates = getWorkspaceStates(workspace);
    if (!workspace || !workspaceStates) return;

    const output = states.pull("output") as vscode.OutputChannel;
    const items: Array<vscode.QuickPickItem> = [{ label: "api", description: "(built-in)" }];

    const templates = [
      // read /node_modules/milkio/templates
      ...(await (async () => {
        const templatesPath = vscode.Uri.file(join(workspace.uri.fsPath, ".templates"));
        if (!existsSync(templatesPath.fsPath)) return [];
        return (await vscode.workspace.fs.readDirectory(templatesPath)).filter(
          (item) => item[0].endsWith(".ts") && item[1] === vscode.FileType.File
        );
      })()),
    ];

    for (const template of templates) {
      items.push({ label: template[0].slice(0, -3) });
    }

    const instantiateName = await vscode.window.showInputBox({
      placeHolder: "Enter template name",
      prompt: "What name should you give to the file(s) you created?",
    });
    if (!instantiateName) {
      return;
    }
    if (!/^[a-z0-9/-]+$/.test(instantiateName)) {
      vscode.window.showInformationMessage(`The path can only contain lowercase letters, numbers, and "-".`);
      return;
    }
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a template",
    });
    if (!selected) return;

    let path: string;
    if (selected.label === "api") {
      path = join(workspace.uri.fsPath, "node_modules", "milkio", "templates", "api.ts");
    } else {
      path = join(workspace.uri.fsPath, ".templates", `${selected.label}.ts`);
    }

    await new Promise((resolve) => {
      exec(
        `bun run ${path} '${instantiateName}' '${uri.fsPath}'`,
        {
          cwd: workspace.uri.fsPath,
        },
        (error, stdout) => {
          output.append(stdout);
          if (error) {
            output.append(error.message);
            if (error.stack) output.append(error.stack);
            vscode.window.showErrorMessage(`Template creation failed`);
            output.show();
          }
          resolve(undefined);
        }
      );
    });
  });

  context.subscriptions.push(disposable);
};
