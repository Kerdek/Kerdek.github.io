/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { languages, editor } from '../fillers/monaco-editor-core';
const languageDefinitions = {};
const lazyLanguageLoaders = {};
class LazyLanguageLoader {
    static getOrCreate(languageId) {
        if (!lazyLanguageLoaders[languageId]) {
            lazyLanguageLoaders[languageId] = new LazyLanguageLoader(languageId);
        }
        return lazyLanguageLoaders[languageId];
    }
    _languageId;
    _loadingTriggered;
    _lazyLoadPromise;
    _lazyLoadPromiseResolve;
    _lazyLoadPromiseReject;
    constructor(languageId) {
        this._languageId = languageId;
        this._loadingTriggered = false;
        this._lazyLoadPromise = new Promise((resolve, reject) => {
            this._lazyLoadPromiseResolve = resolve;
            this._lazyLoadPromiseReject = reject;
        });
    }
    load() {
        if (!this._loadingTriggered) {
            this._loadingTriggered = true;
            languageDefinitions[this._languageId].loader().then((mod) => this._lazyLoadPromiseResolve(mod), (err) => this._lazyLoadPromiseReject(err));
        }
        return this._lazyLoadPromise;
    }
}
export async function loadLanguage(languageId) {
    await LazyLanguageLoader.getOrCreate(languageId).load();
    // trigger tokenizer creation by instantiating a model
    const model = editor.createModel('', languageId);
    model.dispose();
}
export function registerLanguage(def) {
    const languageId = def.id;
    languageDefinitions[languageId] = def;
    languages.register(def);
    const lazyLanguageLoader = LazyLanguageLoader.getOrCreate(languageId);
    languages.registerTokensProviderFactory(languageId, {
        create: async () => {
            const mod = await lazyLanguageLoader.load();
            return mod.language;
        }
    });
    languages.onLanguageEncountered(languageId, async () => {
        const mod = await lazyLanguageLoader.load();
        languages.setLanguageConfiguration(languageId, mod.conf);
    });
}
//# sourceMappingURL=_.contribution.js.map