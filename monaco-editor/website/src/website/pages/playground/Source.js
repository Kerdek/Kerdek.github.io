import { monacoEditorVersion } from "../../monacoEditorVersion";
import { getNpmVersionsSync } from "./getNpmVersionsSync";
export class Source {
    version;
    url;
    sourceLanguagesStr;
    static useLatestDev(sourceLanguagesStr) {
        // Assume the versions are already loaded
        const versions = getNpmVersionsSync(undefined);
        const version = versions.find((v) => v.indexOf("-dev-") !== -1);
        return new Source(version, undefined, sourceLanguagesStr);
    }
    static useLatest(sourceLanguagesStr) {
        return new Source(monacoEditorVersion, undefined, sourceLanguagesStr);
    }
    static parse(sourceStr, sourceLanguagesStr) {
        if (sourceStr === "latest-dev") {
            return Source.useLatestDev(sourceLanguagesStr);
        }
        if (sourceStr === "latest") {
            return Source.useLatest(sourceLanguagesStr);
        }
        if (sourceStr && sourceStr.startsWith("v")) {
            return new Source(sourceStr.substring(1), undefined, sourceLanguagesStr);
        }
        return new Source(undefined, sourceStr, sourceLanguagesStr);
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return other.toString() === this.toString();
    }
    constructor(version, url, sourceLanguagesStr) {
        this.version = version;
        this.url = url;
        this.sourceLanguagesStr = sourceLanguagesStr;
        if (version === undefined &&
            url === undefined &&
            sourceLanguagesStr === undefined) {
            throw new Error("one parameter must be defined");
        }
    }
    sourceToString() {
        if (this.url) {
            return this.url;
        }
        if (this.version) {
            return `v${this.version}`;
        }
        return undefined;
    }
    sourceLanguagesToString() {
        return this.sourceLanguagesStr;
    }
    toString() {
        const sourceLangToStr = this.sourceLanguagesToString();
        return `${this.sourceToString()}${sourceLangToStr ? `;${sourceLangToStr}` : ""}`;
    }
    toPartialSettings() {
        const languagesSettings = {
            languagesSource: this.sourceLanguagesStr === undefined ? "latest" : "url",
            languagesUrl: this.sourceLanguagesStr,
        };
        if (this.version) {
            return {
                monacoSource: "npm",
                npmVersion: this.version,
            };
        }
        else if (this.url) {
            return {
                monacoSource: "independent",
                coreSource: "url",
                coreUrl: this.url,
                ...languagesSettings,
            };
        }
        else {
            return {
                monacoSource: "independent",
                coreSource: "latest",
                ...languagesSettings,
            };
        }
    }
}
//# sourceMappingURL=Source.js.map