export function getNightlyEnv() {
    const env = process.env;
    if (!env.PRERELEASE_VERSION) {
        throw new Error(`Missing PRERELEASE_VERSION in process.env`);
    }
    if (!env.VSCODE_REF) {
        throw new Error(`Missing VSCODE_REF in process.env`);
    }
    return env;
}
//# sourceMappingURL=env.js.map