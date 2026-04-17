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
exports.getDlxCommand = getDlxCommand;
exports.runCommand = runCommand;
exports.assertPackageManagerAvailable = assertPackageManagerAvailable;
exports.writeFile = writeFile;
exports.readTemplate = readTemplate;
exports.getInstallCommand = getInstallCommand;
exports.getCreateNextAppCommand = getCreateNextAppCommand;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PM_INSTALL_HELP = {
    npm: "https://docs.npmjs.com/downloading-and-installing-node-js-and-npm",
    pnpm: "https://pnpm.io/installation",
    bun: "https://bun.sh/docs/installation",
};
/**
 * Build the package-manager-specific command for one-off package execution.
 */
function getDlxCommand(pm) {
    switch (pm) {
        case "pnpm":
            return "pnpm dlx";
        case "bun":
            return "bunx";
        case "npm":
        default:
            return "npx";
    }
}
/**
 * Run a shell command synchronously, streaming output to the terminal.
 * Throws if the command exits with a non-zero code.
 */
function runCommand(command, cwd) {
    try {
        (0, child_process_1.execSync)(command, {
            cwd,
            stdio: "inherit",
            shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
        });
    }
    catch (error) {
        const err = error;
        throw new Error(`Command failed: ${command}\n${err.stderr?.toString() ?? ""}`);
    }
}
/**
 * Ensure the selected package manager exists before running long scaffold steps.
 */
function assertPackageManagerAvailable(pm) {
    const binary = pm === "bun" ? "bun" : pm;
    try {
        (0, child_process_1.execSync)(`${binary} --version`, {
            stdio: "ignore",
            shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
        });
    }
    catch {
        throw new Error([
            `Selected package manager \"${pm}\" is not installed or not available in PATH.`,
            `Install it first: ${PM_INSTALL_HELP[pm]}`,
        ].join("\n"));
    }
}
/**
 * Write content to a file, creating parent directories as needed.
 */
function writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, "utf8");
}
/**
 * Read a template file from the templates directory.
 */
function readTemplate(templateRelPath) {
    const templatePath = path.join(__dirname, "..", "templates", templateRelPath);
    return fs.readFileSync(templatePath, "utf8");
}
/**
 * Build the install command for the given package manager.
 */
function getInstallCommand(pm, packages, dev = false) {
    const pkgList = packages.join(" ");
    switch (pm) {
        case "pnpm":
            return `pnpm add ${dev ? "-D " : ""}${pkgList}`;
        case "bun":
            return `bun add ${dev ? "-d " : ""}${pkgList}`;
        case "npm":
        default:
            return `npm install ${dev ? "--save-dev " : ""}${pkgList}`;
    }
}
/**
 * Build the create-next-app command using the user's selected package manager.
 */
function getCreateNextAppCommand(pm, projectName) {
    const dlx = getDlxCommand(pm);
    const useFlag = pm === "npm" ? "--use-npm" : pm === "pnpm" ? "--use-pnpm" : "--use-bun";
    return [
        `${dlx} create-next-app@latest ${projectName}`,
        "--typescript",
        "--tailwind",
        "--eslint",
        "--app",
        "--no-src-dir",
        "--no-import-alias",
        "--turbopack",
        useFlag,
        "--yes",
    ].join(" ");
}
//# sourceMappingURL=utils.js.map