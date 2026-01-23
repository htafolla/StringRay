export declare class RefactoringLoggingProcessor {
    private logPath;
    constructor();
    private ensureLogDirectory;
    execute(context: any): Promise<{
        logged: boolean;
        success: boolean;
        message: string;
        error?: string;
    }>;
    private createLogEntry;
    private appendToLog;
}
//# sourceMappingURL=refactoring-logging-processor.d.ts.map