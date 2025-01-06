/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { languages, Emitter } from '../../fillers/monaco-editor-core';
// --- HTML configuration and defaults ---------
class LanguageServiceDefaultsImpl {
    _onDidChange = new Emitter();
    _options;
    _modeConfiguration;
    _languageId;
    constructor(languageId, options, modeConfiguration) {
        this._languageId = languageId;
        this.setOptions(options);
        this.setModeConfiguration(modeConfiguration);
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    get languageId() {
        return this._languageId;
    }
    get options() {
        return this._options;
    }
    get modeConfiguration() {
        return this._modeConfiguration;
    }
    setOptions(options) {
        this._options = options || Object.create(null);
        this._onDidChange.fire(this);
    }
    setModeConfiguration(modeConfiguration) {
        this._modeConfiguration = modeConfiguration || Object.create(null);
        this._onDidChange.fire(this);
    }
}
const formatDefaults = {
    tabSize: 4,
    insertSpaces: false,
    wrapLineLength: 120,
    unformatted: 'default": "a, abbr, acronym, b, bdo, big, br, button, cite, code, dfn, em, i, img, input, kbd, label, map, object, q, samp, select, small, span, strong, sub, sup, textarea, tt, var',
    contentUnformatted: 'pre',
    indentInnerHtml: false,
    preserveNewLines: true,
    maxPreserveNewLines: undefined,
    indentHandlebars: false,
    endWithNewline: false,
    extraLiners: 'head, body, /html',
    wrapAttributes: 'auto'
};
const optionsDefault = {
    format: formatDefaults,
    suggest: {},
    data: { useDefaultDataProvider: true }
};
function getConfigurationDefault(languageId) {
    return {
        completionItems: true,
        hovers: true,
        documentSymbols: true,
        links: true,
        documentHighlights: true,
        rename: true,
        colors: true,
        foldingRanges: true,
        selectionRanges: true,
        diagnostics: languageId === htmlLanguageId,
        documentFormattingEdits: languageId === htmlLanguageId,
        documentRangeFormattingEdits: languageId === htmlLanguageId // turned off for Razor and Handlebar
    };
}
const htmlLanguageId = 'html';
const handlebarsLanguageId = 'handlebars';
const razorLanguageId = 'razor';
export const htmlLanguageService = registerHTMLLanguageService(htmlLanguageId, optionsDefault, getConfigurationDefault(htmlLanguageId));
export const htmlDefaults = htmlLanguageService.defaults;
export const handlebarLanguageService = registerHTMLLanguageService(handlebarsLanguageId, optionsDefault, getConfigurationDefault(handlebarsLanguageId));
export const handlebarDefaults = handlebarLanguageService.defaults;
export const razorLanguageService = registerHTMLLanguageService(razorLanguageId, optionsDefault, getConfigurationDefault(razorLanguageId));
export const razorDefaults = razorLanguageService.defaults;
// export to the global based API
languages.html = {
    htmlDefaults,
    razorDefaults,
    handlebarDefaults,
    htmlLanguageService,
    handlebarLanguageService,
    razorLanguageService,
    registerHTMLLanguageService
};
function getMode() {
    if (AMD) {
        return new Promise((resolve, reject) => {
            require(['vs/language/html/htmlMode'], resolve, reject);
        });
    }
    else {
        return import('./htmlMode');
    }
}
/**
 * Registers a new HTML language service for the languageId.
 * Note: 'html', 'handlebar' and 'razor' are registered by default.
 *
 * Use this method to register additional language ids with a HTML service.
 * The language server has to be registered before an editor model is opened.
 */
export function registerHTMLLanguageService(languageId, options = optionsDefault, modeConfiguration = getConfigurationDefault(languageId)) {
    const defaults = new LanguageServiceDefaultsImpl(languageId, options, modeConfiguration);
    let mode;
    // delay the initalization of the mode until the language is accessed the first time
    const onLanguageListener = languages.onLanguage(languageId, async () => {
        mode = (await getMode()).setupMode(defaults);
    });
    return {
        defaults,
        dispose() {
            onLanguageListener.dispose();
            mode?.dispose();
            mode = undefined;
        }
    };
}
//# sourceMappingURL=monaco.contribution.js.map