/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Emitter, languages } from '../../fillers/monaco-editor-core';
class LanguageServiceDefaultsImpl {
    _onDidChange = new Emitter();
    _diagnosticsOptions;
    _modeConfiguration;
    _languageId;
    constructor(languageId, diagnosticsOptions, modeConfiguration) {
        this._languageId = languageId;
        this.setDiagnosticsOptions(diagnosticsOptions);
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
        return this._diagnosticsOptions;
    }
    setDiagnosticsOptions(options) {
        this._diagnosticsOptions = options || Object.create(null);
        this._onDidChange.fire(this);
    }
    setModeConfiguration(modeConfiguration) {
        this._modeConfiguration = modeConfiguration || Object.create(null);
        this._onDidChange.fire(this);
    }
}
const diagnosticDefault = {
    validate: true,
    allowComments: true,
    schemas: [],
    enableSchemaRequest: false,
    schemaRequest: 'warning',
    schemaValidation: 'warning',
    comments: 'error',
    trailingCommas: 'error'
};
const modeConfigurationDefault = {
    documentFormattingEdits: true,
    documentRangeFormattingEdits: true,
    completionItems: true,
    hovers: true,
    documentSymbols: true,
    tokens: true,
    colors: true,
    foldingRanges: true,
    diagnostics: true,
    selectionRanges: true
};
export const jsonDefaults = new LanguageServiceDefaultsImpl('json', diagnosticDefault, modeConfigurationDefault);
export const getWorker = () => getMode().then((mode) => mode.getWorker());
// export to the global based API
languages.json = { jsonDefaults, getWorker };
function getMode() {
    if (AMD) {
        return new Promise((resolve, reject) => {
            require(['vs/language/json/jsonMode'], resolve, reject);
        });
    }
    else {
        return import('./jsonMode');
    }
}
languages.register({
    id: 'json',
    extensions: ['.json', '.bowerrc', '.jshintrc', '.jscsrc', '.eslintrc', '.babelrc', '.har'],
    aliases: ['JSON', 'json'],
    mimetypes: ['application/json']
});
languages.onLanguage('json', () => {
    getMode().then((mode) => mode.setupMode(jsonDefaults));
});
//# sourceMappingURL=monaco.contribution.js.map