/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as jsonService from 'vscode-json-languageservice';
import { URI } from 'vscode-uri';
let defaultSchemaRequestService;
if (typeof fetch !== 'undefined') {
    defaultSchemaRequestService = function (url) {
        return fetch(url).then((response) => response.text());
    };
}
export class JSONWorker {
    _ctx;
    _languageService;
    _languageSettings;
    _languageId;
    constructor(ctx, createData) {
        this._ctx = ctx;
        this._languageSettings = createData.languageSettings;
        this._languageId = createData.languageId;
        this._languageService = jsonService.getLanguageService({
            workspaceContext: {
                resolveRelativePath: (relativePath, resource) => {
                    const base = resource.substr(0, resource.lastIndexOf('/') + 1);
                    return resolvePath(base, relativePath);
                }
            },
            schemaRequestService: createData.enableSchemaRequest
                ? defaultSchemaRequestService
                : undefined,
            clientCapabilities: jsonService.ClientCapabilities.LATEST
        });
        this._languageService.configure(this._languageSettings);
    }
    async doValidation(uri) {
        let document = this._getTextDocument(uri);
        if (document) {
            let jsonDocument = this._languageService.parseJSONDocument(document);
            return this._languageService.doValidation(document, jsonDocument, this._languageSettings);
        }
        return Promise.resolve([]);
    }
    async doComplete(uri, position) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return null;
        }
        let jsonDocument = this._languageService.parseJSONDocument(document);
        return this._languageService.doComplete(document, position, jsonDocument);
    }
    async doResolve(item) {
        return this._languageService.doResolve(item);
    }
    async doHover(uri, position) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return null;
        }
        let jsonDocument = this._languageService.parseJSONDocument(document);
        return this._languageService.doHover(document, position, jsonDocument);
    }
    async format(uri, range, options) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        let textEdits = this._languageService.format(document, range /* TODO */, options);
        return Promise.resolve(textEdits);
    }
    async resetSchema(uri) {
        return Promise.resolve(this._languageService.resetSchema(uri));
    }
    async findDocumentSymbols(uri) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        let jsonDocument = this._languageService.parseJSONDocument(document);
        let symbols = this._languageService.findDocumentSymbols2(document, jsonDocument);
        return Promise.resolve(symbols);
    }
    async findDocumentColors(uri) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        let jsonDocument = this._languageService.parseJSONDocument(document);
        let colorSymbols = this._languageService.findDocumentColors(document, jsonDocument);
        return Promise.resolve(colorSymbols);
    }
    async getColorPresentations(uri, color, range) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        let jsonDocument = this._languageService.parseJSONDocument(document);
        let colorPresentations = this._languageService.getColorPresentations(document, jsonDocument, color, range);
        return Promise.resolve(colorPresentations);
    }
    async getFoldingRanges(uri, context) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        let ranges = this._languageService.getFoldingRanges(document, context);
        return Promise.resolve(ranges);
    }
    async getSelectionRanges(uri, positions) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        let jsonDocument = this._languageService.parseJSONDocument(document);
        let ranges = this._languageService.getSelectionRanges(document, positions, jsonDocument);
        return Promise.resolve(ranges);
    }
    async parseJSONDocument(uri) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return null;
        }
        let jsonDocument = this._languageService.parseJSONDocument(document);
        return Promise.resolve(jsonDocument);
    }
    async getMatchingSchemas(uri) {
        let document = this._getTextDocument(uri);
        if (!document) {
            return [];
        }
        let jsonDocument = this._languageService.parseJSONDocument(document);
        return Promise.resolve(this._languageService.getMatchingSchemas(document, jsonDocument));
    }
    _getTextDocument(uri) {
        let models = this._ctx.getMirrorModels();
        for (let model of models) {
            if (model.uri.toString() === uri) {
                return jsonService.TextDocument.create(uri, this._languageId, model.version, model.getValue());
            }
        }
        return null;
    }
}
// URI path utilities, will (hopefully) move to vscode-uri
const Slash = '/'.charCodeAt(0);
const Dot = '.'.charCodeAt(0);
function isAbsolutePath(path) {
    return path.charCodeAt(0) === Slash;
}
function resolvePath(uriString, path) {
    if (isAbsolutePath(path)) {
        const uri = URI.parse(uriString);
        const parts = path.split('/');
        return uri.with({ path: normalizePath(parts) }).toString();
    }
    return joinPath(uriString, path);
}
function normalizePath(parts) {
    const newParts = [];
    for (const part of parts) {
        if (part.length === 0 || (part.length === 1 && part.charCodeAt(0) === Dot)) {
            // ignore
        }
        else if (part.length === 2 && part.charCodeAt(0) === Dot && part.charCodeAt(1) === Dot) {
            newParts.pop();
        }
        else {
            newParts.push(part);
        }
    }
    if (parts.length > 1 && parts[parts.length - 1].length === 0) {
        newParts.push('');
    }
    let res = newParts.join('/');
    if (parts[0].length === 0) {
        res = '/' + res;
    }
    return res;
}
function joinPath(uriString, ...paths) {
    const uri = URI.parse(uriString);
    const parts = uri.path.split('/');
    for (let path of paths) {
        parts.push(...path.split('/'));
    }
    return uri.with({ path: normalizePath(parts) }).toString();
}
export function create(ctx, createData) {
    return new JSONWorker(ctx, createData);
}
//# sourceMappingURL=jsonWorker.js.map