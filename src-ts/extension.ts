import * as vscode from "vscode";

import {
  GDBDapDescriptorFactory,
  isExecutable,
} from "./debug-adapter-factory";
import { DisposableContext } from "./disposable-context";

/**
 * This class represents the extension and manages its life cycle. Other extensions
 * using it as as library should use this class as the main entry point.
 */
export class GDBDapExtension extends DisposableContext {
  constructor() {
    super();
    const factory = new GDBDapDescriptorFactory();
    this.pushSubscription(factory);
    this.pushSubscription(
      vscode.debug.registerDebugAdapterDescriptorFactory(
        "gdb-dap",
        factory,
      ),
    );
    this.pushSubscription(
      vscode.workspace.onDidChangeConfiguration(async (event) => {
        if (event.affectsConfiguration("gdb-dap.executable-path")) {
          const dapPath = vscode.workspace
            .getConfiguration("gdb-dap")
            .get<string>("executable-path");

          if (dapPath) {
            if (await isExecutable(dapPath)) {
              return;
            }
          }
          GDBDapDescriptorFactory.showGDBDapNotFoundMessage(dapPath || "");
        }
      }),
    );
  }
}

/**
 * This is the entry point when initialized by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new GDBDapExtension());
}
