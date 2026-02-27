"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = require("@clack/prompts");
const prompts_2 = require("./prompts");
const scaffold_1 = require("./scaffold");
async function main() {
    // Accept optional project name as first CLI argument
    const projectNameArg = process.argv[2];
    try {
        const choices = await (0, prompts_2.runPrompts)(projectNameArg);
        await (0, scaffold_1.scaffold)(choices);
        (0, scaffold_1.printSummary)(choices);
        (0, prompts_1.outro)('Happy building! 🎉');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\n❌ Error: ${message}\n`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map