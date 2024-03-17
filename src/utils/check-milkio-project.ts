import { existsSync } from "fs";
import { join } from "path";
import * as vscode from "vscode";

export const checkMilkioProject = async (fspath: string): Promise<boolean> => {
  if (!(await existsSync(join(fspath, "package.json")))) return false;
  let packageJson: string;
  try {
    packageJson = (await vscode.workspace.fs.readFile(vscode.Uri.file(join(fspath, "package.json")))).toString();
  } catch (error) {
    return false;
  }
  return packageJson.includes(`"milkio":`);
};
