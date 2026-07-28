'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const prompts_1 = require('@clack/prompts');
const prompts_2 = require('./prompts');
const scaffold_1 = require('./scaffold');
const help_1 = require('./help');
const utils_1 = require('./utils');
async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(help_1.HELP_TEXT);
    return;
  }
  try {
    (0, utils_1.assertNodeVersion)();
    const projectNameArg = process.argv[2];
    const choices = await (0, prompts_2.runPrompts)(projectNameArg);
    await (0, scaffold_1.scaffold)(choices);
    (0, scaffold_1.printSummary)(choices);
    (0, prompts_1.outro)('Happy building! 脂');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n笶・Error: ${message}\n`);
    process.exit(1);
  }
}
main();
//# sourceMappingURL=index.js.map
