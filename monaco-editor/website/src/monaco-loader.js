/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export function getLoadedMonaco() {
    if (!monaco) {
        throw new Error("monaco is not loaded yet");
    }
    return monaco;
}
export function getMonaco() {
    return window.monaco;
}
let loading = false;
let resolve;
let reject;
let loadMonacoPromise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
});
export async function waitForLoadedMonaco() {
    return loadMonacoPromise;
}
export async function loadMonaco(setup = prodMonacoSetup) {
    if (!loading) {
        loading = true;
        _loadMonaco(setup).then(resolve, reject);
    }
    return loadMonacoPromise;
}
async function _loadMonaco(setup) {
    const global = self;
    if (!global.require) {
        await loadScript(setup.loaderUrl);
    }
    global.AMD = true;
    global.getCodiconPath = () => {
        return setup.codiconUrl;
    };
    /** @type {any} */
    const req = global.require;
    req.config({ paths: setup.loaderConfigPaths });
    return new Promise((res) => {
        // First load editor.main. If it inlines the plugins, we don't want to try to load them from the server.
        req(["vs/editor/editor.main"], () => {
            req([
                "vs/basic-languages/monaco.contribution",
                "vs/language/css/monaco.contribution",
                "vs/language/html/monaco.contribution",
                "vs/language/json/monaco.contribution",
                "vs/language/typescript/monaco.contribution",
            ], () => {
                res(monaco);
            });
        });
    });
}
function loadScript(path) {
    return new Promise((res) => {
        const script = document.createElement("script");
        script.onload = () => res();
        script.async = true;
        script.type = "text/javascript";
        script.src = path; // CodeQL [SM01507] This is safe because the runner (that allows for dynamic paths) runs in an isolated iframe. The hosting website uses a static path configuration. // CodeQL [SM03712] This is safe because the runner (that allows for dynamic paths) runs in an isolated iframe. The hosting website uses a static path configuration.
        document.head.appendChild(script);
    });
}
export const prodMonacoSetup = getMonacoSetup("node_modules/monaco-editor/min/vs");
export function getMonacoSetup(corePath) {
    const loaderConfigPaths = {
        vs: `${corePath}`,
    };
    return {
        loaderUrl: `${corePath}/loader.js`,
        loaderConfigPaths,
        codiconUrl: `${corePath}/base/browser/ui/codicons/codicon/codicon.ttf`,
        monacoTypesUrl: undefined,
    };
}
//# sourceMappingURL=monaco-loader.js.map