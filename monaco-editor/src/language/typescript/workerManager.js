/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { editor } from '../../fillers/monaco-editor-core';
export class WorkerManager {
    _modeId;
    _defaults;
    _configChangeListener;
    _updateExtraLibsToken;
    _extraLibsChangeListener;
    _worker;
    _client;
    constructor(_modeId, _defaults) {
        this._modeId = _modeId;
        this._defaults = _defaults;
        this._worker = null;
        this._client = null;
        this._configChangeListener = this._defaults.onDidChange(() => this._stopWorker());
        this._updateExtraLibsToken = 0;
        this._extraLibsChangeListener = this._defaults.onDidExtraLibsChange(() => this._updateExtraLibs());
    }
    dispose() {
        this._configChangeListener.dispose();
        this._extraLibsChangeListener.dispose();
        this._stopWorker();
    }
    _stopWorker() {
        if (this._worker) {
            this._worker.dispose();
            this._worker = null;
        }
        this._client = null;
    }
    async _updateExtraLibs() {
        if (!this._worker) {
            return;
        }
        const myToken = ++this._updateExtraLibsToken;
        const proxy = await this._worker.getProxy();
        if (this._updateExtraLibsToken !== myToken) {
            // avoid multiple calls
            return;
        }
        proxy.updateExtraLibs(this._defaults.getExtraLibs());
    }
    _getClient() {
        if (!this._client) {
            this._client = (async () => {
                this._worker = editor.createWebWorker({
                    // module that exports the create() method and returns a `TypeScriptWorker` instance
                    moduleId: 'vs/language/typescript/tsWorker',
                    label: this._modeId,
                    keepIdleModels: true,
                    // passed in to the create() method
                    createData: {
                        compilerOptions: this._defaults.getCompilerOptions(),
                        extraLibs: this._defaults.getExtraLibs(),
                        customWorkerPath: this._defaults.workerOptions.customWorkerPath,
                        inlayHintsOptions: this._defaults.inlayHintsOptions
                    }
                });
                if (this._defaults.getEagerModelSync()) {
                    return await this._worker.withSyncedResources(editor
                        .getModels()
                        .filter((model) => model.getLanguageId() === this._modeId)
                        .map((model) => model.uri));
                }
                return await this._worker.getProxy();
            })();
        }
        return this._client;
    }
    async getLanguageServiceWorker(...resources) {
        const client = await this._getClient();
        if (this._worker) {
            await this._worker.withSyncedResources(resources);
        }
        return client;
    }
}
//# sourceMappingURL=workerManager.js.map