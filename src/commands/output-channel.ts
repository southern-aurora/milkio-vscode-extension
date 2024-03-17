import * as vscode from "vscode";
import { states } from "../states";

export const registerOutputChannel = (context: vscode.ExtensionContext) => {
  const output = states.pull("output") as vscode.OutputChannel;
  const disposable = vscode.commands.registerCommand("milkio.show-output-channel", () => {
    // output.show();
  });

  context.subscriptions.push(disposable);
};
