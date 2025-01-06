var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { action, ObservableMap } from "mobx";
import { getNpmVersions, getNpmVersionsSync, getVsCodeCommitId, } from "./getNpmVersionsSync";
import { findLastIndex } from "./utils";
export class BisectModel {
    model;
    map = new ObservableMap();
    constructor(model) {
        this.model = model;
    }
    getState(version) {
        return this.map.get(version);
    }
    get isActive() {
        return [...this.map.values()].some((e) => e !== undefined);
    }
    reset() {
        this.map.clear();
    }
    async toggleState(version, state) {
        const currentState = this.getState(version);
        await this.setState(version, currentState === state ? undefined : state);
    }
    async setState(version, state) {
        if (state === undefined) {
            this.map.delete(version);
        }
        else {
            this.map.set(version, state);
        }
        const nextVersion = await this.getNextVersion();
        if (!nextVersion) {
            return;
        }
        this.model.settings.setSettings({
            ...this.model.settings.settings,
            npmVersion: nextVersion,
        });
    }
    get versions() {
        return getNpmVersionsSync(undefined);
    }
    get indexOfLastBadVersion() {
        return findLastIndex(this.versions, (v) => this.map.get(v) === false);
    }
    get indexOfFirstGoodVersion() {
        return this.versions.findIndex((v) => this.map.get(v) === true);
    }
    get steps() {
        const indexOfFirstGoodVersion = this.indexOfFirstGoodVersion;
        const indexOfLastBadVersion = this.indexOfLastBadVersion;
        if (indexOfFirstGoodVersion === -1 && indexOfLastBadVersion === -1) {
            return -1;
        }
        if (indexOfFirstGoodVersion === -1) {
            return Math.ceil(Math.log2(this.versions.length - indexOfLastBadVersion));
        }
        else if (indexOfLastBadVersion === -1) {
            return Math.ceil(Math.log2(indexOfFirstGoodVersion + 1));
        }
        else {
            return Math.ceil(Math.log2(indexOfFirstGoodVersion - indexOfLastBadVersion));
        }
    }
    get isFinished() {
        if (this.indexOfFirstGoodVersion !== -1 &&
            this.indexOfLastBadVersion + 1 === this.indexOfFirstGoodVersion) {
            return true;
        }
        return false;
    }
    async openGithub() {
        const versions = await getNpmVersions();
        const indexOfFirstGoodVersion = this.indexOfFirstGoodVersion === -1
            ? versions.length - 1
            : this.indexOfFirstGoodVersion;
        const indexOfLastBadVersion = this.indexOfLastBadVersion === -1 ? 0 : this.indexOfLastBadVersion;
        const goodCommitId = await getVsCodeCommitId(versions[indexOfFirstGoodVersion]);
        const badCommitId = await getVsCodeCommitId(versions[indexOfLastBadVersion]);
        window.open(`https://github.com/microsoft/vscode/compare/${goodCommitId}...${badCommitId}`, "_blank");
    }
    async getNextVersion() {
        const versions = await getNpmVersions();
        const indexOfFirstGoodVersion = this.indexOfFirstGoodVersion;
        const indexOfLastBadVersion = this.indexOfLastBadVersion;
        if (indexOfFirstGoodVersion !== -1 &&
            indexOfLastBadVersion + 1 === indexOfFirstGoodVersion) {
            // Finished
            return;
        }
        if (indexOfLastBadVersion === -1 && indexOfFirstGoodVersion === -1) {
            return versions[0];
        }
        if (indexOfLastBadVersion === -1) {
            // try first (newest) version that hasn't been tested
            const indexOfFirstUntestedVersion = versions.findIndex((v) => this.map.get(v) === undefined);
            if (indexOfFirstUntestedVersion === -1) {
                return undefined;
            }
            return versions[indexOfFirstUntestedVersion];
        }
        if (indexOfFirstGoodVersion === -1) {
            /*// exponential back off, might be good for recent regressions, but ruins step counter
            const candidate = Math.min(
                indexOfLastBadVersion * 2 + 1,
                versions.length - 1
            );*/
            const candidate = Math.floor((indexOfLastBadVersion + versions.length) / 2);
            return versions[candidate];
        }
        return versions[Math.floor((indexOfLastBadVersion + indexOfFirstGoodVersion) / 2)];
    }
}
__decorate([
    action
], BisectModel.prototype, "setState", null);
//# sourceMappingURL=BisectModel.js.map