const fs = require('node:fs');
const path = require('node:path');

const [command, ...args] = process.argv.slice(2);
const cwd = process.cwd();

function readPackage() {
  const packagePath = path.join(cwd, 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function writePackage(packageJson) {
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');
}

function installPackages(packages, dev) {
  const packageJson = readPackage();
  const section = dev ? 'devDependencies' : 'dependencies';
  packageJson[section] ??= {};
  for (const packageName of packages) {
    packageJson[section][packageName] = '0.0.0-test';
  }
  writePackage(packageJson);
}

function createNextApp(projectName) {
  const projectDir = path.resolve(cwd, projectName);
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(
      {
        name: projectName,
        version: '0.0.0-test',
        scripts: {},
        dependencies: {},
        devDependencies: {},
      },
      null,
      2,
    ) + '\n',
  );
}

function runShadcn(args) {
  const action = args[1];
  if (action === 'init') {
    fs.writeFileSync(
      path.join(cwd, 'components.json'),
      JSON.stringify(
        {
          style: 'default',
          rsc: false,
          tsx: true,
          tailwind: { baseColor: 'zinc', cssVariables: false },
          aliases: {},
        },
        null,
        2,
      ) + '\n',
    );
    return;
  }

  if (action === 'add') {
    const componentsDir = path.join(cwd, 'components', 'ui');
    fs.mkdirSync(componentsDir, { recursive: true });
    for (const component of args.slice(2).filter((arg) => arg !== '--yes')) {
      fs.writeFileSync(
        path.join(componentsDir, `${component}.tsx`),
        `export function ${component}() { return null; }\n`,
      );
    }
  }
}

if (args[0] === '--version') {
  process.stdout.write('0.0.0-test\n');
  process.exit(0);
}

if (command === 'npm' && args[0] === 'install') {
  installPackages(
    args.slice(1).filter((arg) => !arg.startsWith('--')),
    args.includes('--save-dev'),
  );
  process.exit(0);
}

if (command === 'pnpm' && args[0] === 'add') {
  if (args.includes('--allow-build=esbuild')) {
    const workspaceConfigPath = path.join(cwd, 'pnpm-workspace.yaml');
    const workspaceConfig = fs.existsSync(workspaceConfigPath)
      ? fs.readFileSync(workspaceConfigPath, 'utf8')
      : '';
    if (!workspaceConfig.includes('allowBuilds:')) {
      fs.writeFileSync(workspaceConfigPath, `${workspaceConfig}allowBuilds:\n  esbuild: true\n`);
    }
  }
  if (process.env.FAKE_PNPM_REQUIRE_ESBUILD_APPROVAL === '1') {
    const workspaceConfigPath = path.join(cwd, 'pnpm-workspace.yaml');
    const workspaceConfig = fs.existsSync(workspaceConfigPath)
      ? fs.readFileSync(workspaceConfigPath, 'utf8')
      : '';
    if (
      !/^allowBuilds:\r?\n(?:[ \t].*\r?\n)*[ \t]+esbuild:[ \t]+true[ \t]*$/m.test(workspaceConfig)
    ) {
      process.stderr.write('[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.27.0\n');
      process.exit(1);
    }
  }
  installPackages(
    args.slice(1).filter((arg) => !arg.startsWith('-')),
    args.includes('-D'),
  );
  process.exit(0);
}

if (command === 'npx' || command === 'pnpm') {
  const commandArgs = command === 'pnpm' && args[0] === 'dlx' ? args.slice(1) : args;
  if (commandArgs[0] === 'create-next-app@latest') {
    createNextApp(commandArgs[1]);
    if (process.env.FAKE_FAIL_NPX === '1') {
      process.stderr.write('simulated create-next-app failure\n');
      process.exit(1);
    }
    process.exit(0);
  }
  if (commandArgs[0] === 'shadcn@latest') {
    runShadcn(commandArgs);
    process.exit(0);
  }
}

process.exit(0);
