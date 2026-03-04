# How `create-ncs-app` Works

This document explains how the CLI scaffolder works internally — from running one command to having a fully-configured project.

---

## Overview

```
npx create-ncs-app my-app
```

This single command does the following in order:

1. Asks you five questions
2. Runs `create-next-app` to bootstrap Next.js
3. Installs and wires up all core dependencies
4. Writes config files
5. Initialises and configures shadcn/ui
6. Optionally sets up Convex and/or React Hook Form + Zod

---

## Step-by-Step Breakdown

### Step 1 — Collect choices (`src/prompts.ts`)

The CLI uses [`@clack/prompts`](https://github.com/bombshell-dev/clack) to ask five interactive questions:

| # | Question | Feeds into |
|---|----------|------------|
| 1 | Project name | folder name + `package.json` name |
| 2 | Package manager (`npm` / `pnpm` / `bun`) | every install command |
| 3 | shadcn base color | `components.json` → UI palette |
| 4 | Include Convex? | optional backend setup |
| 5 | Include React Hook Form + Zod? | optional form setup |

All answers are collected into a single `UserChoices` object and passed straight into the scaffold function.

---

### Step 2 — Bootstrap Next.js (`src/scaffold.ts`)

```ts
npx create-next-app@latest <name> --typescript --tailwind --eslint --app --no-src-dir --no-import-alias --turbopack
```

This gives you a clean Next.js project with:
- App Router
- TypeScript
- ESLint
- Tailwind CSS (base install)

Everything else is layered on top.

---

### Step 3 — Install core dependencies

Packages are split into two groups and installed with the package manager you chose:

**Runtime deps (`npm install <pkg>`):**

| Package | Role |
|---------|------|
| `next-themes` | dark / light mode toggling |
| `lucide-react` | icon set |
| `clsx` | conditional class name joining |
| `tailwind-merge` | removes conflicting Tailwind classes |
| `class-variance-authority` | typed component variants |

**Dev deps (`npm install -D <pkg>`):**

| Package | Role |
|---------|------|
| `tailwindcss@^4` + `@tailwindcss/postcss@^4` | Tailwind v4 engine |
| `tw-animate-css` | animation utilities |
| `prettier` | code formatter |
| `shadcn@latest` | shadcn CLI (used in next steps) |

---

### Step 4 — Write config files (`src/utils.ts → readTemplate`)

Two files are copied from `templates/` into your project:

- **`postcss.config.mjs`** — tells PostCSS to use the Tailwind v4 plugin
- **`prettier.config.js`** — sets `semi: false`, `singleQuote: true`, `printWidth: 100`

These are read with `readTemplate()`, which resolves paths relative to the CLI's own `templates/` folder.

---

### Step 5 — Initialise shadcn/ui

```bash
npx shadcn@latest init --yes
```

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
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Why `cn()` matters:** every shadcn component uses `cn()` to merge base styles with user-provided class overrides without conflicts.

---

### Step 6 — Add shadcn/ui components

```bash
npx shadcn@latest add button card dialog input label select dropdown-menu \
  sonner chart form separator badge avatar skeleton tabs --yes
```

15 components are added into `components/ui/`. Each component uses `cn()` + `class-variance-authority` internally, so they all share the same utility chain.

---

### Step 7 (optional) — Convex setup

When you choose **Yes** for Convex:

1. `convex` is installed as a runtime dep
2. `npm-run-all2` is installed as a dev dep (runs scripts in parallel)
3. `convex/schema.ts` and `convex/tsconfig.json` are written from templates
4. `package.json` scripts are updated:

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

---

### Step 8 (optional) — React Hook Form + Zod

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

The shadcn `form` component (added in Step 6) is a thin UI wrapper around this exact pattern.

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
├── scaffold.ts   — executes all setup steps in order
└── utils.ts      — runCommand, writeFile, readTemplate, getInstallCommand

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

## Requirements

- Node.js >= 18
- One of: `npm`, `pnpm`, or `bun`
