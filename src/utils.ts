import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import {
  getPackageManagerPolicy,
  PackageManager,
} from "./package-manager";

export { PackageManager } from "./package-manager";

/** Build the package-manager-specific command for one-off package execution. */
export function getDlxCommand(pm: PackageManager): string {
  return getPackageManagerPolicy(pm).dlxCommand;
}

/** Run a shell command synchronously, streaming output to the terminal. */
export function runCommand(command: string, cwd?: string): void {
  try {
    execSync(command, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    });
  } catch (error) {
    const err = error as Error & { stderr?: Buffer };
    throw new Error(
      `Command failed: ${command}\n${err.stderr?.toString() ?? ""}`,
    );
  }
}

/** Ensure the selected package manager exists before long scaffold steps. */
export function assertPackageManagerAvailable(pm: PackageManager): void {
  const policy = getPackageManagerPolicy(pm);

  try {
    execSync(`${policy.name} --version`, {
      stdio: "ignore",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    });
  } catch {
    throw new Error(
      [
        `Selected package manager \"${policy.name}\" is not installed or not available in PATH.`,
        `Install it first: ${policy.installHelpUrl}`,
      ].join("\n"),
    );
  }
}

/** Write content to a file, creating parent directories as needed. */
export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, "utf8");
}

/** Read a template file from the templates directory. */
export function readTemplate(templateRelPath: string): string {
  const templatePath = path.join(__dirname, "..", "templates", templateRelPath);
  return fs.readFileSync(templatePath, "utf8");
}

/** Build the install command for the selected package manager. */
export function getInstallCommand(
  pm: PackageManager,
  packages: string[],
  dev = false,
): string {
  return getPackageManagerPolicy(pm).installCommand(packages, dev);
}

/** Build the create-next-app command using the selected package manager. */
export function getCreateNextAppCommand(
  pm: PackageManager,
  projectName: string,
): string {
  const policy = getPackageManagerPolicy(pm);

  return [
    `${policy.dlxCommand} create-next-app@latest ${projectName}`,
    "--typescript",
    "--tailwind",
    "--eslint",
    "--app",
    "--no-src-dir",
    "--no-import-alias",
    "--turbopack",
    policy.createNextAppFlag,
    "--yes",
  ].join(" ");
}