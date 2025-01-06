/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as ts from './lib/typescriptServices';
import { libFileMap } from './lib/lib';
/**
 * Loading a default lib as a source file will mess up TS completely.
 * So our strategy is to hide such a text model from TS.
 * See https://github.com/microsoft/monaco-editor/issues/2182
 */
function fileNameIsLib(resource) {
    if (typeof resource === 'string') {
        if (/^file:\/\/\//.test(resource)) {
            return !!libFileMap[resource.substr(8)];
        }
        return false;
    }
    if (resource.path.indexOf('/lib.') === 0) {
        return !!libFileMap[resource.path.slice(1)];
    }
    return false;
}
export class TypeScriptWorker {
    // --- model sync -----------------------
    _ctx;
    _extraLibs = Object.create(null);
    _languageService = ts.createLanguageService(this);
    _compilerOptions;
    _inlayHintsOptions;
    constructor(ctx, createData) {
        this._ctx = ctx;
        this._compilerOptions = createData.compilerOptions;
        this._extraLibs = createData.extraLibs;
        this._inlayHintsOptions = createData.inlayHintsOptions;
    }
    // --- language service host ---------------
    getCompilationSettings() {
        return this._compilerOptions;
    }
    getLanguageService() {
        return this._languageService;
    }
    getExtraLibs() {
        return this._extraLibs;
    }
    getScriptFileNames() {
        const allModels = this._ctx.getMirrorModels().map((model) => model.uri);
        const models = allModels.filter((uri) => !fileNameIsLib(uri)).map((uri) => uri.toString());
        return models.concat(Object.keys(this._extraLibs));
    }
    _getModel(fileName) {
        let models = this._ctx.getMirrorModels();
        for (let i = 0; i < models.length; i++) {
            const uri = models[i].uri;
            if (uri.toString() === fileName || uri.toString(true) === fileName) {
                return models[i];
            }
        }
        return null;
    }
    getScriptVersion(fileName) {
        let model = this._getModel(fileName);
        if (model) {
            return model.version.toString();
        }
        else if (this.isDefaultLibFileName(fileName)) {
            // default lib is static
            return '1';
        }
        else if (fileName in this._extraLibs) {
            return String(this._extraLibs[fileName].version);
        }
        return '';
    }
    async getScriptText(fileName) {
        return this._getScriptText(fileName);
    }
    _getScriptText(fileName) {
        let text;
        let model = this._getModel(fileName);
        const libizedFileName = 'lib.' + fileName + '.d.ts';
        if (model) {
            // a true editor model
            text = model.getValue();
        }
        else if (fileName in libFileMap) {
            text = libFileMap[fileName];
        }
        else if (libizedFileName in libFileMap) {
            text = libFileMap[libizedFileName];
        }
        else if (fileName in this._extraLibs) {
            // extra lib
            text = this._extraLibs[fileName].content;
        }
        else {
            return;
        }
        return text;
    }
    getScriptSnapshot(fileName) {
        const text = this._getScriptText(fileName);
        if (text === undefined) {
            return;
        }
        return {
            getText: (start, end) => text.substring(start, end),
            getLength: () => text.length,
            getChangeRange: () => undefined
        };
    }
    getScriptKind(fileName) {
        const suffix = fileName.substr(fileName.lastIndexOf('.') + 1);
        switch (suffix) {
            case 'ts':
                return ts.ScriptKind.TS;
            case 'tsx':
                return ts.ScriptKind.TSX;
            case 'js':
                return ts.ScriptKind.JS;
            case 'jsx':
                return ts.ScriptKind.JSX;
            default:
                return this.getCompilationSettings().allowJs ? ts.ScriptKind.JS : ts.ScriptKind.TS;
        }
    }
    getCurrentDirectory() {
        return '';
    }
    getDefaultLibFileName(options) {
        switch (options.target) {
            case 99 /* ESNext */:
                const esnext = 'lib.esnext.full.d.ts';
                if (esnext in libFileMap || esnext in this._extraLibs)
                    return esnext;
            case 7 /* ES2020 */:
            case 6 /* ES2019 */:
            case 5 /* ES2018 */:
            case 4 /* ES2017 */:
            case 3 /* ES2016 */:
            case 2 /* ES2015 */:
            default:
                // Support a dynamic lookup for the ES20XX version based on the target
                // which is safe unless TC39 changes their numbering system
                const eslib = `lib.es${2013 + (options.target || 99)}.full.d.ts`;
                // Note: This also looks in _extraLibs, If you want
                // to add support for additional target options, you will need to
                // add the extra dts files to _extraLibs via the API.
                if (eslib in libFileMap || eslib in this._extraLibs) {
                    return eslib;
                }
                return 'lib.es6.d.ts'; // We don't use lib.es2015.full.d.ts due to breaking change.
            case 1:
            case 0:
                return 'lib.d.ts';
        }
    }
    isDefaultLibFileName(fileName) {
        return fileName === this.getDefaultLibFileName(this._compilerOptions);
    }
    readFile(path) {
        return this._getScriptText(path);
    }
    fileExists(path) {
        return this._getScriptText(path) !== undefined;
    }
    async getLibFiles() {
        return libFileMap;
    }
    // --- language features
    static clearFiles(tsDiagnostics) {
        // Clear the `file` field, which cannot be JSON'yfied because it
        // contains cyclic data structures, except for the `fileName`
        // property.
        // Do a deep clone so we don't mutate the ts.Diagnostic object (see https://github.com/microsoft/monaco-editor/issues/2392)
        const diagnostics = [];
        for (const tsDiagnostic of tsDiagnostics) {
            const diagnostic = { ...tsDiagnostic };
            diagnostic.file = diagnostic.file ? { fileName: diagnostic.file.fileName } : undefined;
            if (tsDiagnostic.relatedInformation) {
                diagnostic.relatedInformation = [];
                for (const tsRelatedDiagnostic of tsDiagnostic.relatedInformation) {
                    const relatedDiagnostic = { ...tsRelatedDiagnostic };
                    relatedDiagnostic.file = relatedDiagnostic.file
                        ? { fileName: relatedDiagnostic.file.fileName }
                        : undefined;
                    diagnostic.relatedInformation.push(relatedDiagnostic);
                }
            }
            diagnostics.push(diagnostic);
        }
        return diagnostics;
    }
    async getSyntacticDiagnostics(fileName) {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        const diagnostics = this._languageService.getSyntacticDiagnostics(fileName);
        return TypeScriptWorker.clearFiles(diagnostics);
    }
    async getSemanticDiagnostics(fileName) {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        const diagnostics = this._languageService.getSemanticDiagnostics(fileName);
        return TypeScriptWorker.clearFiles(diagnostics);
    }
    async getSuggestionDiagnostics(fileName) {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        const diagnostics = this._languageService.getSuggestionDiagnostics(fileName);
        return TypeScriptWorker.clearFiles(diagnostics);
    }
    async getCompilerOptionsDiagnostics(fileName) {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        const diagnostics = this._languageService.getCompilerOptionsDiagnostics();
        return TypeScriptWorker.clearFiles(diagnostics);
    }
    async getCompletionsAtPosition(fileName, position) {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getCompletionsAtPosition(fileName, position, undefined);
    }
    async getCompletionEntryDetails(fileName, position, entry) {
        return this._languageService.getCompletionEntryDetails(fileName, position, entry, undefined, undefined, undefined, undefined);
    }
    async getSignatureHelpItems(fileName, position, options) {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getSignatureHelpItems(fileName, position, options);
    }
    async getQuickInfoAtPosition(fileName, position) {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getQuickInfoAtPosition(fileName, position);
    }
    async getDocumentHighlights(fileName, position, filesToSearch) {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getDocumentHighlights(fileName, position, filesToSearch);
    }
    async getDefinitionAtPosition(fileName, position) {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getDefinitionAtPosition(fileName, position);
    }
    async getReferencesAtPosition(fileName, position) {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getReferencesAtPosition(fileName, position);
    }
    async getNavigationTree(fileName) {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.getNavigationTree(fileName);
    }
    async getFormattingEditsForDocument(fileName, options) {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getFormattingEditsForDocument(fileName, options);
    }
    async getFormattingEditsForRange(fileName, start, end, options) {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getFormattingEditsForRange(fileName, start, end, options);
    }
    async getFormattingEditsAfterKeystroke(fileName, postion, ch, options) {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        return this._languageService.getFormattingEditsAfterKeystroke(fileName, postion, ch, options);
    }
    async findRenameLocations(fileName, position, findInStrings, findInComments, providePrefixAndSuffixTextForRename) {
        if (fileNameIsLib(fileName)) {
            return undefined;
        }
        return this._languageService.findRenameLocations(fileName, position, findInStrings, findInComments, providePrefixAndSuffixTextForRename);
    }
    async getRenameInfo(fileName, position, options) {
        if (fileNameIsLib(fileName)) {
            return { canRename: false, localizedErrorMessage: 'Cannot rename in lib file' };
        }
        return this._languageService.getRenameInfo(fileName, position, options);
    }
    async getEmitOutput(fileName) {
        if (fileNameIsLib(fileName)) {
            return { outputFiles: [], emitSkipped: true };
        }
        return this._languageService.getEmitOutput(fileName);
    }
    async getCodeFixesAtPosition(fileName, start, end, errorCodes, formatOptions) {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        const preferences = {};
        try {
            return this._languageService.getCodeFixesAtPosition(fileName, start, end, errorCodes, formatOptions, preferences);
        }
        catch {
            return [];
        }
    }
    async updateExtraLibs(extraLibs) {
        this._extraLibs = extraLibs;
    }
    async provideInlayHints(fileName, start, end) {
        if (fileNameIsLib(fileName)) {
            return [];
        }
        const preferences = this._inlayHintsOptions ?? {};
        const span = {
            start,
            length: end - start
        };
        try {
            return this._languageService.provideInlayHints(fileName, span, preferences);
        }
        catch {
            return [];
        }
    }
}
export function create(ctx, createData) {
    let TSWorkerClass = TypeScriptWorker;
    if (createData.customWorkerPath) {
        if (typeof importScripts === 'undefined') {
            console.warn('Monaco is not using webworkers for background tasks, and that is needed to support the customWorkerPath flag');
        }
        else {
            self.importScripts(createData.customWorkerPath);
            const workerFactoryFunc = self.customTSWorkerFactory;
            if (!workerFactoryFunc) {
                throw new Error(`The script at ${createData.customWorkerPath} does not add customTSWorkerFactory to self`);
            }
            TSWorkerClass = workerFactoryFunc(TypeScriptWorker, ts, libFileMap);
        }
    }
    return new TSWorkerClass(ctx, createData);
}
/** Allows for clients to have access to the same version of TypeScript that the worker uses */
// @ts-ignore
globalThis.ts = ts.typescript;
//# sourceMappingURL=tsWorker.js.map