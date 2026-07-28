import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getPackageManagerPolicy, PackageManager } from './package-manager';

export { PackageManager } from './package-manager';

const MIN_NODE_VERSION = [20, 12, 0] as const;

function getErrorDetails(error: unknown): string {
  const err = error as Error & { stderr?: Buffer; stdout?: Buffer; code?: string | number };
  return [err.message, err.stderr?.toString(), err.stdout?.toString()].filter(Boolean).join('\n');
}

function getCommandName(command: string): string {
  return command
    .trim()
    .split(/\s+/)[0]
    .replace(/^['"]|['"]$/g, '');
}

function isMissingCommand(error: unknown): boolean {
  const err = error as Error & { code?: string | number };
  return (
    err.code === 'ENOENT' ||
    /not recognized|command not found|no such file or directory/i.test(getErrorDetails(error))
  );
}

/** Verify that the Node.js runtime satisfies the package requirement. */
export function assertNodeVersion(): void {
  const [major, minor, patch] = process.versions.node.split('.').map(Number);
  const current = [major, minor, patch];
  const supported =
    current.some((value, index) => value > MIN_NODE_VERSION[index]) ||
    current.every((value, index) => value === MIN_NODE_VERSION[index]);

  if (!supported) {
    throw new Error(
      `Node.js ${MIN_NODE_VERSION.join('.')} or newer is required. You are running Node.js ${process.versions.node}.`,
    );
  }
}

/** Build the package-manager-specific command for one-off package execution. */
export function getDlxCommand(pm: PackageManager): string {
  return getPackageManagerPolicy(pm).dlxCommand;
}

/** Run a shell command synchronously, streaming output to the terminal. */
export function runCommand(command: string, cwd?: string): void {
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });
  } catch (error) {
    const commandName = getCommandName(command);
    if (isMissingCommand(error)) {
      const installHint =
        commandName === 'npm' || commandName === 'npx'
          ? 'Install Node.js, which includes npm and npx.'
          : `Install ${commandName} and make sure it is available in your PATH.`;
      throw new Error(`Command "${commandName}" was not found. ${installHint}`);
    }

    const details = getErrorDetails(error);
    throw new Error(`Command failed: ${command}\n${details}`);
  }
}

/** Ensure the selected package manager exists before long scaffold steps. */
export function assertPackageManagerAvailable(pm: PackageManager): void {
  const policy = getPackageManagerPolicy(pm);

  try {
    execSync(`${policy.name} --version`, {
      stdio: 'ignore',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });
  } catch {
    const installHint =
      policy.name === 'npm'
        ? 'Install Node.js, which includes npm.'
        : `Install pnpm from ${policy.installHelpUrl}`;
    throw new Error(
      `Package manager "${policy.name}" was not found. ${installHint}\nMake sure it is available in your PATH and try again.`,
    );
  }
}

/** Write content to a file, creating parent directories as needed. */
export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

/** Read a template file from the templates directory. */
export function readTemplate(templateRelPath: string): string {
  const templatePath = path.join(__dirname, '..', 'templates', templateRelPath);
  return fs.readFileSync(templatePath, 'utf8');
}

/** Build the install command for the selected package manager. */
export function getInstallCommand(pm: PackageManager, packages: string[], dev = false): string {
  return getPackageManagerPolicy(pm).installCommand(packages, dev);
}

/** Build the create-next-app command using the selected package manager. */
export function getCreateNextAppCommand(pm: PackageManager, projectName: string): string {
  const policy = getPackageManagerPolicy(pm);

  return [
    `${policy.dlxCommand} create-next-app@latest ${projectName}`,
    '--typescript',
    '--tailwind',
    '--eslint',
    '--app',
    '--no-src-dir',
    '--no-import-alias',
    '--turbopack',
    policy.createNextAppFlag,
    '--yes',
  ].join(' ');
}
