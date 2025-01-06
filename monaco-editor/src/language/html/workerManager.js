/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { editor } from '../../fillers/monaco-editor-core';
const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000; // 2min
export class WorkerManager {
    _defaults;
    _idleCheckInterval;
    _lastUsedTime;
    _configChangeListener;
    _worker;
    _client;
    constructor(defaults) {
        this._defaults = defaults;
        this._worker = null;
        this._client = null;
        this._idleCheckInterval = window.setInterval(() => this._checkIfIdle(), 30 * 1000);
        this._lastUsedTime = 0;
        this._configChangeListener = this._defaults.onDidChange(() => this._stopWorker());
    }
    _stopWorker() {
        if (this._worker) {
            this._worker.dispose();
            this._worker = null;
        }
        this._client = null;
    }
    dispose() {
        clearInterval(this._idleCheckInterval);
        this._configChangeListener.dispose();
        this._stopWorker();
    }
    _checkIfIdle() {
        if (!this._worker) {
            return;
        }
        let timePassedSinceLastUsed = Date.now() - this._lastUsedTime;
        if (timePassedSinceLastUsed > STOP_WHEN_IDLE_FOR) {
            this._stopWorker();
        }
    }
    _getClient() {
        this._lastUsedTime = Date.now();
        if (!this._client) {
            this._worker = editor.createWebWorker({
                // module that exports the create() method and returns a `HTMLWorker` instance
                moduleId: 'vs/language/html/htmlWorker',
                // passed in to the create() method
                createData: {
                    languageSettings: this._defaults.options,
                    languageId: this._defaults.languageId
                },
                label: this._defaults.languageId
            });
            this._client = this._worker.getProxy();
        }
        return this._client;
    }
    getLanguageServiceWorker(...resources) {
        let _client;
        return this._getClient()
            .then((client) => {
            _client = client;
        })
            .then((_) => {
            if (this._worker) {
                return this._worker.withSyncedResources(resources);
            }
        })
            .then((_) => _client);
    }
}
//# sourceMappingURL=workerManager.js.map