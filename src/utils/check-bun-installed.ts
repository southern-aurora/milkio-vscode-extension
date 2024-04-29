import { exec } from "child_process";
import * as vscode from "vscode";
import { states } from "../states";
import { getEnv } from "./get-env";
import { existsSync } from "fs";
import { join } from "path";

const output = states.pull("output") as vscode.OutputChannel;

export const checkBunInstalled = () => {
  return new Promise((resolve, reject) => {
    const workspace = states.pull("activeProject") as vscode.WorkspaceFolder;

    exec("bun --version", {
      env: { ...getEnv() },
    }, (error, stdout) => {
      if (!error) {
        resolve(true);
        return;
      }

      if (existsSync(join(process.env.HOME ?? process.env.USERPROFILE!, '.bun', 'bin', 'bun'))) {
        states.publish('absoluteBun', true);
        resolve(true);
        return;
      }

      output.append('Bun is not installed');

      vscode.window.showInformationMessage(
        "Bun is not installed. Although Milkio does not rely on any JavaScript runtime, it needs to use Bun in the generation phase to directly run TypeScript."
      );

      resolve(false);
    });

    // Attempt to automatically download and install dependencies in the future:

    //   const progressBar = new ProgressBar();

    //   const downloadUrl = "https://download-els.ztgame.com.cn/fullclient/elswordclient240131.rar";
    //   const downloadPath = path.join(__dirname, "node.tar.xz");

    //   const file = createWriteStream(downloadPath);
    //   const request = https.get(downloadUrl, (response) => {
    //     const totalSize = parseInt(response.headers["content-length"] || "0", 10);
    //     let downloadedSize = 0;

    //     response.on("data", (chunk) => {
    //       downloadedSize += chunk.length;
    //       const progress = Math.round((downloadedSize / totalSize) * 100);
    //       progressBar?.updateProgress(progress);
    //     });

    //     response.pipe(file);
    //     file.on("finish", () => {
    //       file.close();
    //       progressBar?.dispose();
    //       vscode.window.showInformationMessage("Download completed!");
    //     });
    //   });

    //   request.on("error", (error) => {
    //     progressBar?.dispose();
    //     vscode.window.showErrorMessage(`Download failed: ${error.message}`);
    //   });

    // class ProgressBar {
    //   private statusBarItem: vscode.StatusBarItem;

    //   constructor() {
    //     this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    //     this.statusBarItem.text = "Downloading...";
    //     this.statusBarItem.show();
    //   }

    //   updateProgress(progress: number) {
    //     this.statusBarItem.text = `Downloading... ${progress}%`;
    //   }

    //   dispose() {
    //     this.statusBarItem.dispose();
    //   }
    // }
  });
};
