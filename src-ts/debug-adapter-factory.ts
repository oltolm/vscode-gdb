import * as path from "path";
import * as util from "util";
import * as vscode from "vscode";
import * as child_process from "child_process";
import * as fs from "node:fs/promises";

const exec = util.promisify(child_process.execFile);

export async function isExecutable(path: string): Promise<Boolean> {
  try {
    await fs.access(path, fs.constants.X_OK);
  } catch {
    return false;
  }
  return true;
}

async function findWithXcrun(executable: string): Promise<string | undefined> {
  if (process.platform === "darwin") {
    try {
      let { stdout, stderr } = await exec("/usr/bin/xcrun", [
        "-find",
        executable,
      ]);
      if (stdout) {
        return stdout.toString().trimEnd();
      }
    } catch (error) { }
  }
  return undefined;
}

async function findInPath(executable: string): Promise<string | undefined> {
  const env_path =
    process.platform === "win32" ? process.env["Path"] : process.env["PATH"];
  if (!env_path) {
    return undefined;
  }

  const paths = env_path.split(path.delimiter);
  for (const p of paths) {
    const exe_path = path.join(p, executable);
    if (await isExecutable(exe_path)) {
      return exe_path;
    }
  }
  return undefined;
}

async function findDAPExecutable(): Promise<string | undefined> {
  const executable = process.platform === "win32" ? "gdb.exe" : "gdb";

  // Prefer gdb from Xcode on Darwin.
  const xcrun_dap = await findWithXcrun(executable);
  if (xcrun_dap) {
    return xcrun_dap;
  }

  // Find gdb in the user's path.
  const path_dap = await findInPath(executable);
  if (path_dap) {
    return path_dap;
  }

  return undefined;
}

async function getDAPExecutable(
  session: vscode.DebugSession,
): Promise<string | undefined> {
  // Check if the executable was provided in the launch configuration.
  const launchConfigPath = session.configuration["debugAdapterExecutable"];
  if (typeof launchConfigPath === "string" && launchConfigPath.length !== 0) {
    return launchConfigPath;
  }

  // Check if the executable was provided in the extension's configuration.
  const config = vscode.workspace.getConfiguration(
    "gdb-dap",
    session.workspaceFolder,
  );
  const configPath = config.get<string>("executable-path");
  if (configPath && configPath.length !== 0) {
    return configPath;
  }

  // Try finding the gdb-dap binary.
  const foundPath = await findDAPExecutable();
  if (foundPath) {
    return foundPath;
  }

  return undefined;
}

/**
 * This class defines a factory used to find the gdb-dap binary to use
 * depending on the session configuration.
 */
export class GDBDapDescriptorFactory
  implements vscode.DebugAdapterDescriptorFactory, vscode.Disposable {
  private server?: Promise<{ process: child_process.ChildProcess, host: string, port: number }>;

  dispose() {
    this.server?.then(({ process }) => {
      process.kill();
    });
  }

  async createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined,
  ): Promise<vscode.DebugAdapterDescriptor | undefined> {
    const config = vscode.workspace.getConfiguration(
      "gdb-dap",
      session.workspaceFolder,
    );

    const log_path = config.get<string>("log-path");
    let env: { [key: string]: string } = {};

    const log_level = config.get<number>("log-level");
    const args: string[] = ["-i", "dap"];
    if (log_path)
      args.push("-iex", `set debug dap-log-file ${log_path}`);
    if (log_level)
      args.push("-iex", `set debug dap-log-level ${log_level}`);

    const configEnvironment =
      config.get<{ [key: string]: string }>("environment") || {};
    const dapPath = (await getDAPExecutable(session)) ?? executable?.command;

    if (!dapPath) {
      GDBDapDescriptorFactory.showGDBDapNotFoundMessage();
      return undefined;
    }

    if (!(await isExecutable(dapPath))) {
      GDBDapDescriptorFactory.showGDBDapNotFoundMessage(dapPath);
      return;
    }

    const dbgOptions = {
      env: {
        ...executable?.options?.env,
        ...configEnvironment,
        ...env,
      },
    };
    if (dapPath) {
      if (!(await isExecutable(dapPath))) {
        GDBDapDescriptorFactory.showGDBDapNotFoundMessage(dapPath);
        return undefined;
      }
      return new vscode.DebugAdapterExecutable(dapPath, args, dbgOptions);
    } else if (executable) {
      if (!(await isExecutable(executable.command))) {
        GDBDapDescriptorFactory.showGDBDapNotFoundMessage(executable.command);
        return undefined;
      }
      return new vscode.DebugAdapterExecutable(
        executable.command,
        [...args, ...executable.args],
        dbgOptions,
      );
    }
    return undefined;
  }

  /**
   * Shows a message box when the debug adapter's path is not found
   */
  static async showGDBDapNotFoundMessage(path?: string) {
    const message =
      path
        ? `Debug adapter path: ${path} is not a valid file.`
        : "Unable to find the path to the GDB debug adapter executable.";
    const openSettingsAction = "Open Settings";
    const callbackValue = await vscode.window.showErrorMessage(
      message,
      openSettingsAction,
    );

    if (openSettingsAction === callbackValue) {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "gdb-dap.executable-path",
      );
    }
  }
}
