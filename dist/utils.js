'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.assertNodeVersion = assertNodeVersion;
exports.getDlxCommand = getDlxCommand;
exports.runCommand = runCommand;
exports.assertPackageManagerAvailable = assertPackageManagerAvailable;
exports.writeFile = writeFile;
exports.readTemplate = readTemplate;
exports.getInstallCommand = getInstallCommand;
exports.getCreateNextAppCommand = getCreateNextAppCommand;
const child_process_1 = require('child_process');
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
const package_manager_1 = require('./package-manager');
const MIN_NODE_VERSION = [20, 12, 0];
function getErrorDetails(error) {
  const err = error;
  return [err.message, err.stderr?.toString(), err.stdout?.toString()].filter(Boolean).join('\n');
}
function getCommandName(command) {
  return command
    .trim()
    .split(/\s+/)[0]
    .replace(/^['"]|['"]$/g, '');
}
function isMissingCommand(error) {
  const err = error;
  return (
    err.code === 'ENOENT' ||
    /not recognized|command not found|no such file or directory/i.test(getErrorDetails(error))
  );
}
/** Verify that the Node.js runtime satisfies the package requirement. */
function assertNodeVersion() {
  const [major, minor, patch] = process.versions.node.split('.').map(Number);
  const current = [major, minor, patch];
  const supported =
    current.some((value, index) => value > MIN_NODE_VERSION[index]) ||
    current.every((value, index) => value === MIN_NODE_VERSION[index]);
  if (!supported) {
    throw new Error(
      `Node.js ${MIN_NODE_VERSION.join('.')} or newer is required. You are running Node.js ${process.versions.node}.`,
    );
  }
}
/** Build the package-manager-specific command for one-off package execution. */
function getDlxCommand(pm) {
  return (0, package_manager_1.getPackageManagerPolicy)(pm).dlxCommand;
}
/** Run a shell command synchronously, streaming output to the terminal. */
function runCommand(command, cwd) {
  try {
    (0, child_process_1.execSync)(command, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });
  } catch (error) {
    const commandName = getCommandName(command);
    if (isMissingCommand(error)) {
      const installHint =
        commandName === 'npm' || commandName === 'npx'
          ? 'Install Node.js, which includes npm and npx.'
          : `Install ${commandName} and make sure it is available in your PATH.`;
      throw new Error(`Command "${commandName}" was not found. ${installHint}`);
    }
    const details = getErrorDetails(error);
    throw new Error(`Command failed: ${command}\n${details}`);
  }
}
/** Ensure the selected package manager exists before long scaffold steps. */
function assertPackageManagerAvailable(pm) {
  const policy = (0, package_manager_1.getPackageManagerPolicy)(pm);
  try {
    (0, child_process_1.execSync)(`${policy.name} --version`, {
      stdio: 'ignore',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });
  } catch {
    const installHint =
      policy.name === 'npm'
        ? 'Install Node.js, which includes npm.'
        : `Install pnpm from ${policy.installHelpUrl}`;
    throw new Error(
      `Package manager "${policy.name}" was not found. ${installHint}\nMake sure it is available in your PATH and try again.`,
    );
  }
}
/** Write content to a file, creating parent directories as needed. */
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
}
/** Read a template file from the templates directory. */
function readTemplate(templateRelPath) {
  const templatePath = path.join(__dirname, '..', 'templates', templateRelPath);
  return fs.readFileSync(templatePath, 'utf8');
}
/** Build the install command for the selected package manager. */
function getInstallCommand(pm, packages, dev = false) {
  return (0, package_manager_1.getPackageManagerPolicy)(pm).installCommand(packages, dev);
}
/** Build the create-next-app command using the selected package manager. */
function getCreateNextAppCommand(pm, projectName) {
  const policy = (0, package_manager_1.getPackageManagerPolicy)(pm);
  return [
    `${policy.dlxCommand} create-next-app@latest ${projectName}`,
    '--typescript',
    '--tailwind',
    '--eslint',
    '--app',
    '--no-src-dir',
    '--no-import-alias',
    '--turbopack',
    policy.createNextAppFlag,
    '--yes',
  ].join(' ');
}
//# sourceMappingURL=utils.js.map
