import { outro } from '@clack/prompts'
import { runPrompts } from './prompts'
import { scaffold, printSummary } from './scaffold'

async function main(): Promise<void> {
  // Accept optional project name as first CLI argument
  const projectNameArg = process.argv[2]

  try {
    const choices = await runPrompts(projectNameArg)
    await scaffold(choices)
    printSummary(choices)
    outro('Happy building! 🎉')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Error: ${message}\n`)
    process.exit(1)
  }
}

main()
