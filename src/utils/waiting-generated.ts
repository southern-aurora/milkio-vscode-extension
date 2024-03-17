import * as vscode from "vscode";
import { getWorkspaceStates } from "../states";

export const waitingGenerated = async (workspaceStates: ReturnType<typeof getWorkspaceStates>) => {
  if (workspaceStates!.pull("generating")) {
    vscode.window.withProgress(
      {
        title: "Milkio Generating..",
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      (progress, token) => {
        return new Promise(async (resolve) => {
          await workspaceStates!.pull("generatingPromise");
          resolve(undefined);
        });
      }
    );
  }
};
