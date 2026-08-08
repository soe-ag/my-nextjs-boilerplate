import * as fs from 'fs';
import * as path from 'path';
import { spinner } from '@clack/prompts';
import { UserChoices } from './prompts';
import {
  assertPackageManagerAvailable,
  runCommand,
  writeFile,
  readTemplate,
  getInstallCommand,
  getCreateNextAppCommand,
} from './utils';
import { getPackageManagerPolicy, PackageManagerPolicy } from './package-manager';

let activeSpinner: ReturnType<typeof spinner> | undefined;

const SHADCN_COMPONENTS = [
  'button',
  'card',
  'dialog',
  'input',
  'label',
  'select',
  'dropdown-menu',
  'sonner',
  'chart',
  'form',
  'separator',
  'badge',
  'avatar',
  'skeleton',
  'tabs',
];

function buildCiWorkflow(policy: PackageManagerPolicy, includeVitest: boolean): string {
  const steps = [
    '      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1',
    policy.ciSetupSteps,
    '      - name: Install dependencies',
    `        run: ${policy.ciInstallCommand}`,
    '      - name: Lint',
    `        run: ${policy.ciRunPrefix} lint`,
    '      - name: Type check',
    `        run: ${policy.ciRunPrefix} typecheck`,
  ];

  if (includeVitest) {
    steps.push('      - name: Test', `        run: ${policy.ciRunPrefix} test`);
  }

  steps.push('      - name: Build', `        run: ${policy.ciRunPrefix} build`);

  return `name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
${steps.join('\n')}
`;
}
export interface ScaffoldPlan {
  readonly choices: UserChoices;
  readonly cwd: string;
  readonly projectDir: string;
  readonly packageManagerPolicy: PackageManagerPolicy;
  readonly dependencies: string[];
  readonly devDependencies: string[];
  readonly projectScripts: Record<string, string>;
}

/**
 * Compose all decisions that affect the generated project before any side effects occur.
 * The returned plan is the scaffold workflow's main test surface.
 */
export function createScaffoldPlan(choices: UserChoices, cwd = process.cwd()): ScaffoldPlan {
  const dependencies = [
    'next-themes',
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
  ];
  const devDependencies = [
    'tailwindcss@^4',
    '@tailwindcss/postcss@^4',
    'tw-animate-css',
    'prettier',
  ];

  if (choices.includeConvex) {
    dependencies.push('convex');
    devDependencies.push('npm-run-all2');
  }

  if (choices.includeRhfZod) {
    dependencies.push('react-hook-form', '@hookform/resolvers', 'zod');
  }

  if (choices.includeVitest) {
    devDependencies.push(
      'vitest',
      '@vitejs/plugin-react',
      '@testing-library/react',
      '@testing-library/jest-dom',
      'jsdom',
    );
  }

  const vitestScripts: Record<string, string> = choices.includeVitest
    ? { test: 'vitest run', 'test:watch': 'vitest' }
    : {};
  const projectScripts: Record<string, string> = {
    ...(choices.includeConvex
      ? {
          dev: 'npm-run-all --parallel dev:frontend dev:backend',
          'dev:frontend': 'next dev',
          'dev:backend': 'convex dev',
          predev: 'convex dev --until-success',
          build: 'next build',
          start: 'next start',
          lint: 'eslint .',
          typecheck: 'tsc --noEmit',
        }
      : {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'eslint .',
          typecheck: 'tsc --noEmit',
        }),
    ...vitestScripts,
  };
  return {
    choices,
    cwd,
    projectDir: path.join(cwd, choices.projectName),
    packageManagerPolicy: getPackageManagerPolicy(choices.packageManager),
    dependencies,
    devDependencies,
    projectScripts,
  };
}
export async function scaffold(choices: UserChoices): Promise<void> {
  const projectDir = createScaffoldPlan(choices).projectDir;
  const existedBefore = fs.existsSync(projectDir);

  try {
    await executeScaffold(choices);
  } catch (error) {
    activeSpinner?.stop('Scaffolding failed');
    activeSpinner = undefined;
    const message = error instanceof Error ? error.message : String(error);
    if (!existedBefore && fs.existsSync(projectDir)) {
      try {
        fs.rmSync(projectDir, { recursive: true, force: true });
      } catch (cleanupError) {
        const cleanupMessage =
          cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        throw new Error(
          `${message}\nThe incomplete project folder could not be removed automatically: ${cleanupMessage}`,
        );
      }
      throw new Error(
        `${message}\nThe incomplete project folder was removed. You can safely try again.`,
      );
    }
    throw error;
  }
}

