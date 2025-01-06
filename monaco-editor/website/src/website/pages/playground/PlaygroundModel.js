/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { action, autorun, computed, observable, reaction, runInAction, } from "mobx";
import { waitForLoadedMonaco, } from "../../../monaco-loader";
import { Debouncer } from "../../utils/Debouncer";
import { ObservablePromise } from "../../utils/ObservablePromise";
import { Disposable } from "../../utils/utils";
import { getDefaultSettings, SettingsModel, toLoaderConfig, } from "./SettingsModel";
import { BisectModel } from "./BisectModel";
import { LocationModel } from "./LocationModel";
import { createJsonWebEditorClient, vObj, vString } from "@vscode/web-editors";
export class PlaygroundModel {
    dispose = Disposable.fn();
    settings = new SettingsModel();
    html = "";
    js = "";
    css = "";
    reloadKey = 0;
    webEditorClient = createJsonWebEditorClient(vObj({
        js: vString(),
        html: vString(),
        css: vString(),
    }), (data) => {
        runInAction(() => {
            this.html = data.html;
            this.js = data.js;
            this.css = data.css;
        });
    });
    historyModel = new LocationModel(this, this.webEditorClient === undefined);
    reload() {
        this.reloadKey++;
    }
    get previewShouldBeFullScreen() {
        return this.settings.previewFullScreen;
    }
    _wasEverNonFullScreen = false;
    get wasEverNonFullScreen() {
        if (this._wasEverNonFullScreen) {
            return true;
        }
        if (!this.settings.previewFullScreen) {
            this._wasEverNonFullScreen = true;
        }
        return this._wasEverNonFullScreen;
    }
    get monacoSetup() {
        const sourceOverride = this.historyModel.sourceOverride;
        if (sourceOverride) {
            return toLoaderConfig({
                ...getDefaultSettings(),
                ...sourceOverride.toPartialSettings(),
            });
        }
        return this.settings.monacoSetup;
    }
    get playgroundProject() {
        const project = {
            html: this.html,
            js: this.js,
            css: this.css,
        };
        return project;
    }
    get state() {
        return {
            ...this.playgroundProject,
            monacoSetup: this.monacoSetup,
            reloadKey: this.reloadKey,
        };
    }
    _previewState = undefined;
    getPreviewState = () => {
        return this._previewState;
    };
    getCompareWithPreviewState = () => {
        const previewState = this.getPreviewState();
        if (!previewState) {
            return undefined;
        }
        return {
            ...previewState,
            monacoSetup: toLoaderConfig({
                ...getDefaultSettings(),
                ...this.historyModel.compareWith.toPartialSettings(),
            }),
        };
    };
    settingsDialogModel = undefined;
    _selectedExample;
    selectedExampleProject;
    get selectedExample() {
        return this._selectedExample;
    }
    set selectedExample(value) {
        this._selectedExample = value;
        this.selectedExampleProject = undefined;
        if (value) {
            value.load().then((p) => {
                runInAction("update example", () => {
                    this.selectedExampleProject = {
                        example: value,
                        project: p,
                    };
                    this.reloadKey++;
                    this.setState(p);
                });
            });
        }
    }
    debouncer = new Debouncer(700);
    isDirty = false;
    constructor() {
        let lastState = undefined;
        this.webEditorClient?.onDidConnect.then(() => {
            autorun(() => {
                const state = this.playgroundProject;
                this.webEditorClient.updateContent({
                    js: state.js,
                    html: state.html,
                    css: state.css,
                });
            });
        });
        this.dispose.track({
            dispose: reaction(() => ({ state: this.state }), () => {
                const state = this.state;
                if (!this.settings.autoReload) {
                    if ((!lastState ||
                        JSON.stringify(state.monacoSetup) ===
                            JSON.stringify(lastState.monacoSetup)) &&
                        state.reloadKey === (lastState?.reloadKey ?? 0)) {
                        this.isDirty = true;
                        return;
                    }
                }
                const updatePreviewState = () => {
                    this.isDirty = false;
                    this._previewState = state;
                    lastState = this._previewState;
                };
                if (state.reloadKey !== lastState?.reloadKey) {
                    updatePreviewState();
                }
                else {
                    this.debouncer.run(updatePreviewState);
                }
            }, { name: "update preview", fireImmediately: true }),
        });
        const observablePromise = new ObservablePromise(waitForLoadedMonaco());
        let disposable = undefined;
        waitForLoadedMonaco().then((m) => {
            this.dispose.track(monaco.editor.addEditorAction({
                id: "reload",
                label: "Reload",
                run: (editor, ...args) => {
                    this.reload();
                },
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            }));
            const options = monaco.languages.typescript.javascriptDefaults.getCompilerOptions();
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false });
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                ...options,
                checkJs: true,
                strictNullChecks: false,
            });
        });
        this.dispose.track({
            dispose: autorun(async () => {
                const monaco = observablePromise.value;
                if (!monaco) {
                    return;
                }
                const monacoTypesUrl = this.monacoSetup.monacoTypesUrl;
                this.reloadKey; // Allow reload to reload the d.ts file.
                let content = "";
                if (monacoTypesUrl) {
                    content = await (await fetch(monacoTypesUrl)).text();
                }
                if (disposable) {
                    disposable.dispose();
                    disposable = undefined;
                }
                if (content) {
                    disposable =
                        monaco.languages.typescript.javascriptDefaults.addExtraLib(content, "ts:monaco.d.ts");
                }
            }, { name: "update types" }),
        });
    }
    setCodeString(codeStringName, value) {
        function escapeRegexpChars(str) {
            return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
        }
        const regexp = new RegExp("(\\b" +
            escapeRegexpChars(codeStringName) +
            ":[^\\w`]*`)([^`\\\\\\n]|\\n|\\\\\\\\|\\\\\\`|\\\\\\$)*`");
        const js = this.js;
        const str = value
            .replaceAll("\\", "\\\\")
            .replaceAll("$", "\\$$$$")
            .replaceAll("`", "\\`");
        const newJs = js.replace(regexp, "$1" + str + "`");
        const autoReload = this.settings.autoReload;
        this.settings.autoReload = false;
        this.js = newJs;
        this.settings.autoReload = autoReload;
    }
    showSettingsDialog() {
        this.settingsDialogModel = new SettingsDialogModel(this.settings.settings);
    }
    closeSettingsDialog(acceptChanges) {
        if (!this.settingsDialogModel) {
            return;
        }
        if (acceptChanges) {
            this.settings.setSettings(this.settingsDialogModel.settings);
        }
        this.settingsDialogModel = undefined;
    }
    setState(state) {
        this.html = state.html;
        this.js = state.js;
        this.css = state.css;
    }
    bisectModel = new BisectModel(this);
    compareWithLatestDev() {
        this.settings.previewFullScreen = true;
        this.historyModel.compareWithLatestDev();
    }
}
__decorate([
    observable
], PlaygroundModel.prototype, "html", void 0);
__decorate([
    observable
], PlaygroundModel.prototype, "js", void 0);
__decorate([
    observable
], PlaygroundModel.prototype, "css", void 0);
__decorate([
    observable
], PlaygroundModel.prototype, "reloadKey", void 0);
__decorate([
    computed.struct
], PlaygroundModel.prototype, "monacoSetup", null);
__decorate([
    computed
], PlaygroundModel.prototype, "playgroundProject", null);
__decorate([
    computed
], PlaygroundModel.prototype, "state", null);
__decorate([
    observable.ref
], PlaygroundModel.prototype, "_previewState", void 0);
__decorate([
    observable
], PlaygroundModel.prototype, "settingsDialogModel", void 0);
__decorate([
    observable.ref
], PlaygroundModel.prototype, "_selectedExample", void 0);
__decorate([
    observable.ref
], PlaygroundModel.prototype, "selectedExampleProject", void 0);
__decorate([
    observable
], PlaygroundModel.prototype, "isDirty", void 0);
__decorate([
    action
], PlaygroundModel.prototype, "setState", null);
__decorate([
    action
], PlaygroundModel.prototype, "compareWithLatestDev", null);
export class SettingsDialogModel {
    settings;
    get monacoSetupJsonString() {
        if (this.settings.monacoSource === "custom") {
            return this.settings.customConfig;
        }
        return JSON.stringify(toLoaderConfig(this.settings), undefined, 4);
    }
    constructor(settings) {
        this.settings = Object.assign({}, settings);
    }
}
__decorate([
    observable
], SettingsDialogModel.prototype, "settings", void 0);
__decorate([
    computed
], SettingsDialogModel.prototype, "monacoSetupJsonString", null);
//# sourceMappingURL=PlaygroundModel.js.map