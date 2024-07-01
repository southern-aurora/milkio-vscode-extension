import * as vscode from "vscode";
import { exec } from "node:child_process";
import { join, sep } from "node:path";
import { rmSync } from "node:fs";
import { getWorkspaceStates, runtime, states } from "../states";
import { waitingGenerated } from "../utils/waiting-generated";
import { getEnv } from "../utils/get-env";
import { getBun } from "../utils/get-bun";

const validator = (file: vscode.Uri, workspace: vscode.WorkspaceFolder) => {
  // if return true, trigger generation
  if (file.fsPath.startsWith(join(workspace.uri.fsPath, "src"))) return true;
  // client
  if (file.fsPath.startsWith(join(workspace.uri.fsPath, "packages", "client"))) {
    if (file.fsPath.startsWith(join(workspace.uri.fsPath, "packages", "client", "dist"))) return false;
    if (file.fsPath.startsWith(join(workspace.uri.fsPath, "packages", "client", "project"))) return false;
    if (file.fsPath.startsWith(join(workspace.uri.fsPath, "packages", "client", "node_modules"))) return false;
    return true;
  }
  // files in the root directory
  if (workspace.uri.fsPath.split(sep).length + 1 === file.fsPath.length) return true;
  return false;
};

export const generate = async (file: vscode.Uri, force?: boolean, waitingInsignificant?: boolean) => {
  if (runtime.notFirstGen === false) {
    runtime.notFirstGen = true;
  }
  const output = states.pull("output") as vscode.OutputChannel;
  const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
  if (!workspace) return;
  if (force !== true) {
    if (!file.fsPath.startsWith(workspace.uri.fsPath)) return;
    if (!validator(file, workspace)) return;
  }
  const workspaceStates = getWorkspaceStates(workspace);
  console.log(workspaceStates);
  if (!workspaceStates) return;
  console.log(workspaceStates.pull("generating"));
  if (workspaceStates.pull("generating")) return;

  workspaceStates.publish("generating", true);
  // if (partial !== true && existsSync(join(workspace.uri.fsPath, "generated"))) {
  //   rmSync(join(workspace.uri.fsPath, "generated", "products"), { recursive: true, force: true });
  //   rmSync(join(workspace.uri.fsPath, "generated", "raw"), { recursive: true, force: true });
  // }
  output.clear();

  workspaceStates.publish(
    "generatingPromise",
    new Promise((resolve) => {
      const command = `${getBun()} run ./node_modules/milkio/c.ts gen:significant`;
      exec(
        command,
        {
          cwd: workspace.uri.fsPath,
          env: { ...getEnv() },
        },
        (error, stdout) => {
          output.append(stdout);
          if (error) {
            output.append(error.message);
            if (error.stack) output.append(error.stack);
            // output.show();
          }
          resolve(undefined);
        }
      );
    })
  );

  await workspaceStates.pull("generatingPromise");
  workspaceStates.publish("generating", false);

  // Insignificant
  const insignificantPromise = new Promise((resolve) => {
    const command = `${getBun()} run ./node_modules/milkio/c.ts gen:insignificant`;
    exec(
      command,
      {
        cwd: workspace.uri.fsPath,
        env: { ...getEnv() },
      },
      (error, stdout) => {
        output.append(stdout);
        if (error) {
          output.append(error.message);
          if (error.stack) output.append(error.stack);
          // output.show();
        }

        resolve(undefined);
      }
    );
  });
  if (waitingInsignificant) await insignificantPromise;

  // Clean up temporary directory
  (async () => {
    rmSync(join(workspace.uri.fsPath, "generated", "raw-tmp"), { recursive: true, force: true });
    rmSync(join(workspace.uri.fsPath, "generated", "products-tmp"), { recursive: true, force: true });
  })();
};

export const useAutoGenerate = (context: vscode.ExtensionContext) => {
  const autoGenerateWatcher = vscode.workspace.createFileSystemWatcher("**/*.ts", false, false, false);

  const toGenerate = async (workspace: vscode.WorkspaceFolder | null) => {
    if (!workspace) return;
    await generate(workspace.uri, true);
  };

  const disposable = vscode.commands.registerCommand("milkio.generate", async () => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    void toGenerate(workspace);
    await waitingGenerated(getWorkspaceStates(workspace));
  });

  autoGenerateWatcher.onDidChange(async (e) => generate(e));
  autoGenerateWatcher.onDidDelete(async (e) => generate(e));
  autoGenerateWatcher.onDidCreate(async (e) => {
    runtime.notFirstGen = false;
    generate(e);
  });

  context.subscriptions.push(disposable);
};
