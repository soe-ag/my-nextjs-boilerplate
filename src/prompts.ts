import { intro, outro, text, select, confirm, cancel, isCancel, note } from '@clack/prompts'
import { PackageManager } from './utils'

export interface UserChoices {
  projectName: string
  packageManager: PackageManager
  shadcnBaseColor: string
  includeConvex: boolean
  includeRhfZod: boolean
}

export async function runPrompts(projectNameArg?: string): Promise<UserChoices> {
  intro('🚀 create-ncs-app — Next.js + Convex + Shadcn scaffolder')

  // 1. Project name
  note('This will be the folder name and the name field in package.json.')
  const projectNameResult = await text({
    message: 'What is your project name?',
    placeholder: 'my-app',
    initialValue: projectNameArg ?? 'my-app',
    validate(value) {
      if (!value || value.trim().length === 0) return 'Project name is required'
      if (!/^[a-z0-9][a-z0-9_-]*$/i.test(value.trim())) {
        return 'Project name must start with a letter or number and can only contain letters, numbers, hyphens, and underscores'
      }
    },
  })

  if (isCancel(projectNameResult)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const projectName = (projectNameResult as string).trim()

  // 2. Package manager
  note('Choose how dependencies will be installed.\nnpm is default, pnpm is faster with a shared cache, bun is the fastest and most modern.')
  const pmResult = await select<PackageManager>({
    message: 'Which package manager do you want to use?',
    options: [
      { value: 'npm' as PackageManager, label: 'npm', hint: 'default Node.js package manager' },
      { value: 'pnpm' as PackageManager, label: 'pnpm', hint: 'faster with a shared cache' },
      { value: 'bun' as PackageManager, label: 'bun', hint: 'fastest and most modern' },
    ],
  })

  if (isCancel(pmResult)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const packageManager = pmResult as PackageManager

  // 3. shadcn base color
  note('This sets the gray-scale palette used across all shadcn components.\nslate = cool blue-gray, zinc = clean neutral, gray = standard gray, neutral = warm minimal, stone = warm brownish-gray.')
  const colorResult = await select<string>({
    message: 'Which base color would you like to use for shadcn/ui?',
    options: [
      { value: 'slate', label: 'slate', hint: 'cool blue-gray' },
      { value: 'zinc', label: 'zinc', hint: 'clean neutral' },
      { value: 'gray', label: 'gray', hint: 'standard gray' },
      { value: 'neutral', label: 'neutral', hint: 'warm minimal' },
      { value: 'stone', label: 'stone', hint: 'warm brownish-gray' },
    ],
  })

  if (isCancel(colorResult)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const shadcnBaseColor = colorResult as string

  // 4. Include Convex?
  note('Convex is a real-time backend-as-a-service with a built-in database, server functions, and live queries.\nAdds convex package, sets up convex/ folder with a starter schema.ts, and adds dev:backend and predev npm scripts.\nRequires a free Convex account at convex.dev.')
  const convexResult = await confirm({
    message: 'Include Convex (real-time backend + database)?',
    initialValue: false,
  })

  if (isCancel(convexResult)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const includeConvex = convexResult as boolean

  // 5. Include React Hook Form + Zod?
  note('react-hook-form handles form state and submission with minimal re-renders.\nzod provides TypeScript-first schema validation.\n@hookform/resolvers connects them together.\nRecommended if your app has any forms.')
  const rhfResult = await confirm({
    message: 'Include React Hook Form + Zod (form handling + validation)?',
    initialValue: false,
  })

  if (isCancel(rhfResult)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const includeRhfZod = rhfResult as boolean

  return {
    projectName,
    packageManager,
    shadcnBaseColor,
    includeConvex,
    includeRhfZod,
  }
}

