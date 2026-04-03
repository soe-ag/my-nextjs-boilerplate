import * as fs from 'fs'
import * as path from 'path'
import { spinner } from '@clack/prompts'
import { UserChoices } from './prompts'
import { runCommand, writeFile, readTemplate, getInstallCommand, PackageManager } from './utils'

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
]

function buildCiWorkflow(packageManager: PackageManager, includeVitest: boolean): string {
  let setupSteps: string
  let installCmd: string
  let runPrefix: string

  switch (packageManager) {
    case 'pnpm':
      setupSteps = [
        '      - uses: pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1 # v4',
        '        with:',
        '          version: 9',
        '      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4',
        '        with:',
        '          node-version: 20',
        "          cache: 'pnpm'",
      ].join('\n')
      installCmd = 'pnpm install --frozen-lockfile'
      runPrefix = 'pnpm'
      break
    case 'bun':
      setupSteps = [
        '      - uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2',
        '        with:',
        '          bun-version: latest',
      ].join('\n')
      installCmd = 'bun install --frozen-lockfile'
      runPrefix = 'bun run'
      break
    case 'npm':
    default:
      setupSteps = [
        '      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4',
        '        with:',
        '          node-version: 20',
        "          cache: 'npm'",
      ].join('\n')
      installCmd = 'npm ci'
      runPrefix = 'npm run'
      break
  }

  const steps = [
    '      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4',
    setupSteps,
    `      - name: Install dependencies`,
    `        run: ${installCmd}`,
    `      - name: Lint`,
    `        run: ${runPrefix} lint`,
    `      - name: Type check`,
    `        run: ${runPrefix} typecheck`,
  ]

  if (includeVitest) {
    steps.push(`      - name: Test`, `        run: ${runPrefix} test`)
  }

  steps.push(`      - name: Build`, `        run: ${runPrefix} build`)

  const stepsStr = steps.join('\n')

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
${stepsStr}
`
}

export async function scaffold(choices: UserChoices): Promise<void> {
  const { projectName, packageManager, shadcnBaseColor, includeConvex, includeVitest, includeRhfZod } = choices
  const cwd = process.cwd()
  const projectDir = path.join(cwd, projectName)

  // ─── Pre-flight check ────────────────────────────────────────────────────
  if (fs.existsSync(projectDir)) {
    console.error(
      `\nError: The directory "${projectName}" already exists in ${cwd}.\nPlease choose a different project name or remove/rename the existing directory.\n`
    )
    process.exit(1)
  }

  // ─── Step 1: Run create-next-app ─────────────────────────────────────────
  const s = spinner()
  s.start('Running create-next-app…')
  runCommand(
    `npx create-next-app@latest ${projectName} --typescript --tailwind --eslint --app --no-src-dir --no-import-alias --turbopack`
  )
  s.stop('create-next-app complete ✓')

  // ─── Step 2: Install additional dependencies ──────────────────────────────
  // create-next-app already installs next, react, react-dom, typescript, @types/*, eslint, eslint-config-next
  s.start('Installing core dependencies…')

  const deps = [
    'next-themes',
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
  ]

  const devDeps = [
    'tailwindcss@^4',
    '@tailwindcss/postcss@^4',
    'tw-animate-css',
    'prettier',
    'shadcn@latest',
  ]

  runCommand(getInstallCommand(packageManager, deps), projectDir)
  runCommand(getInstallCommand(packageManager, devDeps, true), projectDir)
  s.stop('Core dependencies installed ✓')

  // ─── Step 3: Write non-shadcn config files ────────────────────────────────
  s.start('Writing config files…')

  writeFile(
    path.join(projectDir, 'postcss.config.mjs'),
    readTemplate('postcss.config.mjs.template')
  )

  writeFile(
    path.join(projectDir, 'prettier.config.js'),
    readTemplate('prettier.config.js.template')
  )

  s.stop('Config files written ✓')

  // ─── Step 4: shadcn init ──────────────────────────────────────────────────
  s.start('Initialising shadcn/ui…')
  runCommand('npx shadcn@latest init --yes', projectDir)
  s.stop('shadcn/ui initialised ✓')

  // ─── Step 5: Update components.json with chosen settings ──────────────────
  // Read what shadcn init generated and update only the fields we need
  const componentsJsonPath = path.join(projectDir, 'components.json')
  try {
    const existing = JSON.parse(fs.readFileSync(componentsJsonPath, 'utf8'))
    existing.style = 'new-york'
    existing.rsc = true
    existing.tsx = true
    existing.iconLibrary = 'lucide'
    if (existing.tailwind) {
      existing.tailwind.baseColor = shadcnBaseColor
      existing.tailwind.cssVariables = true
    }
    existing.aliases = {
      components: '@/components',
      utils: '@/lib/utils',
      ui: '@/components/ui',
      lib: '@/lib',
      hooks: '@/hooks',
    }
    writeFile(componentsJsonPath, JSON.stringify(existing, null, 2) + '\n')
  } catch {
    // Fallback: write from template if reading/parsing fails
    const componentsJson = readTemplate('components.json.template').replace(
      '{{BASE_COLOR}}',
      shadcnBaseColor
    )
    writeFile(componentsJsonPath, componentsJson)
  }

  // ─── Step 5b: Write lib/utils.ts after shadcn init (may overwrite shadcn's) ─
  writeFile(path.join(projectDir, 'lib', 'utils.ts'), readTemplate('lib/utils.ts.template'))

  // ─── Step 6: Add shadcn components ───────────────────────────────────────
  s.start(`Adding ${SHADCN_COMPONENTS.length} shadcn/ui components…`)
  runCommand(
    `npx shadcn@latest add ${SHADCN_COMPONENTS.join(' ')} --yes`,
    projectDir
  )
  s.stop(`${SHADCN_COMPONENTS.length} shadcn/ui components added ✓`)

  // ─── Step 7: Convex setup ─────────────────────────────────────────────────
  const vitestScripts = includeVitest ? { test: 'vitest run', 'test:watch': 'vitest' } : {}
  if (includeConvex) {
    s.start('Setting up Convex…')

    runCommand(getInstallCommand(packageManager, ['convex']), projectDir)
    runCommand(getInstallCommand(packageManager, ['npm-run-all2'], true), projectDir)

    // convex/schema.ts
    const convexDir = path.join(projectDir, 'convex')
    fs.mkdirSync(convexDir, { recursive: true })
    writeFile(path.join(convexDir, 'schema.ts'), readTemplate('convex/schema.ts.template'))
    writeFile(path.join(convexDir, 'tsconfig.json'), readTemplate('convex/tsconfig.json.template'))

    // Update package.json scripts — merge to preserve any scripts added by create-next-app
    const pkgJsonPath = path.join(projectDir, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    pkgJson.scripts = {
      ...pkgJson.scripts,
      dev: 'npm-run-all --parallel dev:frontend dev:backend',
      'dev:frontend': 'next dev',
      'dev:backend': 'convex dev',
      predev: 'convex dev --until-success',
      build: 'next build',
      start: 'next start',
      lint: 'eslint .',
      typecheck: 'tsc --noEmit',
      ...vitestScripts,
    }
    writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n')

    s.stop('Convex setup complete ✓')
  } else {
    // Update package.json scripts — merge to preserve any scripts added by create-next-app
    const pkgJsonPath = path.join(projectDir, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    pkgJson.scripts = {
      ...pkgJson.scripts,
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'eslint .',
      typecheck: 'tsc --noEmit',
      ...vitestScripts,
    }
    writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n')
  }

  // ─── Step 8: React Hook Form + Zod setup ─────────────────────────────────
  if (includeRhfZod) {
    s.start('Installing React Hook Form + Zod…')
    runCommand(
      getInstallCommand(packageManager, ['react-hook-form', '@hookform/resolvers', 'zod']),
      projectDir
    )
    s.stop('React Hook Form + Zod installed ✓')
  }

  // ─── Step 9: Vitest setup ─────────────────────────────────────────────────
  if (includeVitest) {
    s.start('Setting up Vitest…')
    runCommand(
      getInstallCommand(
        packageManager,
        ['vitest', '@vitejs/plugin-react', '@testing-library/react', '@testing-library/jest-dom', 'jsdom'],
        true
      ),
      projectDir
    )
    writeFile(path.join(projectDir, 'vitest.config.ts'), readTemplate('vitest.config.ts.template'))
    writeFile(path.join(projectDir, 'vitest.setup.ts'), readTemplate('vitest.setup.ts.template'))
    s.stop('Vitest setup complete ✓')
  }

  // ─── Step 10: GitHub Actions CI workflow ──────────────────────────────────
  s.start('Writing GitHub Actions CI workflow…')
  writeFile(
    path.join(projectDir, '.github', 'workflows', 'ci.yml'),
    buildCiWorkflow(packageManager, includeVitest)
  )
  s.stop('GitHub Actions CI workflow written ✓')
}

export function printSummary(choices: UserChoices): void {
  const { projectName, packageManager, shadcnBaseColor, includeConvex, includeVitest, includeRhfZod } = choices

  const devCmd =
    packageManager === 'npm' ? 'npm run dev' : packageManager === 'pnpm' ? 'pnpm dev' : 'bun dev'

  const ciSteps = ['lint', 'typecheck', ...(includeVitest ? ['test'] : []), 'build'].join(', ')
  const convexRow = includeConvex ? '\n  ├─ Convex (real-time backend) ✅' : ''
  const vitestRow = includeVitest ? '\n  ├─ Vitest (unit testing) ✅' : ''
  const rhfZodRow = includeRhfZod ? '\n  └─ React Hook Form + Zod (forms) ✅' : ''

  console.log(`
✅ create-ncs-app — Project ready!

  📁 ${projectName}/
  ├─ Next.js (App Router) + TypeScript + Tailwind v4
  ├─ shadcn/ui (new-york, ${shadcnBaseColor}) — ${SHADCN_COMPONENTS.length} components added
  ├─ next-themes (dark mode ready)
  ├─ lucide-react (icons)
  ├─ GitHub Actions CI (${ciSteps}) ✅${convexRow}${vitestRow}${rhfZodRow}

  To get started:
    cd ${projectName}
    ${devCmd}
${
  includeConvex
    ? `
  Convex note:
    Run 'npx convex dev' to link to your Convex deployment.
    Get a free account at https://convex.dev
`
    : ''
}`)
}
