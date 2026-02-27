"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaffold = scaffold;
exports.printSummary = printSummary;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prompts_1 = require("@clack/prompts");
const utils_1 = require("./utils");
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
async function scaffold(choices) {
    const { projectName, packageManager, shadcnBaseColor, includeConvex, includeRhfZod } = choices;
    const cwd = process.cwd();
    const projectDir = path.join(cwd, projectName);
    // ─── Step 1: Run create-next-app ─────────────────────────────────────────
    const s = (0, prompts_1.spinner)();
    s.start('Running create-next-app…');
    (0, utils_1.runCommand)(`npx create-next-app@latest ${projectName} --typescript --tailwind --eslint --app --no-src-dir --no-import-alias --turbopack`);
    s.stop('create-next-app complete ✓');
    // ─── Step 2: Install mandatory dependencies ───────────────────────────────
    s.start('Installing core dependencies…');
    const deps = [
        'next@latest',
        'react@latest',
        'react-dom@latest',
        'next-themes',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
    ];
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
    ];
    (0, utils_1.runCommand)((0, utils_1.getInstallCommand)(packageManager, deps), projectDir);
    (0, utils_1.runCommand)((0, utils_1.getInstallCommand)(packageManager, devDeps, true), projectDir);
    s.stop('Core dependencies installed ✓');
    // ─── Step 3: Write config files ───────────────────────────────────────────
    s.start('Writing config files…');
    (0, utils_1.writeFile)(path.join(projectDir, 'postcss.config.mjs'), (0, utils_1.readTemplate)('postcss.config.mjs.template'));
    (0, utils_1.writeFile)(path.join(projectDir, 'prettier.config.js'), (0, utils_1.readTemplate)('prettier.config.js.template'));
    // lib/utils.ts
    (0, utils_1.writeFile)(path.join(projectDir, 'lib', 'utils.ts'), (0, utils_1.readTemplate)('lib/utils.ts.template'));
    s.stop('Config files written ✓');
    // ─── Step 4: shadcn init ──────────────────────────────────────────────────
    s.start('Initialising shadcn/ui…');
    (0, utils_1.runCommand)('npx shadcn@latest init --yes', projectDir);
    s.stop('shadcn/ui initialised ✓');
    // ─── Step 5: Write components.json with chosen settings ───────────────────
    const componentsJsonTemplate = (0, utils_1.readTemplate)('components.json.template');
    const componentsJson = componentsJsonTemplate.replace('{{BASE_COLOR}}', shadcnBaseColor);
    (0, utils_1.writeFile)(path.join(projectDir, 'components.json'), componentsJson);
    // ─── Step 6: Add shadcn components ───────────────────────────────────────
    s.start(`Adding ${SHADCN_COMPONENTS.length} shadcn/ui components…`);
    (0, utils_1.runCommand)(`npx shadcn@latest add ${SHADCN_COMPONENTS.join(' ')} --yes`, projectDir);
    s.stop(`${SHADCN_COMPONENTS.length} shadcn/ui components added ✓`);
    // ─── Step 7: Convex setup ─────────────────────────────────────────────────
    if (includeConvex) {
        s.start('Setting up Convex…');
        (0, utils_1.runCommand)((0, utils_1.getInstallCommand)(packageManager, ['convex']), projectDir);
        (0, utils_1.runCommand)((0, utils_1.getInstallCommand)(packageManager, ['npm-run-all2'], true), projectDir);
        // convex/schema.ts
        const convexDir = path.join(projectDir, 'convex');
        fs.mkdirSync(convexDir, { recursive: true });
        (0, utils_1.writeFile)(path.join(convexDir, 'schema.ts'), (0, utils_1.readTemplate)('convex/schema.ts.template'));
        (0, utils_1.writeFile)(path.join(convexDir, 'tsconfig.json'), (0, utils_1.readTemplate)('convex/tsconfig.json.template'));
        // Update package.json scripts
        const pkgJsonPath = path.join(projectDir, 'package.json');
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        pkgJson.scripts = {
            dev: 'npm-run-all --parallel dev:frontend dev:backend',
            'dev:frontend': 'next dev',
            'dev:backend': 'convex dev',
            predev: 'convex dev --until-success',
            build: 'next build',
            start: 'next start',
            lint: 'eslint .',
        };
        (0, utils_1.writeFile)(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
        s.stop('Convex setup complete ✓');
    }
    else {
        // Update package.json scripts (no-convex version)
        const pkgJsonPath = path.join(projectDir, 'package.json');
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        pkgJson.scripts = {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'eslint .',
        };
        (0, utils_1.writeFile)(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    }
    // ─── Step 8: React Hook Form + Zod setup ─────────────────────────────────
    if (includeRhfZod) {
        s.start('Installing React Hook Form + Zod…');
        (0, utils_1.runCommand)((0, utils_1.getInstallCommand)(packageManager, ['react-hook-form', '@hookform/resolvers', 'zod']), projectDir);
        s.stop('React Hook Form + Zod installed ✓');
    }
}
function printSummary(choices) {
    const { projectName, packageManager, shadcnBaseColor, includeConvex, includeRhfZod } = choices;
    const devCmd = packageManager === 'npm' ? 'npm run dev' : packageManager === 'pnpm' ? 'pnpm dev' : 'bun dev';
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
${includeConvex
        ? `
  Convex note:
    Run 'npx convex dev' to link to your Convex deployment.
    Get a free account at https://convex.dev
`
        : ''}`);
}
//# sourceMappingURL=scaffold.js.map