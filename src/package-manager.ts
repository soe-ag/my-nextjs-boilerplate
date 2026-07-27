export type PackageManager = "npm" | "pnpm";

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

const POLICIES: Record<PackageManager, PackageManagerPolicy> = {
  npm: {
    name: "npm",
    installHelpUrl:
      "https://docs.npmjs.com/downloading-and-installing-node-js-and-npm",
    dlxCommand: "npx",
    createNextAppFlag: "--use-npm",
    ciSetupSteps: [
      "      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0",
      "        with:",
      "          node-version: 20",
      "          cache: 'npm'",
    ].join("\n"),
    ciInstallCommand: "npm ci",
    ciRunPrefix: "npm run",
    devCommand: "npm run dev",
    convexLinkCommand: "npx convex dev",
    installCommand(packages, dev = false) {
      return `npm install ${dev ? "--save-dev " : ""}${packages.join(" ")}`;
    },
  },
  pnpm: {
    name: "pnpm",
    installHelpUrl: "https://pnpm.io/installation",
    dlxCommand: "pnpm dlx",
    createNextAppFlag: "--use-pnpm",
    ciSetupSteps: [
      "      - uses: pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1 # v4.3.0",
      "        with:",
      "          version: 9",
      "      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0",
      "        with:",
      "          node-version: 20",
      "          cache: 'pnpm'",
    ].join("\n"),
    ciInstallCommand: "pnpm install --frozen-lockfile",
    ciRunPrefix: "pnpm",
    devCommand: "pnpm dev",
    convexLinkCommand: "pnpm dlx convex dev",
    lifecycleConfig: {
      fileName: ".npmrc",
      content: "enable-pre-post-scripts=true\n",
    },
    installCommand(packages, dev = false) {
      return `pnpm add ${dev ? "-D " : ""}${packages.join(" ")}`;
    },
  },
};

/** Return the complete command policy for the selected package manager. */
export function getPackageManagerPolicy(
  packageManager: PackageManager,
): PackageManagerPolicy {
  return POLICIES[packageManager];
}