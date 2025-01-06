/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as cssService from 'vscode-css-languageservice';
export class CSSWorker {
    // --- model sync -----------------------
    _ctx;
    _languageService;
    _languageSettings;
    _languageId;
    constructor(ctx, createData) {
        this._ctx = ctx;
        this._languageSettings = createData.options;
        this._languageId = createData.languageId;
        const data = createData.options.data;
        const useDefaultDataProvider = data?.useDefaultDataProvider;
        const customDataProviders = [];
        if (data?.dataProviders) {
            for (const id in data.dataProviders) {
                customDataProviders.push(cssService.newCSSDataProvider(data.dataProviders[id]));
            }
        }
        const lsOptions = {
            customDataProviders,
            useDefaultDataProvider
        };
        switch (this._languageId) {
            case 'css':
                this._languageService = cssService.getCSSLanguageService(lsOptions);
                break;
            case 'less':
                this._languageService = cssService.getLESSLanguageService(lsOptions);
                break;
            case 'scss':
                this._languageService = cssService.getSCSSLanguageService(lsOptions);
                break;
            default:
                throw new Error('Invalid language id: ' + this._languageId);
        }
        this._languageService.configure(this._languageSettings);
    }
    // --- language service host ---------------
    async doValidation(uri) {
        const document = this._getTextDocument(uri);
        if (document) {
            const stylesheet = this._languageService.parseStylesheet(document);
            const diagnostics = this._languageService.doValidation(document, stylesheet);
            return Promise.resolve(diagnostics);
        }
        return Promise.resolve([]);
    }
    async doComplete(uri, position) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return null;
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const completions = this._languageService.doComplete(document, position, stylesheet);
        return Promise.resolve(completions);
    }
    async doHover(uri, position) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return null;
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const hover = this._languageService.doHover(document, position, stylesheet);
        return Promise.resolve(hover);
    }
    async findDefinition(uri, position) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return null;
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const definition = this._languageService.findDefinition(document, position, stylesheet);
        return Promise.resolve(definition);
    }
    async findReferences(uri, position) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const references = this._languageService.findReferences(document, position, stylesheet);
        return Promise.resolve(references);
    }
    async findDocumentHighlights(uri, position) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const highlights = this._languageService.findDocumentHighlights(document, position, stylesheet);
        return Promise.resolve(highlights);
    }
    async findDocumentSymbols(uri) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const symbols = this._languageService.findDocumentSymbols(document, stylesheet);
        return Promise.resolve(symbols);
    }
    async doCodeActions(uri, range, context) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const actions = this._languageService.doCodeActions(document, range, context, stylesheet);
        return Promise.resolve(actions);
    }
    async findDocumentColors(uri) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const colorSymbols = this._languageService.findDocumentColors(document, stylesheet);
        return Promise.resolve(colorSymbols);
    }
    async getColorPresentations(uri, color, range) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const colorPresentations = this._languageService.getColorPresentations(document, stylesheet, color, range);
        return Promise.resolve(colorPresentations);
    }
    async getFoldingRanges(uri, context) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        const ranges = this._languageService.getFoldingRanges(document, context);
        return Promise.resolve(ranges);
    }
    async getSelectionRanges(uri, positions) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const ranges = this._languageService.getSelectionRanges(document, positions, stylesheet);
        return Promise.resolve(ranges);
    }
    async doRename(uri, position, newName) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return null;
        }
        const stylesheet = this._languageService.parseStylesheet(document);
        const renames = this._languageService.doRename(document, position, newName, stylesheet);
        return Promise.resolve(renames);
    }
    async format(uri, range, options) {
        const document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        const settings = { ...this._languageSettings.format, ...options };
        const textEdits = this._languageService.format(document, range /* TODO */, settings);
        return Promise.resolve(textEdits);
    }
    _getTextDocument(uri) {
        const models = this._ctx.getMirrorModels();
        for (const model of models) {
            if (model.uri.toString() === uri) {
                return cssService.TextDocument.create(uri, this._languageId, model.version, model.getValue());
            }
        }
        return null;
    }
}
export function create(ctx, createData) {
    return new CSSWorker(ctx, createData);
}
//# sourceMappingURL=cssWorker.js.map