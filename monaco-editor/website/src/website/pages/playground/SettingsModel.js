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
import { action, computed, observable, toJS } from "mobx";
import { getMonacoSetup, prodMonacoSetup, } from "../../../monaco-loader";
export class SettingsModel {
    settingsKey = "settings";
    _settings;
    get settings() {
        return this._settings;
    }
    get monacoSetup() {
        return toLoaderConfig(this.settings);
    }
    get previewFullScreen() {
        return this._settings.previewFullScreen;
    }
    set previewFullScreen(value) {
        this.setSettings({ ...this._settings, previewFullScreen: value });
    }
    get autoReload() {
        return this._settings.autoReload ?? true;
    }
    set autoReload(value) {
        this.setSettings({ ...this._settings, autoReload: value });
    }
    constructor() {
        const settingsStr = "";
        try {
            localStorage.getItem(this.settingsKey);
        }
        catch (e) {
            console.error("Failed to load settings from localStorage", e);
        }
        if (settingsStr) {
            this._settings = JSON.parse(settingsStr);
        }
        else {
            this._settings = getDefaultSettings();
        }
    }
    setSettings(settings) {
        const settingsJson = JSON.stringify(toJS(settings));
        this._settings = JSON.parse(settingsJson);
        try {
            localStorage.setItem(this.settingsKey, settingsJson);
        }
        catch (e) {
            console.error("Failed to save settings to localStorage", e);
        }
    }
}
__decorate([
    observable
], SettingsModel.prototype, "_settings", void 0);
__decorate([
    computed.struct
], SettingsModel.prototype, "monacoSetup", null);
__decorate([
    action
], SettingsModel.prototype, "setSettings", null);
export const StabilityValues = ["dev", "min"];
export function toLoaderConfig(settings) {
    switch (settings.monacoSource) {
        case "latest":
            return {
                ...getMonacoSetup(`node_modules/monaco-editor/${settings.latestStability}/vs`),
                monacoTypesUrl: "node_modules/monaco-editor/monaco.d.ts",
            };
        case "npm":
            const url = `https://cdn.jsdelivr.net/npm/monaco-editor@${settings.npmVersion}`;
            return {
                ...getMonacoSetup(`${url}/${settings.npmStability}/vs`),
                monacoTypesUrl: `${url}/monaco.d.ts`,
            };
        case "custom":
            try {
                return JSON.parse(settings.customConfig);
            }
            catch (e) {
                console.error(e);
                return prodMonacoSetup;
            }
        case "independent":
            const root = trimEnd(new URL(".", window.location.href).toString(), "/");
            let coreUrl;
            switch (settings.coreSource) {
                case "latest":
                    coreUrl = `${root}/node_modules/monaco-editor-core/${settings.latestCoreStability}/vs`;
                    break;
                case "url":
                    coreUrl = settings.coreUrl;
                    break;
            }
            let languagesUrl;
            switch (settings.languagesSource) {
                case "latest":
                    languagesUrl = `${root}/out/languages/bundled/amd-${settings.latestLanguagesStability}/vs`;
                    break;
                case "source":
                    languagesUrl = `${root}/out/languages/amd-tsc`;
                    break;
                case "url":
                    languagesUrl = settings.languagesUrl;
                    break;
            }
            const setup = { ...getMonacoSetup(coreUrl) };
            if (!setup.monacoTypesUrl &&
                setup.loaderConfigPaths["vs"] &&
                setup.loaderConfigPaths["vs"].endsWith("/out/vs")) {
                setup.monacoTypesUrl = setup.loaderConfigPaths["vs"].replace("/out/vs", () => "/src/vs/monaco.d.ts");
            }
            Object.assign(setup.loaderConfigPaths, {
                "vs/fillers/monaco-editor-core": `${root}/out/languages/amd-tsc/fillers/monaco-editor-core-amd`,
                "vs/language": `${languagesUrl}/language`,
                "vs/basic-language": `${languagesUrl}/basic-language`,
            });
            return setup;
    }
}
export function getDefaultSettings() {
    const defaultSettings = {
        monacoSource: "latest",
        latestStability: "dev",
        npmStability: "dev",
        npmVersion: "0.33.0",
        coreSource: "latest",
        latestCoreStability: "dev",
        coreUrl: "http://localhost:5001/out/vs",
        languagesSource: "latest",
        latestLanguagesStability: "dev",
        languagesUrl: "http://localhost:5002/out/languages/amd-tsc",
        customConfig: JSON.stringify({
            loaderUrl: "",
            codiconUrl: "",
            loaderPathsConfig: "",
        }),
        previewFullScreen: false,
        autoReload: true,
    };
    return defaultSettings;
}
function trimEnd(str, end) {
    if (str.endsWith(end)) {
        return str.slice(0, str.length - end.length);
    }
    return str;
}
//# sourceMappingURL=SettingsModel.js.map