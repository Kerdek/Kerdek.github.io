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
import { autorun, observable } from "mobx";
import { Debouncer } from "./Debouncer";
export function debouncedComputed(debounceMs, getData, getDebouncedData) {
    return new DebouncedComputed(debounceMs, getData, getDebouncedData);
}
export class DebouncedComputed {
    debounceMs;
    getData;
    getDebouncedData;
    debouncer = new Debouncer(this.debounceMs);
    _value = undefined;
    get value() {
        return this._value;
    }
    r = autorun(() => {
        const d = this.getData();
        this.debouncer.clear();
        this.debouncer.run(() => {
            this._value = this.getDebouncedData(d);
        });
    });
    constructor(debounceMs, getData, getDebouncedData) {
        this.debounceMs = debounceMs;
        this.getData = getData;
        this.getDebouncedData = getDebouncedData;
    }
}
__decorate([
    observable
], DebouncedComputed.prototype, "_value", void 0);
export var Disposable;
(function (Disposable) {
    function fn() {
        const disposables = [];
        const fn = () => {
            disposables.forEach((d) => d.dispose());
            disposables.length = 0;
        };
        fn.track = (d) => {
            disposables.push(d);
        };
        return fn;
    }
    Disposable.fn = fn;
})(Disposable || (Disposable = {}));
//# sourceMappingURL=utils.js.map