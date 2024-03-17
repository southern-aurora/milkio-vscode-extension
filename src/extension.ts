import * as vscode from "vscode";
import { useApiTest } from "./uses/api-test";
import { useAutoGenerate } from "./uses/auto-generate";
import { useGenerateDatabase } from "./commands/generate-database";
import { useStatusBar } from "./uses/status-bar";
import { useProjectWatcher } from "./uses/project-wather";
import { registerApiTest } from "./commands/api-test";
import { registerExtensionMenu } from "./commands/extension-menu";
import { registerOutputChannel } from "./commands/output-channel";
import { registerHttpServer } from "./commands/http-server";
import { registerAllApiTest } from "./commands/all-api-test";
import { checkBunInstalled } from "./utils/check-bun-installed";
import { buildDTO } from "./commands/build-dto";
import { createFromTemplate } from "./commands/create-from-template";

export async function activate(context: vscode.ExtensionContext) {
  await useProjectWatcher(context);

  if ((await checkBunInstalled()) === false) return;

  // commands
  registerApiTest(context);
  registerAllApiTest(context);
  registerExtensionMenu(context);
  registerOutputChannel(context);
  registerHttpServer(context);
  createFromTemplate(context);
  buildDTO(context);

  // uses
  await Promise.all([
    //
    useApiTest(context),
    useAutoGenerate(context),
    useGenerateDatabase(context),
    useStatusBar(context),
  ]);
}

export function deactivate() {}
