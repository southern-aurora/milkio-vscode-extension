import { env, nextTick } from "process";
import * as vscode from "vscode";
import { exec } from "node:child_process";
import { join } from "path";
import { existsSync, rmSync } from "node:fs";
import { getWorkspaceStates, runtime, states } from "../states";
import { waitingGenerated } from "../utils/waiting-generated";
import { buildCookbook } from "../utils/build-cookbook";

const validator = (file: vscode.Uri, workspace: vscode.WorkspaceFolder) => {
  // if return true, trigger generation
  if (file.fsPath === join(workspace.uri.fsPath, "index.ts")) return true;
  if (file.fsPath.startsWith(join(workspace.uri.fsPath, "src", "apps"))) return true;
  return false;
};

export const generate = async (partial: boolean, file: vscode.Uri, force?: boolean) => {
  if (runtime.notFirstGen === false) {
    partial = false;
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
  // if (partial !== true && existsSync(join(workspace.uri.fsPath, "generate"))) {
  //   rmSync(join(workspace.uri.fsPath, "generate", "products"), { recursive: true, force: true });
  //   rmSync(join(workspace.uri.fsPath, "generate", "raw"), { recursive: true, force: true });
  // }
  const path = file.fsPath.slice(join(workspace.uri.fsPath, "src", "apps").length + 1);
  output.clear();

  workspaceStates.publish(
    "generatingPromise",
    new Promise((resolve) => {
      output.append("\nMilkio generate start..");
      const command = `bun run ./node_modules/milkio/scripts/generate${partial ? "-partial" : ""}.ts ${path}`;
      output.append("\ncommand: " + command);
      output.append("\ncwd: " + workspace.uri.fsPath);
      output.append("\n\n");
      exec(
        command,
        {
          cwd: workspace.uri.fsPath,
          env: { ...env, GENERATE_PARTIAL_PATH: path },
        },
        (error, stdout) => {
          output.append(stdout);
          if (error) {
            output.append(error.message);
            if (error.stack) output.append(error.stack);
            output.show();
          }
          output.append("\nMilkio generate started.");
          resolve(undefined);
        }
      );
    })
  );

  await workspaceStates.pull("generatingPromise");
  workspaceStates.publish("generating", false);

  // Asynchronously build cookbook after generation is completed.
  void buildCookbook(workspace, output, workspaceStates);

  // Clean up temporary directory
  (async () => {
    rmSync(join(workspace.uri.fsPath, "generate", "raw-tmp"), { recursive: true, force: true });
    rmSync(join(workspace.uri.fsPath, "generate", "products-tmp"), { recursive: true, force: true });
  })();
};

export const useAutoGenerate = (context: vscode.ExtensionContext) => {
  const autoGenerateWatcher = vscode.workspace.createFileSystemWatcher("**/*.ts", false, false, false);

  const toGenerate = async (workspace: vscode.WorkspaceFolder | null) => {
    if (!workspace) return;
    await generate(false, workspace.uri, true);
  };

  const disposable = vscode.commands.registerCommand("milkio.generate", async () => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;
    void toGenerate(workspace);
    await waitingGenerated(getWorkspaceStates(workspace));
  });

  autoGenerateWatcher.onDidChange(async (e) => generate(true, e));
  autoGenerateWatcher.onDidCreate(async (e) => (runtime.notFirstGen = false));
  autoGenerateWatcher.onDidDelete(async (e) => generate(false, e));

  context.subscriptions.push(disposable);
};
