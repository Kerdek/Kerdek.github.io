import { spawn } from 'child_process';
import { mkdir, writeFile } from 'fs/promises';
export async function run(command, options) {
    console.log(`Running ${command} in ${options.cwd}`);
    const process = spawn(command, { shell: true, cwd: options.cwd, stdio: 'inherit' });
    return new Promise((resolve, reject) => {
        process.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Command ${command} exited with code ${code}`));
            }
            else {
                resolve();
            }
        });
    });
}
export async function runGetOutput(command, options) {
    console.log(`Running ${command} in ${options.cwd}`);
    return new Promise((resolve, reject) => {
        const process = spawn(command, { shell: true, cwd: options.cwd, stdio: 'pipe' });
        let output = '';
        process.stdout.on('data', (data) => {
            output += data;
        });
        process.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Command ${command} exited with code ${code}`));
            }
            else {
                resolve(output);
            }
        });
    });
}
export async function gitCommitId(repositoryPath) {
    const commitId = (await runGetOutput('git rev-parse HEAD', { cwd: repositoryPath })).trim();
    return commitId;
}
export async function gitShallowClone(targetPath, repositoryUrl, ref) {
    await mkdir(targetPath, { recursive: true });
    const options = { cwd: targetPath };
    await run('git init', options);
    await run(`git remote add origin ${repositoryUrl}`, options);
    await run(`git fetch --depth 1 origin ${ref}`, options);
    await run(`git checkout ${ref}`, options);
    const commitId = await gitCommitId(targetPath);
    return { commitId };
}
export async function group(name, body) {
    console.log(`##[group]${name}`);
    try {
        await body();
    }
    catch (e) {
        console.error(e);
        throw e;
    }
    finally {
        console.log('##[endgroup]');
    }
}
export async function writeJsonFile(filePath, jsonData) {
    await writeFile(filePath, JSON.stringify(jsonData, null, '\t') + '\n');
}
export function getNightlyVersion(version, prerelease) {
    const pieces = version.split('.');
    const minor = parseInt(pieces[1], 10);
    const date = new Date();
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    prerelease = prerelease.replace('${today}', `${yyyy}${mm}${dd}`);
    return `0.${minor + 1}.0-${prerelease}`;
}
//# sourceMappingURL=index.js.map