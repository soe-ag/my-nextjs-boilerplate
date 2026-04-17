# create-ncs-app

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat&logo=shadcnui&logoColor=white)
![Convex](https://img.shields.io/badge/Convex-EE342F?style=flat&logo=convex&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

> Scaffold a fully-configured Next.js + Convex + shadcn/ui project in seconds.

---

## What is `create-ncs-app`?

`create-ncs-app` is an opinionated CLI tool that bootstraps a production-ready **Next.js** project with a curated stack — similar to `create-next-app` but with all the extras pre-configured:

- **Next.js** (App Router) + TypeScript + Tailwind CSS v4
- **shadcn/ui** (new-york style) with 15 components pre-installed
- **next-themes** for dark mode out of the box
- **lucide-react** for icons
- Optionally: **Convex** real-time backend and/or **React Hook Form + Zod**

---

## Usage

```bash
npx create-ncs-app my-app
```

Or just run it without arguments and follow the interactive prompts:

```bash
npx create-ncs-app
```

You'll be guided through six prompts:

| #   | Prompt                         | Options                                             |
| --- | ------------------------------ | --------------------------------------------------- |
| 1   | Project name                   | any valid folder name (default: `my-app`)           |
| 2   | Package manager                | `npm` \| `pnpm` \| `bun`                            |
| 3   | shadcn base color              | `slate` \| `zinc` \| `gray` \| `neutral` \| `stone` |
| 4   | Include Convex?                | Yes / No                                            |
| 5   | Include Vitest?                | Yes / No                                            |
| 6   | Include React Hook Form + Zod? | Yes / No                                            |

---

## What's Always Included

| Package                                      | Purpose                                  |
| -------------------------------------------- | ---------------------------------------- |
| `next@latest`                                | React framework (App Router)             |
| `react` / `react-dom`                        | React runtime                            |
| `typescript`                                 | Type-safe JavaScript                     |
| `tailwindcss@^4` + `@tailwindcss/postcss@^4` | Utility-first CSS                        |
| `tw-animate-css`                             | Tailwind animation utilities             |
| `next-themes`                                | Dark mode support                        |
| `lucide-react`                               | Icon library                             |
| `clsx` + `tailwind-merge`                    | Conditional class merging (`cn` utility) |
| `class-variance-authority`                   | Component variant management             |
| `prettier`                                   | Opinionated code formatter               |
| `eslint` + `eslint-config-next`              | Linting                                  |

### Config files written

- `postcss.config.mjs` — Tailwind v4 PostCSS config
- `prettier.config.js` — Prettier settings (semi: false, singleQuote: true)
- `lib/utils.ts` — `cn()` helper using `clsx` + `tailwind-merge`
- `components.json` — shadcn/ui config (new-york style, your chosen base color)

---

## shadcn/ui Components Pre-Installed

All 15 components are added automatically — no prompts:

| Component       | Category                          |
| --------------- | --------------------------------- |
| `button`        | Core UI primitive                 |
| `card`          | Core UI primitive                 |
| `dialog`        | Core UI primitive                 |
| `input`         | Core UI primitive                 |
| `label`         | Core UI primitive                 |
| `select`        | Core UI primitive                 |
| `dropdown-menu` | Core UI primitive                 |
| `sonner`        | Toast notifications               |
| `chart`         | Chart components (wraps recharts) |
| `form`          | Form wrapper for react-hook-form  |
| `separator`     | Layout / display                  |
| `badge`         | Layout / display                  |
| `avatar`        | Layout / display                  |
| `skeleton`      | Loading state                     |
| `tabs`          | Navigation                        |

---

## Optional Add-ons

### Convex (real-time backend + database)

When selected, the following is set up for you:

- `convex` package installed
- `convex/schema.ts` — starter schema file
- `convex/tsconfig.json` — Convex-specific TypeScript config
- `npm-run-all2` installed for parallel dev scripts
- `package.json` scripts updated:

```json
{
  "dev": "npm-run-all --parallel dev:frontend dev:backend",
  "dev:frontend": "next dev",
  "dev:backend": "convex dev",
  "predev": "convex dev --until-success"
}
```

### React Hook Form + Zod

When selected, the following packages are installed:

- `react-hook-form` — performant form state management
- `@hookform/resolvers` — connects react-hook-form with Zod
- `zod` — TypeScript-first schema validation

---

## Getting Started After Setup

```bash
cd my-app
npm run dev   # or: pnpm dev / bun dev
```

### If you selected Convex

1. Run the command matching your package manager to link your project to a Convex deployment:

- npm: `npx convex dev`
- pnpm: `pnpm dlx convex dev`
- bun: `bunx convex dev`

2. Create a free account at [https://convex.dev](https://convex.dev) if you don't have one.
3. The `predev` script will automatically run `convex dev --until-success` before starting the frontend.

---

## Project Structure (generated app)

```
my-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/          ← 15 shadcn components
├── lib/
│   └── utils.ts     ← cn() helper
├── convex/          ← only if Convex selected
│   ├── schema.ts
│   └── tsconfig.json
├── components.json
├── postcss.config.mjs
├── prettier.config.js
└── package.json
```

---

## Requirements

- Node.js >= 18
- npm, pnpm, or bun installed

---

## License

MIT
