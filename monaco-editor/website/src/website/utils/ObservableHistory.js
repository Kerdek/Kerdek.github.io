/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { autorun } from "mobx";
import { Disposable } from "./utils";
export class HistoryController {
    dispose = Disposable.fn();
    model;
    constructor(modelFactory) {
        this.model = modelFactory(getCurrentLocation());
        const updateValue = () => {
            this.model.updateLocation(getCurrentLocation());
        };
        window.addEventListener("popstate", updateValue);
        this.dispose.track({
            dispose: () => {
                window.removeEventListener("popstate", updateValue);
            },
        });
        window.addEventListener("hashchange", updateValue);
        this.dispose.track({
            dispose: () => {
                window.removeEventListener("hashchange", updateValue);
            },
        });
        this.dispose.track({
            dispose: autorun(() => {
                const value = this.model.location;
                this.setUrl(value, this.model.historyId);
            }, { name: "Update url" }),
        });
    }
    lastHistoryId = 0;
    setUrl(newLocation, historyId) {
        const url = new URL(window.location.href);
        url.hash = newLocation.hashValue ? "#" + newLocation.hashValue : "";
        const searchParams = Object.entries(newLocation.searchParams).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        url.search = new URLSearchParams(searchParams).toString();
        if (this.lastHistoryId === historyId) {
            history.replaceState("", "", url.href);
        }
        else {
            this.lastHistoryId = historyId;
            history.pushState("", "", url.href);
        }
    }
}
function getCurrentLocation() {
    const hashValue = window.location.hash.substr(1);
    const searchParams = {};
    for (const [key, value] of new URLSearchParams(window.location.search)) {
        searchParams[key] = value;
    }
    return { hashValue, searchParams };
}
//# sourceMappingURL=ObservableHistory.js.map