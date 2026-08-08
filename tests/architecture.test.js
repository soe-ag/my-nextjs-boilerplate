const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createScaffoldPlan } = require('../dist/scaffold.js');
const { getPackageManagerPolicy } = require('../dist/package-manager.js');
const { HELP_TEXT } = require('../dist/help.js');

const choices = (overrides = {}) => ({
  projectName: 'demo-app',
  packageManager: 'npm',
  shadcnBaseColor: 'zinc',
  includeConvex: false,
  includeVitest: false,
  includeRhfZod: false,
  ...overrides,
});

test('the scaffold plan composes the base project', () => {
  const plan = createScaffoldPlan(choices(), 'C:/workspace');

  assert.equal(plan.projectDir, path.join('C:/workspace', 'demo-app'));
  assert.deepEqual(plan.dependencies, [
    'next-themes',
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
  ]);
  assert.equal(plan.projectScripts.dev, 'next dev');
  assert.equal(plan.projectScripts.test, undefined);
});

test('the scaffold plan composes optional features together', () => {
  const plan = createScaffoldPlan(
    choices({
      packageManager: 'pnpm',
      includeConvex: true,
      includeVitest: true,
      includeRhfZod: true,
    }),
    'C:/workspace',
  );

  assert.ok(plan.dependencies.includes('convex'));
  assert.ok(plan.dependencies.includes('react-hook-form'));
  assert.ok(plan.devDependencies.includes('vitest'));
  assert.equal(plan.projectScripts.dev, 'npm-run-all --parallel dev:frontend dev:backend');
  assert.equal(plan.projectScripts.test, 'vitest run');
  assert.equal(plan.packageManagerPolicy.name, 'pnpm');
});

test('npm and pnpm policies own their command syntax', () => {
  const npm = getPackageManagerPolicy('npm');
  const pnpm = getPackageManagerPolicy('pnpm');

  assert.equal(npm.installCommand(['react'], true), 'npm install --save-dev react');
  assert.equal(pnpm.installCommand(['react'], true), 'pnpm add -D react --allow-build=esbuild');
  assert.equal(npm.createNextAppFlag, '--use-npm');
  assert.equal(pnpm.createNextAppFlag, '--use-pnpm');
  assert.doesNotMatch(pnpm.ciSetupSteps, /version: 9/);
  assert.equal(npm.lifecycleConfig, undefined);
  assert.equal(pnpm.lifecycleConfig.fileName, 'pnpm-workspace.yaml');
  assert.equal(pnpm.lifecycleConfig.content, 'enablePrePostScripts: true\n');
});

test('help text documents usage and package managers', () => {
  assert.match(HELP_TEXT, /Usage:/);
  assert.match(HELP_TEXT, /npm/);
  assert.match(HELP_TEXT, /pnpm/);
  assert.match(HELP_TEXT, /npx create-ncs-app my-app/);
});
