"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPrompts = runPrompts;
const prompts_1 = require("@clack/prompts");
async function runPrompts(projectNameArg) {
    (0, prompts_1.intro)('🚀 create-ncs-app — Next.js + Convex + Shadcn scaffolder');
    // 1. Project name
    (0, prompts_1.note)('This will be the folder name and the name field in package.json.');
    const projectNameResult = await (0, prompts_1.text)({
        message: 'What is your project name?',
        placeholder: 'my-app',
        initialValue: projectNameArg ?? 'my-app',
        validate(value) {
            if (!value || value.trim().length === 0)
                return 'Project name is required';
            if (!/^[a-z0-9][a-z0-9_-]*$/i.test(value.trim())) {
                return 'Project name must start with a letter or number and can only contain letters, numbers, hyphens, and underscores';
            }
        },
    });
    if ((0, prompts_1.isCancel)(projectNameResult)) {
        (0, prompts_1.cancel)('Operation cancelled.');
        process.exit(0);
    }
    const projectName = projectNameResult.trim();
    // 2. Package manager
    (0, prompts_1.note)('Choose how dependencies will be installed.\nnpm is default, pnpm is faster with a shared cache, bun is the fastest and most modern.');
    const pmResult = await (0, prompts_1.select)({
        message: 'Which package manager do you want to use?',
        options: [
            { value: 'npm', label: 'npm', hint: 'default Node.js package manager' },
            { value: 'pnpm', label: 'pnpm', hint: 'faster with a shared cache' },
            { value: 'bun', label: 'bun', hint: 'fastest and most modern' },
        ],
    });
    if ((0, prompts_1.isCancel)(pmResult)) {
        (0, prompts_1.cancel)('Operation cancelled.');
        process.exit(0);
    }
    const packageManager = pmResult;
    // 3. shadcn base color
    (0, prompts_1.note)('This sets the gray-scale palette used across all shadcn components.\nslate = cool blue-gray, zinc = clean neutral, gray = standard gray, neutral = warm minimal, stone = warm brownish-gray.');
    const colorResult = await (0, prompts_1.select)({
        message: 'Which base color would you like to use for shadcn/ui?',
        options: [
            { value: 'slate', label: 'slate', hint: 'cool blue-gray' },
            { value: 'zinc', label: 'zinc', hint: 'clean neutral' },
            { value: 'gray', label: 'gray', hint: 'standard gray' },
            { value: 'neutral', label: 'neutral', hint: 'warm minimal' },
            { value: 'stone', label: 'stone', hint: 'warm brownish-gray' },
        ],
    });
    if ((0, prompts_1.isCancel)(colorResult)) {
        (0, prompts_1.cancel)('Operation cancelled.');
        process.exit(0);
    }
    const shadcnBaseColor = colorResult;
    // 4. Include Convex?
    (0, prompts_1.note)('Convex is a real-time backend-as-a-service with a built-in database, server functions, and live queries.\nAdds convex package, sets up convex/ folder with a starter schema.ts, and adds dev:backend and predev npm scripts.\nRequires a free Convex account at convex.dev.');
    const convexResult = await (0, prompts_1.confirm)({
        message: 'Include Convex (real-time backend + database)?',
        initialValue: false,
    });
    if ((0, prompts_1.isCancel)(convexResult)) {
        (0, prompts_1.cancel)('Operation cancelled.');
        process.exit(0);
    }
    const includeConvex = convexResult;
    // 5. Include Vitest?
    (0, prompts_1.note)('Vitest is a fast Vite-native unit testing framework.\nAdds vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/jest-dom, and jsdom.\nIncludes a vitest.config.ts and vitest.setup.ts to get you started immediately.');
    const vitestResult = await (0, prompts_1.confirm)({
        message: 'Include Vitest (unit testing)?',
        initialValue: false,
    });
    if ((0, prompts_1.isCancel)(vitestResult)) {
        (0, prompts_1.cancel)('Operation cancelled.');
        process.exit(0);
    }
    const includeVitest = vitestResult;
    // 6. Include React Hook Form + Zod?
    (0, prompts_1.note)('react-hook-form handles form state and submission with minimal re-renders.\nzod provides TypeScript-first schema validation.\n@hookform/resolvers connects them together.\nRecommended if your app has any forms.');
    const rhfResult = await (0, prompts_1.confirm)({
        message: 'Include React Hook Form + Zod (form handling + validation)?',
        initialValue: false,
    });
    if ((0, prompts_1.isCancel)(rhfResult)) {
        (0, prompts_1.cancel)('Operation cancelled.');
        process.exit(0);
    }
    const includeRhfZod = rhfResult;
    return {
        projectName,
        packageManager,
        shadcnBaseColor,
        includeConvex,
        includeVitest,
        includeRhfZod,
    };
}
//# sourceMappingURL=prompts.js.map