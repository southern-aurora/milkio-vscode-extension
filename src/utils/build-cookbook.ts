import { env } from "process";
import * as vscode from "vscode";
import { states } from "../states";
import { exec } from "node:child_process";

export const buildCookbook = (workspace: vscode.WorkspaceFolder, output: vscode.OutputChannel, workspaceStates: any) => {
  workspaceStates.publish("cookbookBuilding", true);
  const r = new Promise((resolve) => {
    /**
     * After the construction is completed, there may be subsequent operations. During this period, the CPU may be busy. Add a short delay to allow the Cookbook to continue building afterwards.
     */
    setTimeout(() => {
      output.append("\nMilkio build:cookbook start..");
      const command = `bun run ./node_modules/milkio/scripts/build-cookbook.ts`;
      exec(
        command,
        {
          cwd: workspace.uri.fsPath,
          env: { ...env },
        },
        (error, stdout) => {
          output.append(stdout);
          if (error) {
            output.append(error.message);
            if (error.stack) output.append(error.stack);
            // output.show();
          }
          workspaceStates.publish("cookbookBuilding", false);
          output.append("\nMilkio build:cookbook started.");
          resolve(undefined);
        }
      );
    }, 768);
  });
  workspaceStates.publish("cookbookBuildingPromise", r);
  return r;
};
