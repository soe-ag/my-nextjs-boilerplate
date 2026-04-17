import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export type PackageManager = "npm" | "pnpm" | "bun";

const PM_INSTALL_HELP: Record<PackageManager, string> = {
  npm: "https://docs.npmjs.com/downloading-and-installing-node-js-and-npm",
  pnpm: "https://pnpm.io/installation",
  bun: "https://bun.sh/docs/installation",
};

/**
 * Build the package-manager-specific command for one-off package execution.
 */
export function getDlxCommand(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return "pnpm dlx";
    case "bun":
      return "bunx";
    case "npm":
    default:
      return "npx";
  }
}

/**
 * Run a shell command synchronously, streaming output to the terminal.
 * Throws if the command exits with a non-zero code.
 */
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

/**
 * Ensure the selected package manager exists before running long scaffold steps.
 */
export function assertPackageManagerAvailable(pm: PackageManager): void {
  const binary = pm === "bun" ? "bun" : pm;

  try {
    execSync(`${binary} --version`, {
      stdio: "ignore",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    });
  } catch {
    throw new Error(
      [
        `Selected package manager \"${pm}\" is not installed or not available in PATH.`,
        `Install it first: ${PM_INSTALL_HELP[pm]}`,
      ].join("\n"),
    );
  }
}

/**
 * Write content to a file, creating parent directories as needed.
 */
export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Read a template file from the templates directory.
 */
export function readTemplate(templateRelPath: string): string {
  const templatePath = path.join(__dirname, "..", "templates", templateRelPath);
  return fs.readFileSync(templatePath, "utf8");
}

/**
 * Build the install command for the given package manager.
 */
export function getInstallCommand(
  pm: PackageManager,
  packages: string[],
  dev = false,
): string {
  const pkgList = packages.join(" ");
  switch (pm) {
    case "pnpm":
      return `pnpm add ${dev ? "-D " : ""}${pkgList}`;
    case "bun":
      return `bun add ${dev ? "-d " : ""}${pkgList}`;
    case "npm":
    default:
      return `npm install ${dev ? "--save-dev " : ""}${pkgList}`;
  }
}

/**
 * Build the create-next-app command using the user's selected package manager.
 */
export function getCreateNextAppCommand(
  pm: PackageManager,
  projectName: string,
): string {
  const dlx = getDlxCommand(pm);
  const useFlag =
    pm === "npm" ? "--use-npm" : pm === "pnpm" ? "--use-pnpm" : "--use-bun";

  return [
    `${dlx} create-next-app@latest ${projectName}`,
    "--typescript",
    "--tailwind",
    "--eslint",
    "--app",
    "--no-src-dir",
    "--no-import-alias",
    "--turbopack",
    useFlag,
    "--yes",
  ].join(" ");
}