async function executeScaffold(choices: UserChoices): Promise<void> {
  const plan = createScaffoldPlan(choices);
  const { projectDir, packageManagerPolicy, dependencies, devDependencies, projectScripts } = plan;
  const {
    projectName,
    packageManager,
    shadcnBaseColor,
    includeConvex,
    includeVitest,
    includeRhfZod,
  } = choices;
  const { cwd } = plan;
  const dlx = packageManagerPolicy.dlxCommand;

  // ─── Pre-flight check ────────────────────────────────────────────────────
  if (fs.existsSync(projectDir)) {
    throw new Error(
      `The directory "${projectName}" already exists in ${cwd}. Choose a different project name or remove/rename the existing directory.`,
    );
  }

  assertPackageManagerAvailable(packageManager);

  // ─── Step 1: Run create-next-app ─────────────────────────────────────────
  const s = spinner();
  activeSpinner = s;
  s.start('Running create-next-app…');
  runCommand(getCreateNextAppCommand(packageManager, projectName));
  s.stop('create-next-app complete ✓');

  // ─── Step 2: Install additional dependencies ──────────────────────────────
  // create-next-app already installs next, react, react-dom, typescript, @types/*, eslint, eslint-config-next
  s.start('Installing dependencies…');

  runCommand(getInstallCommand(packageManager, dependencies), projectDir);
  runCommand(getInstallCommand(packageManager, devDependencies, true), projectDir);
  s.stop('Dependencies installed ✓');

  // ─── Step 3: Write non-shadcn config files ────────────────────────────────
  s.start('Writing config files…');

  writeFile(
    path.join(projectDir, 'postcss.config.mjs'),
    readTemplate('postcss.config.mjs.template'),
  );

  writeFile(
    path.join(projectDir, 'prettier.config.js'),
    readTemplate('prettier.config.js.template'),
  );

  s.stop('Config files written ✓');

  // ─── Step 4: shadcn init ──────────────────────────────────────────────────
  // NOTE: shadcn's CLI does not expose a --base-color flag for `init`.
  // The --yes flag uses zinc as the default base color for the CSS variables
  // written to globals.css.  The user's chosen base color is patched into
  // components.json below so that any future `shadcn add` commands respect it.
  s.start('Initialising shadcn/ui…');
  runCommand(`${dlx} shadcn@latest init --preset vega --base radix --yes`, projectDir);
  s.stop('shadcn/ui initialised ✓');

  // ─── Step 5: Update components.json with chosen settings ──────────────────
  // Read what shadcn init generated and update only the fields we need
  const componentsJsonPath = path.join(projectDir, 'components.json');
  try {
    const existing = JSON.parse(fs.readFileSync(componentsJsonPath, 'utf8'));
    existing.style = 'new-york';
    existing.rsc = true;
    existing.tsx = true;
    existing.iconLibrary = 'lucide';
    if (existing.tailwind) {
      existing.tailwind.baseColor = shadcnBaseColor;
      existing.tailwind.cssVariables = true;
    }
    existing.aliases = {
      components: '@/components',
      utils: '@/lib/utils',
      ui: '@/components/ui',
      lib: '@/lib',
      hooks: '@/hooks',
    };
    writeFile(componentsJsonPath, JSON.stringify(existing, null, 2) + '\n');
  } catch {
    // Fallback: write from template if reading/parsing fails
    const componentsJson = readTemplate('components.json.template').replace(
      '{{BASE_COLOR}}',
      shadcnBaseColor,
    );
    writeFile(componentsJsonPath, componentsJson);
  }

  // ─── Step 5b: Write lib/utils.ts after shadcn init (may overwrite shadcn's) ─
  writeFile(path.join(projectDir, 'lib', 'utils.ts'), readTemplate('lib/utils.ts.template'));

  // ─── Step 6: Add shadcn components ───────────────────────────────────────
  s.start(`Adding ${SHADCN_COMPONENTS.length} shadcn/ui components…`);
  runCommand(`${dlx} shadcn@latest add ${SHADCN_COMPONENTS.join(' ')} --yes`, projectDir);
  s.stop(`${SHADCN_COMPONENTS.length} shadcn/ui components added ✓`);

  // ─── Step 7: Convex setup ─────────────────────────────────────────────────
  if (includeConvex) {
    s.start('Setting up Convex…');

    // Keep Convex's "predev" lifecycle hook enabled for pnpm projects.
    if (packageManagerPolicy.lifecycleConfig) {
      const config = packageManagerPolicy.lifecycleConfig;
      const configPath = path.join(projectDir, config.fileName);
      const existing = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
      if (!existing.includes(config.content.trim())) {
        writeFile(configPath, existing + config.content);
      }
    }

    // convex/schema.ts
    const convexDir = path.join(projectDir, 'convex');
    fs.mkdirSync(convexDir, { recursive: true });
    writeFile(path.join(convexDir, 'schema.ts'), readTemplate('convex/schema.ts.template'));
    writeFile(path.join(convexDir, 'tsconfig.json'), readTemplate('convex/tsconfig.json.template'));

    s.stop('Convex setup complete ✓');
  }

  const pkgJsonPath = path.join(projectDir, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  pkgJson.scripts = { ...pkgJson.scripts, ...projectScripts };
  writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
  // ─── Step 8: React Hook Form + Zod setup ─────────────────────────────────
  if (includeRhfZod) {
    s.start('Configuring React Hook Form + Zod…');
    s.stop('React Hook Form + Zod ready ✓');
  }

  // ─── Step 9: Vitest setup ─────────────────────────────────────────────────
  if (includeVitest) {
    s.start('Setting up Vitest…');
    writeFile(
      path.join(projectDir, 'vitest.config.mts'),
      readTemplate('vitest.config.mts.template'),
    );
    writeFile(path.join(projectDir, 'vitest.setup.ts'), readTemplate('vitest.setup.ts.template'));
    s.stop('Vitest setup complete ✓');
  }

  // ─── Step 10: GitHub Actions CI workflow ──────────────────────────────────
  s.start('Writing GitHub Actions CI workflow…');
  writeFile(
    path.join(projectDir, '.github', 'workflows', 'ci.yml'),
    buildCiWorkflow(packageManagerPolicy, includeVitest),
  );
  s.stop('GitHub Actions CI workflow written ✓');
  activeSpinner = undefined;
}

export function printSummary(choices: UserChoices): void {
  const { projectName, shadcnBaseColor, includeConvex, includeVitest, includeRhfZod } = choices;
  const packageManagerPolicy = getPackageManagerPolicy(choices.packageManager);
  const devCmd = packageManagerPolicy.devCommand;
  const convexLinkCmd = packageManagerPolicy.convexLinkCommand;
  const ciSteps = ['lint', 'typecheck', ...(includeVitest ? ['test'] : []), 'build'].join(', ');

  // Build optional rows; tag the very last one with └─, all others with ├─
  const optionalRows: string[] = [];
  if (includeConvex) optionalRows.push('Convex (real-time backend) ✅');
  if (includeVitest) optionalRows.push('Vitest (unit testing) ✅');
  if (includeRhfZod) optionalRows.push('React Hook Form + Zod (forms) ✅');

  const optionalBlock = optionalRows
    .map((row, i) => {
      const prefix = i === optionalRows.length - 1 ? '└─' : '├─';
      return `\n  ${prefix} ${row}`;
    })
    .join('');

  // If there are no optional rows, the CI line is the last entry
  const ciPrefix = optionalRows.length > 0 ? '├─' : '└─';

  console.log(`
✅ create-ncs-app — Project ready!

  📁 ${projectName}/
  ├─ Next.js (App Router) + TypeScript + Tailwind v4
  ├─ shadcn/ui (new-york, ${shadcnBaseColor}) — ${SHADCN_COMPONENTS.length} components added
  ├─ next-themes (dark mode ready)
  ├─ lucide-react (icons)
  ${ciPrefix} GitHub Actions CI (${ciSteps}) ✅${optionalBlock}

  To get started:
    cd ${projectName}
    ${devCmd}
${
  includeConvex
    ? `
  Convex note:
    Run '${convexLinkCmd}' to link to your Convex deployment.
    Get a free account at https://convex.dev
`
    : ''
}`);
}
