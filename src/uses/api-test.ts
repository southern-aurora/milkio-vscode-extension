import { nextTick } from "process";
import * as vscode from "vscode";

export const useApiTest = (context: vscode.ExtensionContext) => {
  const filterApiTestButton = (document: vscode.TextDocument) => {
    nextTick(async () => {
      let isApiTestDocment = false;
      for (const line of document.getText().split("\n")) {
        if (!line.startsWith("export const test")) continue;
        if (!line.includes("defineApiTest(")) continue;
        isApiTestDocment = true;
        break;
      }
      if (!isApiTestDocment) {
        vscode.commands.executeCommand(`setContext`, `showIconRunApiTest`, false);
        return;
      }
      vscode.commands.executeCommand(`setContext`, `showIconRunApiTest`, true);
    });
  };
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor || editor.document.languageId !== "typescript") {
      vscode.commands.executeCommand(`setContext`, `showIconRunApiTest`, false);
      return;
    }
    filterApiTestButton(editor.document);
  });
  const apiTestWatcher = vscode.workspace.createFileSystemWatcher("**/*.ts", false, false, false);
  apiTestWatcher.onDidChange((e) => {
    if (!vscode.window.activeTextEditor?.document) return;
    if (e.fsPath !== vscode.window.activeTextEditor.document.uri.fsPath) return;
    if (vscode.window.activeTextEditor.document.languageId !== "typescript") return;
    filterApiTestButton(vscode.window.activeTextEditor.document);
  });
  nextTick(() => {
    if (vscode.window.activeTextEditor?.document === undefined) {
      vscode.commands.executeCommand(`setContext`, `showIconRunApiTest`, false);
      return;
    }
    filterApiTestButton(vscode.window.activeTextEditor.document);
  });
};
