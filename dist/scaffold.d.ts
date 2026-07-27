import { UserChoices } from "./prompts";
import { PackageManagerPolicy } from "./package-manager";
export interface ScaffoldPlan {
    readonly choices: UserChoices;
    readonly cwd: string;
    readonly projectDir: string;
    readonly packageManagerPolicy: PackageManagerPolicy;
    readonly dependencies: string[];
    readonly devDependencies: string[];
    readonly projectScripts: Record<string, string>;
}
/**
 * Compose all decisions that affect the generated project before any side effects occur.
 * The returned plan is the scaffold workflow's main test surface.
 */
export declare function createScaffoldPlan(choices: UserChoices, cwd?: string): ScaffoldPlan;
export declare function scaffold(choices: UserChoices): Promise<void>;
export declare function printSummary(choices: UserChoices): void;
//# sourceMappingURL=scaffold.d.ts.map