export type PackageManager = 'npm' | 'pnpm' | 'bun';
/**
 * Run a shell command synchronously, streaming output to the terminal.
 * Throws if the command exits with a non-zero code.
 */
export declare function runCommand(command: string, cwd?: string): void;
/**
 * Write content to a file, creating parent directories as needed.
 */
export declare function writeFile(filePath: string, content: string): void;
/**
 * Read a template file from the templates directory.
 */
export declare function readTemplate(templateRelPath: string): string;
/**
 * Build the install command for the given package manager.
 */
export declare function getInstallCommand(pm: PackageManager, packages: string[], dev?: boolean): string;
//# sourceMappingURL=utils.d.ts.map