export type PackageManager = "npm" | "pnpm" | "bun";
/**
 * Build the package-manager-specific command for one-off package execution.
 */
export declare function getDlxCommand(pm: PackageManager): string;
/**
 * Run a shell command synchronously, streaming output to the terminal.
 * Throws if the command exits with a non-zero code.
 */
export declare function runCommand(command: string, cwd?: string): void;
/**
 * Ensure the selected package manager exists before running long scaffold steps.
 */
export declare function assertPackageManagerAvailable(pm: PackageManager): void;
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
/**
 * Build the create-next-app command using the user's selected package manager.
 */
export declare function getCreateNextAppCommand(pm: PackageManager, projectName: string): string;
//# sourceMappingURL=utils.d.ts.map