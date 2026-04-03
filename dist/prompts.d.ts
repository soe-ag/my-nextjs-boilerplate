import { PackageManager } from './utils';
export interface UserChoices {
    projectName: string;
    packageManager: PackageManager;
    shadcnBaseColor: string;
    includeConvex: boolean;
    includeVitest: boolean;
    includeRhfZod: boolean;
}
export declare function runPrompts(projectNameArg?: string): Promise<UserChoices>;
//# sourceMappingURL=prompts.d.ts.map