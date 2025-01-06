/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { languages, Emitter } from '../../fillers/monaco-editor-core';
// --- CSS configuration and defaults ---------
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
    get modeConfiguration() {
        return this._modeConfiguration;
    }
    get diagnosticsOptions() {
        return this.options;
    }
    get options() {
        return this._options;
    }
    setOptions(options) {
        this._options = options || Object.create(null);
        this._onDidChange.fire(this);
    }
    setDiagnosticsOptions(options) {
        this.setOptions(options);
    }
    setModeConfiguration(modeConfiguration) {
        this._modeConfiguration = modeConfiguration || Object.create(null);
        this._onDidChange.fire(this);
    }
}
const optionsDefault = {
    validate: true,
    lint: {
        compatibleVendorPrefixes: 'ignore',
        vendorPrefix: 'warning',
        duplicateProperties: 'warning',
        emptyRules: 'warning',
        importStatement: 'ignore',
        boxModel: 'ignore',
        universalSelector: 'ignore',
        zeroUnits: 'ignore',
        fontFaceProperties: 'warning',
        hexColorLength: 'error',
        argumentsInColorFunction: 'error',
        unknownProperties: 'warning',
        ieHack: 'ignore',
        unknownVendorSpecificProperties: 'ignore',
        propertyIgnoredDueToDisplay: 'warning',
        important: 'ignore',
        float: 'ignore',
        idSelector: 'ignore'
    },
    data: { useDefaultDataProvider: true },
    format: {
        newlineBetweenSelectors: true,
        newlineBetweenRules: true,
        spaceAroundSelectorSeparator: false,
        braceStyle: 'collapse',
        maxPreserveNewLines: undefined,
        preserveNewLines: true
    }
};
const modeConfigurationDefault = {
    completionItems: true,
    hovers: true,
    documentSymbols: true,
    definitions: true,
    references: true,
    documentHighlights: true,
    rename: true,
    colors: true,
    foldingRanges: true,
    diagnostics: true,
    selectionRanges: true,
    documentFormattingEdits: true,
    documentRangeFormattingEdits: true
};
export const cssDefaults = new LanguageServiceDefaultsImpl('css', optionsDefault, modeConfigurationDefault);
export const scssDefaults = new LanguageServiceDefaultsImpl('scss', optionsDefault, modeConfigurationDefault);
export const lessDefaults = new LanguageServiceDefaultsImpl('less', optionsDefault, modeConfigurationDefault);
// export to the global based API
languages.css = { cssDefaults, lessDefaults, scssDefaults };
function getMode() {
    if (AMD) {
        return new Promise((resolve, reject) => {
            require(['vs/language/css/cssMode'], resolve, reject);
        });
    }
    else {
        return import('./cssMode');
    }
}
languages.onLanguage('less', () => {
    getMode().then((mode) => mode.setupMode(lessDefaults));
});
languages.onLanguage('scss', () => {
    getMode().then((mode) => mode.setupMode(scssDefaults));
});
languages.onLanguage('css', () => {
    getMode().then((mode) => mode.setupMode(cssDefaults));
});
//# sourceMappingURL=monaco.contribution.js.map