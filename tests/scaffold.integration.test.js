const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { scaffold } = require('../dist/scaffold.js');

const fakeTools = path.join(__dirname, 'fake-package-tools.js');

function writeCommand(binDir, name) {
  const commandPath = path.join(binDir, `${name}.cmd`);
  fs.writeFileSync(commandPath, `@echo off\r\nnode "%~dp0fake-package-tools.js" ${name} %*\r\n`);
}

async function withFakeTools(packageManager, run) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-ncs-app-integration-'));
  const binDir = path.join(tempDir, 'fake-bin');
  fs.mkdirSync(binDir);
  fs.copyFileSync(fakeTools, path.join(binDir, 'fake-package-tools.js'));
  writeCommand(binDir, 'npm');
  writeCommand(binDir, 'npx');
  writeCommand(binDir, 'pnpm');

  const oldCwd = process.cwd();
  const oldPath = process.env.PATH;
  process.chdir(tempDir);
  process.env.PATH = `${binDir};${oldPath}`;

  try {
    await run(tempDir);
  } finally {
    process.chdir(oldCwd);
    process.env.PATH = oldPath;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function choices(packageManager) {
  return {
    projectName: 'integration-app',
    packageManager,
    shadcnBaseColor: 'slate',
    includeConvex: true,
    includeVitest: true,
    includeRhfZod: true,
  };
}

function assertGeneratedProject(tempDir, packageManager) {
  const projectDir = path.join(tempDir, 'integration-app');
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'));
  const componentsJson = JSON.parse(
    fs.readFileSync(path.join(projectDir, 'components.json'), 'utf8'),
  );
  const workflow = fs.readFileSync(path.join(projectDir, '.github', 'workflows', 'ci.yml'), 'utf8');

  assert.equal(packageJson.scripts['dev:backend'], 'convex dev');
  assert.equal(packageJson.scripts.test, 'vitest run');
  assert.equal(packageJson.scripts['test:watch'], 'vitest');
  assert.equal(packageJson.dependencies.convex, '0.0.0-test');
  assert.equal(packageJson.dependencies['react-hook-form'], '0.0.0-test');
  assert.equal(packageJson.devDependencies.vitest, '0.0.0-test');
  assert.equal(componentsJson.style, 'new-york');
  assert.equal(componentsJson.tailwind.baseColor, 'slate');
  assert.ok(fs.existsSync(path.join(projectDir, 'convex', 'schema.ts')));
  assert.ok(fs.existsSync(path.join(projectDir, 'vitest.config.ts')));
  assert.ok(fs.existsSync(path.join(projectDir, 'components', 'ui', 'button.tsx')));
  assert.match(workflow, packageManager === 'npm' ? /cache: 'npm'/ : /pnpm\/action-setup/);

  if (packageManager === 'pnpm') {
    assert.equal(
      fs.readFileSync(path.join(projectDir, '.npmrc'), 'utf8'),
      'enable-pre-post-scripts=true\n',
    );
  }
}

test(
  'scaffolds a complete npm project through the real workflow',
  { concurrency: false },
  async () => {
    await withFakeTools('npm', async (tempDir) => {
      await scaffold(choices('npm'));
      assertGeneratedProject(tempDir, 'npm');
    });
  },
);

test(
  'scaffolds a complete pnpm project through the real workflow',
  { concurrency: false },
  async () => {
    await withFakeTools('pnpm', async (tempDir) => {
      await scaffold(choices('pnpm'));
      assertGeneratedProject(tempDir, 'pnpm');
    });
  },
);
