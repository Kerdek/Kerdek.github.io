var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { action, observable } from "mobx";
import { monacoEditorVersion } from "../../monacoEditorVersion";
import { LzmaCompressor } from "../../utils/lzmaCompressor";
import { HistoryController, } from "../../utils/ObservableHistory";
import { debouncedComputed, Disposable } from "../../utils/utils";
import { getPlaygroundExamples } from "./playgroundExamples";
import { Source } from "./Source";
import { projectEquals } from "./utils";
export class LocationModel {
    model;
    dispose = Disposable.fn();
    compressor = new LzmaCompressor();
    cachedState = undefined;
    _sourceOverride;
    get sourceOverride() {
        return this._sourceOverride;
    }
    _compareWith;
    get compareWith() {
        return this._compareWith;
    }
    /**
     * This is used to control replace/push state.
     * Replace is used if the history id does not change.
     */
    historyId = 0;
    constructor(model, createHistoryController = true) {
        this.model = model;
        if (createHistoryController) {
            this.dispose.track(new HistoryController((initialLocation) => {
                this.updateLocation(initialLocation);
                return this;
            }));
        }
    }
    get location() {
        const source = this._sourceOverride || this.sourceFromSettings;
        return {
            hashValue: this.computedHashValue.value || this.cachedState?.hash,
            searchParams: {
                source: source?.sourceToString(),
                sourceLanguages: source?.sourceLanguagesToString(),
                compareWith: this._compareWith?.sourceToString(),
            },
        };
    }
    updateLocation(currentLocation) {
        const hashValue = currentLocation.hashValue;
        const sourceStr = currentLocation.searchParams.source;
        const sourceLanguages = currentLocation.searchParams.sourceLanguages;
        const source = sourceStr || sourceLanguages
            ? Source.parse(sourceStr, sourceLanguages)
            : undefined;
        if (this.sourceFromSettings?.equals(source)) {
            this._sourceOverride = undefined;
        }
        else {
            this._sourceOverride = source;
        }
        const compareWithStr = currentLocation.searchParams.compareWith;
        const compareWith = compareWithStr
            ? Source.parse(compareWithStr, undefined)
            : undefined;
        this._compareWith = compareWith;
        function findExample(hashValue) {
            if (hashValue.startsWith("example-")) {
                hashValue = hashValue.substring("example-".length);
            }
            return getPlaygroundExamples()
                .flatMap((e) => e.examples)
                .find((e) => e.id === hashValue);
        }
        let example;
        if (!hashValue) {
            this.model.selectedExample = getPlaygroundExamples()[0].examples[0];
        }
        else if ((example = findExample(hashValue))) {
            this.model.selectedExample = example;
        }
        else {
            let p = undefined;
            if (this.cachedState?.hash === hashValue) {
                p = this.cachedState.state;
            }
            if (!p) {
                try {
                    p =
                        this.compressor.decodeData(hashValue);
                }
                catch (e) {
                    console.log("Could not deserialize from hash value", e);
                }
            }
            if (p) {
                this.cachedState = { state: p, hash: hashValue };
                this.model.setState(p);
            }
        }
    }
    computedHashValue = debouncedComputed(500, () => ({
        state: this.model.playgroundProject,
        selectedExampleProject: this.model.selectedExampleProject,
    }), ({ state, selectedExampleProject }) => {
        if (selectedExampleProject &&
            projectEquals(state, selectedExampleProject.project)) {
            return "example-" + selectedExampleProject.example.id;
        }
        if (this.cachedState &&
            projectEquals(this.cachedState.state, state)) {
            return this.cachedState.hash;
        }
        return this.compressor.encodeData(state);
    });
    get sourceFromSettings() {
        const settings = this.model.settings.settings;
        if (settings.monacoSource === "npm") {
            return new Source(settings.npmVersion, undefined, undefined);
        }
        else if (settings.monacoSource === "independent" &&
            ((settings.coreSource === "url" &&
                (settings.languagesSource === "latest" ||
                    settings.languagesSource === "url")) ||
                (settings.coreSource === "latest" &&
                    settings.languagesSource === "url"))) {
            return new Source(undefined, settings.coreSource === "url" ? settings.coreUrl : undefined, settings.languagesSource === "latest"
                ? undefined
                : settings.languagesUrl);
        }
        else if (settings.monacoSource === "latest") {
            return new Source(monacoEditorVersion, undefined, undefined);
        }
        return undefined;
    }
    exitCompare() {
        this._compareWith = undefined;
        this.historyId++;
    }
    disableSourceOverride() {
        this._sourceOverride = undefined;
        this.historyId++;
    }
    compareWithLatestDev() {
        this._compareWith = Source.useLatestDev();
        this.historyId++;
    }
    saveCompareWith() {
        if (this._compareWith) {
            this.model.settings.setSettings({
                ...this.model.settings.settings,
                ...this._compareWith.toPartialSettings(),
            });
            this.historyId++;
            this._compareWith = undefined;
            this._sourceOverride = undefined;
        }
    }
    saveSourceOverride() {
        if (this._sourceOverride) {
            this.model.settings.setSettings({
                ...this.model.settings.settings,
                ...this._sourceOverride.toPartialSettings(),
            });
            this.historyId++;
            this._sourceOverride = undefined;
        }
    }
}
__decorate([
    observable
], LocationModel.prototype, "_sourceOverride", void 0);
__decorate([
    observable
], LocationModel.prototype, "_compareWith", void 0);
__decorate([
    observable
], LocationModel.prototype, "historyId", void 0);
__decorate([
    action
], LocationModel.prototype, "updateLocation", null);
__decorate([
    action
], LocationModel.prototype, "exitCompare", null);
__decorate([
    action
], LocationModel.prototype, "disableSourceOverride", null);
__decorate([
    action
], LocationModel.prototype, "compareWithLatestDev", null);
__decorate([
    action
], LocationModel.prototype, "saveCompareWith", null);
__decorate([
    action
], LocationModel.prototype, "saveSourceOverride", null);
//# sourceMappingURL=LocationModel.js.map