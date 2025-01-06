/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { typescriptVersion as tsversion } from './lib/typescriptServicesMetadata'; // do not import the whole typescriptServices here
import { languages, Emitter } from '../../fillers/monaco-editor-core';
//#region enums copied from typescript to prevent loading the entire typescriptServices ---
export var ModuleKind;
(function (ModuleKind) {
    ModuleKind[ModuleKind["None"] = 0] = "None";
    ModuleKind[ModuleKind["CommonJS"] = 1] = "CommonJS";
    ModuleKind[ModuleKind["AMD"] = 2] = "AMD";
    ModuleKind[ModuleKind["UMD"] = 3] = "UMD";
    ModuleKind[ModuleKind["System"] = 4] = "System";
    ModuleKind[ModuleKind["ES2015"] = 5] = "ES2015";
    ModuleKind[ModuleKind["ESNext"] = 99] = "ESNext";
})(ModuleKind || (ModuleKind = {}));
export var JsxEmit;
(function (JsxEmit) {
    JsxEmit[JsxEmit["None"] = 0] = "None";
    JsxEmit[JsxEmit["Preserve"] = 1] = "Preserve";
    JsxEmit[JsxEmit["React"] = 2] = "React";
    JsxEmit[JsxEmit["ReactNative"] = 3] = "ReactNative";
    JsxEmit[JsxEmit["ReactJSX"] = 4] = "ReactJSX";
    JsxEmit[JsxEmit["ReactJSXDev"] = 5] = "ReactJSXDev";
})(JsxEmit || (JsxEmit = {}));
export var NewLineKind;
(function (NewLineKind) {
    NewLineKind[NewLineKind["CarriageReturnLineFeed"] = 0] = "CarriageReturnLineFeed";
    NewLineKind[NewLineKind["LineFeed"] = 1] = "LineFeed";
})(NewLineKind || (NewLineKind = {}));
export var ScriptTarget;
(function (ScriptTarget) {
    ScriptTarget[ScriptTarget["ES3"] = 0] = "ES3";
    ScriptTarget[ScriptTarget["ES5"] = 1] = "ES5";
    ScriptTarget[ScriptTarget["ES2015"] = 2] = "ES2015";
    ScriptTarget[ScriptTarget["ES2016"] = 3] = "ES2016";
    ScriptTarget[ScriptTarget["ES2017"] = 4] = "ES2017";
    ScriptTarget[ScriptTarget["ES2018"] = 5] = "ES2018";
    ScriptTarget[ScriptTarget["ES2019"] = 6] = "ES2019";
    ScriptTarget[ScriptTarget["ES2020"] = 7] = "ES2020";
    ScriptTarget[ScriptTarget["ESNext"] = 99] = "ESNext";
    ScriptTarget[ScriptTarget["JSON"] = 100] = "JSON";
    ScriptTarget[ScriptTarget["Latest"] = 99] = "Latest";
})(ScriptTarget || (ScriptTarget = {}));
export var ModuleResolutionKind;
(function (ModuleResolutionKind) {
    ModuleResolutionKind[ModuleResolutionKind["Classic"] = 1] = "Classic";
    ModuleResolutionKind[ModuleResolutionKind["NodeJs"] = 2] = "NodeJs";
})(ModuleResolutionKind || (ModuleResolutionKind = {}));
// --- TypeScript configuration and defaults ---------
class LanguageServiceDefaultsImpl {
    _onDidChange = new Emitter();
    _onDidExtraLibsChange = new Emitter();
    _extraLibs;
    _removedExtraLibs;
    _eagerModelSync;
    _compilerOptions;
    _diagnosticsOptions;
    _workerOptions;
    _onDidExtraLibsChangeTimeout;
    _inlayHintsOptions;
    _modeConfiguration;
    constructor(compilerOptions, diagnosticsOptions, workerOptions, inlayHintsOptions, modeConfiguration) {
        this._extraLibs = Object.create(null);
        this._removedExtraLibs = Object.create(null);
        this._eagerModelSync = false;
        this.setCompilerOptions(compilerOptions);
        this.setDiagnosticsOptions(diagnosticsOptions);
        this.setWorkerOptions(workerOptions);
        this.setInlayHintsOptions(inlayHintsOptions);
        this.setModeConfiguration(modeConfiguration);
        this._onDidExtraLibsChangeTimeout = -1;
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    get onDidExtraLibsChange() {
        return this._onDidExtraLibsChange.event;
    }
    get modeConfiguration() {
        return this._modeConfiguration;
    }
    get workerOptions() {
        return this._workerOptions;
    }
    get inlayHintsOptions() {
        return this._inlayHintsOptions;
    }
    getExtraLibs() {
        return this._extraLibs;
    }
    addExtraLib(content, _filePath) {
        let filePath;
        if (typeof _filePath === 'undefined') {
            filePath = `ts:extralib-${Math.random().toString(36).substring(2, 15)}`;
        }
        else {
            filePath = _filePath;
        }
        if (this._extraLibs[filePath] && this._extraLibs[filePath].content === content) {
            // no-op, there already exists an extra lib with this content
            return {
                dispose: () => { }
            };
        }
        let myVersion = 1;
        if (this._removedExtraLibs[filePath]) {
            myVersion = this._removedExtraLibs[filePath] + 1;
        }
        if (this._extraLibs[filePath]) {
            myVersion = this._extraLibs[filePath].version + 1;
        }
        this._extraLibs[filePath] = {
            content: content,
            version: myVersion
        };
        this._fireOnDidExtraLibsChangeSoon();
        return {
            dispose: () => {
                let extraLib = this._extraLibs[filePath];
                if (!extraLib) {
                    return;
                }
                if (extraLib.version !== myVersion) {
                    return;
                }
                delete this._extraLibs[filePath];
                this._removedExtraLibs[filePath] = myVersion;
                this._fireOnDidExtraLibsChangeSoon();
            }
        };
    }
    setExtraLibs(libs) {
        for (const filePath in this._extraLibs) {
            this._removedExtraLibs[filePath] = this._extraLibs[filePath].version;
        }
        // clear out everything
        this._extraLibs = Object.create(null);
        if (libs && libs.length > 0) {
            for (const lib of libs) {
                const filePath = lib.filePath || `ts:extralib-${Math.random().toString(36).substring(2, 15)}`;
                const content = lib.content;
                let myVersion = 1;
                if (this._removedExtraLibs[filePath]) {
                    myVersion = this._removedExtraLibs[filePath] + 1;
                }
                this._extraLibs[filePath] = {
                    content: content,
                    version: myVersion
                };
            }
        }
        this._fireOnDidExtraLibsChangeSoon();
    }
    _fireOnDidExtraLibsChangeSoon() {
        if (this._onDidExtraLibsChangeTimeout !== -1) {
            // already scheduled
            return;
        }
        this._onDidExtraLibsChangeTimeout = window.setTimeout(() => {
            this._onDidExtraLibsChangeTimeout = -1;
            this._onDidExtraLibsChange.fire(undefined);
        }, 0);
    }
    getCompilerOptions() {
        return this._compilerOptions;
    }
    setCompilerOptions(options) {
        this._compilerOptions = options || Object.create(null);
        this._onDidChange.fire(undefined);
    }
    getDiagnosticsOptions() {
        return this._diagnosticsOptions;
    }
    setDiagnosticsOptions(options) {
        this._diagnosticsOptions = options || Object.create(null);
        this._onDidChange.fire(undefined);
    }
    setWorkerOptions(options) {
        this._workerOptions = options || Object.create(null);
        this._onDidChange.fire(undefined);
    }
    setInlayHintsOptions(options) {
        this._inlayHintsOptions = options || Object.create(null);
        this._onDidChange.fire(undefined);
    }
    setMaximumWorkerIdleTime(value) { }
    setEagerModelSync(value) {
        // doesn't fire an event since no
        // worker restart is required here
        this._eagerModelSync = value;
    }
    getEagerModelSync() {
        return this._eagerModelSync;
    }
    setModeConfiguration(modeConfiguration) {
        this._modeConfiguration = modeConfiguration || Object.create(null);
        this._onDidChange.fire(undefined);
    }
}
export const typescriptVersion = tsversion;
const modeConfigurationDefault = {
    completionItems: true,
    hovers: true,
    documentSymbols: true,
    definitions: true,
    references: true,
    documentHighlights: true,
    rename: true,
    diagnostics: true,
    documentRangeFormattingEdits: true,
    signatureHelp: true,
    onTypeFormattingEdits: true,
    codeActions: true,
    inlayHints: true
};
export const typescriptDefaults = new LanguageServiceDefaultsImpl({ allowNonTsExtensions: true, target: ScriptTarget.Latest }, { noSemanticValidation: false, noSyntaxValidation: false, onlyVisible: false }, {}, {}, modeConfigurationDefault);
export const javascriptDefaults = new LanguageServiceDefaultsImpl({ allowNonTsExtensions: true, allowJs: true, target: ScriptTarget.Latest }, { noSemanticValidation: true, noSyntaxValidation: false, onlyVisible: false }, {}, {}, modeConfigurationDefault);
export const getTypeScriptWorker = () => {
    return getMode().then((mode) => mode.getTypeScriptWorker());
};
export const getJavaScriptWorker = () => {
    return getMode().then((mode) => mode.getJavaScriptWorker());
};
// export to the global based API
languages.typescript = {
    ModuleKind,
    JsxEmit,
    NewLineKind,
    ScriptTarget,
    ModuleResolutionKind,
    typescriptVersion,
    typescriptDefaults,
    javascriptDefaults,
    getTypeScriptWorker,
    getJavaScriptWorker
};
function getMode() {
    if (AMD) {
        return new Promise((resolve, reject) => {
            require(['vs/language/typescript/tsMode'], resolve, reject);
        });
    }
    else {
        return import('./tsMode');
    }
}
languages.onLanguage('typescript', () => {
    return getMode().then((mode) => mode.setupTypeScript(typescriptDefaults));
});
languages.onLanguage('javascript', () => {
    return getMode().then((mode) => mode.setupJavaScript(javascriptDefaults));
});
//# sourceMappingURL=monaco.contribution.js.map