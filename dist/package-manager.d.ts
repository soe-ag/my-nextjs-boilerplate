export type PackageManager = 'npm' | 'pnpm';
export interface PackageManagerPolicy {
  readonly name: PackageManager;
  readonly installHelpUrl: string;
  readonly dlxCommand: string;
  readonly createNextAppFlag: string;
  readonly ciSetupSteps: string;
  readonly ciInstallCommand: string;
  readonly ciRunPrefix: string;
  readonly devCommand: string;
  readonly convexLinkCommand: string;
  readonly lifecycleConfig?: {
    readonly fileName: string;
    readonly content: string;
  };
  installCommand(packages: string[], dev?: boolean): string;
}
/** Return the complete command policy for the selected package manager. */
export declare function getPackageManagerPolicy(
  packageManager: PackageManager,
): PackageManagerPolicy;
//# sourceMappingURL=package-manager.d.ts.map
