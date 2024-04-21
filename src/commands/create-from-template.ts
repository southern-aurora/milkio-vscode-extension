import * as vscode from "vscode";
import { getWorkspaceStates, states } from "../states";
import { join } from "path";
import { existsSync } from "fs";
import { exec } from "child_process";
import { getWorkspace } from "../utils/get-workspace";

export const createFromTemplate = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand("milkio.create-from-template", async (uri: vscode.Uri) => {
    const workspace = getWorkspace(uri.fsPath)[0];

    const output = states.pull("output") as vscode.OutputChannel;
    const items: Array<vscode.QuickPickItem> = [];

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
      placeHolder: "What name should you give to the file(s) you created?",
    });
    if (!instantiateName) {
      return;
    }
    if (!/^[a-z0-9/$/-]+$/.test(instantiateName)) {
      vscode.window.showInformationMessage(`The path can only contain lowercase letters, numbers, and "-".`);
      return;
    }
    if (instantiateName === "src") {
      vscode.window.showInformationMessage(`Cannot use "src" as a name.`);
      return;
    }
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a template",
    });
    if (!selected) return;

    let path: string;
    path = join(workspace.uri.fsPath, ".templates", `${selected.label}.ts`);

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
