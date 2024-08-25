import * as vscode from "vscode";

/**
 * Callback used to generate the actual command to be executed to launch the gdb-dap binary.
 *
 * @param session - The information of the debug session to be launched.
 *
 * @param packageJSONExecutable - An optional {@link vscode.DebugAdapterExecutable executable} for
 * gdb-dap if specified in the package.json file.
 */
export type GDBDapCreateDAPExecutableCommand = (
  session: vscode.DebugSession,
  packageJSONExecutable: vscode.DebugAdapterExecutable | undefined,
) => Promise<vscode.DebugAdapterExecutable | undefined>;

/**
 * The options that this extension accepts.
 */
export interface GDBDapOptions {
  createDapExecutableCommand: GDBDapCreateDAPExecutableCommand;
  // The name of the debugger type as specified in the package.json file.
  debuggerType: string;
}
