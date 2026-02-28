import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export type PackageManager = 'npm' | 'pnpm' | 'bun'

/**
 * Run a shell command synchronously, streaming output to the terminal.
 * Throws if the command exits with a non-zero code.
 */
export function runCommand(command: string, cwd?: string): void {
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    })
  } catch (error) {
    const err = error as Error & { stderr?: Buffer }
    throw new Error(`Command failed: ${command}\n${err.stderr?.toString() ?? ''}`)
  }
}

/**
 * Write content to a file, creating parent directories as needed.
 */
export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, content, 'utf8')
}

/**
 * Read a template file from the templates directory.
 */
export function readTemplate(templateRelPath: string): string {
  const templatePath = path.join(__dirname, '..', 'templates', templateRelPath)
  return fs.readFileSync(templatePath, 'utf8')
}

/**
 * Build the install command for the given package manager.
 */
export function getInstallCommand(
  pm: PackageManager,
  packages: string[],
  dev = false
): string {
  const pkgList = packages.join(' ')
  switch (pm) {
    case 'pnpm':
      return `pnpm add ${dev ? '-D ' : ''}${pkgList}`
    case 'bun':
      return `bun add ${dev ? '-d ' : ''}${pkgList}`
    case 'npm':
    default:
      return `npm install ${dev ? '--save-dev ' : ''}${pkgList}`
  }
}
