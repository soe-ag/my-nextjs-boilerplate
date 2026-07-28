# How `create-ncs-app` Works

This document explains how the CLI scaffolder works internally — from running one command to having a fully-configured project.

---

## Overview

```
npx create-ncs-app my-app
```

This single command does the following in order:

1. Asks you six questions
2. Composes a scaffold plan from your choices
3. Runs `create-next-app` to bootstrap Next.js
4. Installs and wires up all core dependencies
5. Writes config files
6. Initialises and configures shadcn/ui
7. Optionally sets up Convex and/or React Hook Form + Zod

---

## Step-by-Step Breakdown

### Step 1 — Collect choices (`src/prompts.ts`)

The CLI uses [`@clack/prompts`](https://github.com/bombshell-dev/clack) to ask six interactive questions:

| #   | Question                         | Feeds into                        |
| --- | -------------------------------- | --------------------------------- |
| 1   | Project name                     | folder name + `package.json` name |
| 2   | Package manager (`npm` / `pnpm`) | every install command             |
| 3   | shadcn base color                | `components.json` → UI palette    |
| 4   | Include Convex?                  | optional backend setup            |
| 5   | Include Vitest?                  | optional testing setup            |
| 6   | Include React Hook Form + Zod?   | optional form setup               |

All answers are collected into a single `UserChoices` object, then converted into a `ScaffoldPlan` before the scaffold workflow runs.

---

### Step 2 — Compose the scaffold plan (`src/scaffold.ts`)

The CLI turns the collected choices into a `ScaffoldPlan` before running any external commands. The plan contains the project directory, selected package-manager policy, runtime dependencies, dev dependencies, and the final package scripts. This gives the workflow one place to test what the generated project should contain.

### Step 3 — Bootstrap Next.js (`src/scaffold.ts`)

The CLI asks `src/package-manager.ts` for the selected package-manager policy, then runs `create-next-app` with that policy (`npx` / `pnpm dlx`) and passes `--use-npm` / `--use-pnpm` accordingly.

This gives you a clean Next.js project with:

- App Router
- TypeScript
- ESLint
- Tailwind CSS (base install)

Everything else is layered on top.

---

### Step 4 — Install core dependencies

Packages are split into two groups and installed with the package manager you chose, in a single runtime install and a single dev install pass:

**Runtime deps (`npm install <pkg>`):**

| Package                    | Role                                 |
| -------------------------- | ------------------------------------ |
| `next-themes`              | dark / light mode toggling           |
| `lucide-react`             | icon set                             |
| `clsx`                     | conditional class name joining       |
| `tailwind-merge`           | removes conflicting Tailwind classes |
| `class-variance-authority` | typed component variants             |

**Dev deps (`npm install -D <pkg>`):**

| Package                                      | Role                |
| -------------------------------------------- | ------------------- |
| `tailwindcss@^4` + `@tailwindcss/postcss@^4` | Tailwind v4 engine  |
| `tw-animate-css`                             | animation utilities |
| `prettier`                                   | code formatter      |

---

### Step 5 — Write config files (`src/utils.ts → readTemplate`)

Two files are copied from `templates/` into your project:

- **`postcss.config.mjs`** — tells PostCSS to use the Tailwind v4 plugin
- **`prettier.config.js`** — sets `semi: false`, `singleQuote: true`, `printWidth: 100`

These are read with `readTemplate()`, which resolves paths relative to the CLI's own `templates/` folder.

---

### Step 6 — Initialise shadcn/ui

The CLI uses the same package-manager policy to run shadcn (`npx shadcn@latest ...` or `pnpm dlx shadcn@latest ...`).

This writes `components.json` and sets up the `components/ui/` directory.

Immediately after, the CLI **patches `components.json`** to apply your chosen settings:

```json
{
  "style": "new-york",
  "tailwind": { "baseColor": "<your choice>", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

Then `lib/utils.ts` is written from a template — this is the `cn()` helper:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Why `cn()` matters:** every shadcn component uses `cn()` to merge base styles with user-provided class overrides without conflicts.

---

### Step 7 — Add shadcn/ui components

The same package-manager policy is used to add all 15 components in one run.

15 components are added into `components/ui/`. Each component uses `cn()` + `class-variance-authority` internally, so they all share the same utility chain.

---

### Step 8 (optional) — Convex setup

When you choose **Yes** for Convex:

1. `convex` is installed as a runtime dep
2. `npm-run-all2` is installed as a dev dep (runs scripts in parallel)
3. `convex/schema.ts` and `convex/tsconfig.json` are written from templates
4. If the package manager is **pnpm**, an `.npmrc` is created with `enable-pre-post-scripts=true` (pnpm v8 disables pre/post lifecycle scripts by default; without this, `predev` won't run)
5. `package.json` scripts are updated:

```json
{
  "predev": "convex dev --until-success",
  "dev": "npm-run-all --parallel dev:frontend dev:backend",
  "dev:frontend": "next dev",
  "dev:backend": "convex dev"
}
```

**How this makes one command work:**

- `npm run dev` triggers `predev` first, which ensures Convex is connected to a deployment before anything starts.
- Then `npm-run-all` starts `next dev` and `convex dev` in parallel, so both the frontend and backend hot-reload together.
- For initial Convex linking, use the package-manager-specific command: `npx convex dev` (npm), `pnpm dlx convex dev` (pnpm).

---

### Step 9 (optional) — React Hook Form + Zod

When you choose **Yes**:

```bash
npm install react-hook-form @hookform/resolvers zod
```

**How these three packages connect:**

```
zod schema  →  @hookform/resolvers  →  react-hook-form
(validation)    (bridge/adapter)        (form state)
```

- **`zod`** defines the shape and rules of your form data (e.g. `z.string().min(1)`)
- **`@hookform/resolvers`** converts a zod schema into a format `react-hook-form` understands
- **`react-hook-form`** manages field registration, dirty state, and submission

The shadcn `form` component (added in Step 7) is a thin UI wrapper around this exact pattern.

---

## How Libraries Are Wired Together

```
create-next-app (Next.js base)
       │
       ├── Tailwind v4 + PostCSS ──────────── styles engine
       │         │
       │    tw-animate-css                   animations
       │
       ├── clsx + tailwind-merge ──────────── cn() utility
       │         │
       │    class-variance-authority         component variants
       │         │
       │    shadcn/ui components             UI layer
       │
       ├── next-themes ────────────────────── dark mode
       ├── lucide-react ───────────────────── icons
       │
       ├── [optional] Convex
       │      convex dev ◄──── predev ensures connection first
       │      next dev   ◄──── runs in parallel via npm-run-all
       │
       └── [optional] RHF + Zod
              zod → @hookform/resolvers → react-hook-form
```

---

## Source File Map

```
src/
├── index.ts      — entry point: runs prompts → scaffold → print summary
├── prompts.ts    — collects UserChoices via @clack/prompts
├── scaffold.ts   — composes the plan and executes setup steps in order
├── utils.ts      — shared command execution, file, template, and command-building helpers
└── package-manager.ts — npm/pnpm command policy adapters

templates/
├── postcss.config.mjs.template
├── prettier.config.js.template
├── components.json.template
├── lib/utils.ts.template
└── convex/
    ├── schema.ts.template
    └── tsconfig.json.template

bin/
└── index.js      — compiled CLI entry point (built from src/index.ts)
```

---

### Architecture seams

`createScaffoldPlan()` is the workflow’s planning seam. It is pure: given choices, it returns the generated project’s intended dependencies and scripts without touching the shell or filesystem.

`getPackageManagerPolicy()` is the package-manager seam. The npm and pnpm adapters own all syntax differences, including installs, `npx`/`pnpm dlx`, create-next-app flags, CI commands, and pnpm’s lifecycle configuration.

The execution workflow consumes these two modules. This concentrates change and makes tests able to verify the plan and command policy without creating a real Next.js project.

### Testing the complete workflow

`npm run test:integration` runs the real `scaffold()` workflow for both npm and pnpm in temporary directories. Local fake command tools stand in for `create-next-app`, package installation, and shadcn. The tests then verify generated package scripts, dependencies, components, optional Convex/Vitest files, package-manager CI configuration, and pnpm lifecycle settings. Nothing is published, deployed, or downloaded.

`npm run check` runs those integration tests together with the architecture tests, ESLint, and Prettier checks.

### Help and failure recovery

`npx create-ncs-app --help` prints usage, the supported npm/pnpm choices, and examples without starting the interactive prompts. Before scaffolding, the CLI checks the Node.js version and selected package manager. If a later command fails, only a project directory that did not exist before the run is removed; existing directories are protected.

## Requirements

- Node.js >= 20.12.0
- One of: `npm` or `pnpm`
