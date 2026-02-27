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

export async function scaffold(choices: UserChoices): Promise<void> {
  const { projectName, packageManager, shadcnBaseColor, includeConvex, includeRhfZod } = choices
  const cwd = process.cwd()
  const projectDir = path.join(cwd, projectName)

  // ─── Step 1: Run create-next-app ─────────────────────────────────────────
  const s = spinner()
  s.start('Running create-next-app…')
  runCommand(
    `npx create-next-app@latest ${projectName} --typescript --tailwind --eslint --app --no-src-dir --no-import-alias --turbopack`
  )
  s.stop('create-next-app complete ✓')

  // ─── Step 2: Install mandatory dependencies ───────────────────────────────
  s.start('Installing core dependencies…')

  const deps = [
    'next@latest',
    'react@latest',
    'react-dom@latest',
    'next-themes',
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
  ]

  const devDeps = [
    'typescript',
    '@types/node',
    '@types/react',
    '@types/react-dom',
    'tailwindcss@^4',
    '@tailwindcss/postcss@^4',
    'tw-animate-css',
    'eslint',
    'eslint-config-next',
    'prettier',
    'shadcn@latest',
  ]

  runCommand(getInstallCommand(packageManager, deps), projectDir)
  runCommand(getInstallCommand(packageManager, devDeps, true), projectDir)
  s.stop('Core dependencies installed ✓')

  // ─── Step 3: Write config files ───────────────────────────────────────────
  s.start('Writing config files…')

  writeFile(
    path.join(projectDir, 'postcss.config.mjs'),
    readTemplate('postcss.config.mjs.template')
  )

  writeFile(
    path.join(projectDir, 'prettier.config.js'),
    readTemplate('prettier.config.js.template')
  )

  // lib/utils.ts
  writeFile(path.join(projectDir, 'lib', 'utils.ts'), readTemplate('lib/utils.ts.template'))

  s.stop('Config files written ✓')

  // ─── Step 4: shadcn init ──────────────────────────────────────────────────
  s.start('Initialising shadcn/ui…')
  runCommand('npx shadcn@latest init --yes', projectDir)
  s.stop('shadcn/ui initialised ✓')

  // ─── Step 5: Write components.json with chosen settings ───────────────────
  const componentsJsonTemplate = readTemplate('components.json.template')
  const componentsJson = componentsJsonTemplate.replace('{{BASE_COLOR}}', shadcnBaseColor)
  writeFile(path.join(projectDir, 'components.json'), componentsJson)

  // ─── Step 6: Add shadcn components ───────────────────────────────────────
  s.start(`Adding ${SHADCN_COMPONENTS.length} shadcn/ui components…`)
  runCommand(
    `npx shadcn@latest add ${SHADCN_COMPONENTS.join(' ')} --yes`,
    projectDir
  )
  s.stop(`${SHADCN_COMPONENTS.length} shadcn/ui components added ✓`)

  // ─── Step 7: Convex setup ─────────────────────────────────────────────────
  if (includeConvex) {
    s.start('Setting up Convex…')

    runCommand(getInstallCommand(packageManager, ['convex']), projectDir)
    runCommand(getInstallCommand(packageManager, ['npm-run-all2'], true), projectDir)

    // convex/schema.ts
    const convexDir = path.join(projectDir, 'convex')
    fs.mkdirSync(convexDir, { recursive: true })
    writeFile(path.join(convexDir, 'schema.ts'), readTemplate('convex/schema.ts.template'))
    writeFile(path.join(convexDir, 'tsconfig.json'), readTemplate('convex/tsconfig.json.template'))

    // Update package.json scripts
    const pkgJsonPath = path.join(projectDir, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    pkgJson.scripts = {
      dev: 'npm-run-all --parallel dev:frontend dev:backend',
      'dev:frontend': 'next dev',
      'dev:backend': 'convex dev',
      predev: 'convex dev --until-success',
      build: 'next build',
      start: 'next start',
      lint: 'eslint .',
    }
    writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n')

    s.stop('Convex setup complete ✓')
  } else {
    // Update package.json scripts (no-convex version)
    const pkgJsonPath = path.join(projectDir, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    pkgJson.scripts = {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'eslint .',
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
}

export function printSummary(choices: UserChoices): void {
  const { projectName, packageManager, shadcnBaseColor, includeConvex, includeRhfZod } = choices

  const devCmd =
    packageManager === 'npm' ? 'npm run dev' : packageManager === 'pnpm' ? 'pnpm dev' : 'bun dev'

  console.log(`
✅ create-ncs-app — Project ready!

  📁 ${projectName}/
  ├─ Next.js (App Router) + TypeScript + Tailwind v4
  ├─ shadcn/ui (new-york, ${shadcnBaseColor}) — ${SHADCN_COMPONENTS.length} components added
  ├─ next-themes (dark mode ready)
  ├─ lucide-react (icons)${includeConvex ? '\n  ├─ Convex (real-time backend) ✅' : ''}${includeRhfZod ? '\n  └─ React Hook Form + Zod (forms) ✅' : ''}

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
