import { outro } from '@clack/prompts';
import { runPrompts } from './prompts';
import { scaffold, printSummary } from './scaffold';
import { HELP_TEXT } from './help';
import { assertNodeVersion } from './utils';

async function main(): Promise<void> {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(HELP_TEXT);
    return;
  }

  try {
    assertNodeVersion();
    const projectNameArg = process.argv[2];
    const choices = await runPrompts(projectNameArg);
    await scaffold(choices);
    printSummary(choices);
    outro('Happy building!');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nError: ${message}\n`);
    process.exit(1);
  }
}

main();
