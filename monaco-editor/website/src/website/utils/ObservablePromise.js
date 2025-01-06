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
import { observable } from "mobx";
export class ObservablePromise {
    promise;
    _error;
    _value;
    _resolved;
    get error() {
        return this._error;
    }
    get value() {
        return this._value;
    }
    get resolved() {
        return this._resolved;
    }
    constructor(promise) {
        this.promise = promise;
        this._value = null;
        this._error = null;
        this._resolved = false;
        this.promise.then((value) => {
            this._value = value;
            this._resolved = true;
        }, (error) => {
            this._error = error;
            this._resolved = true;
        });
    }
}
__decorate([
    observable.ref
], ObservablePromise.prototype, "_error", void 0);
__decorate([
    observable.ref
], ObservablePromise.prototype, "_value", void 0);
__decorate([
    observable.ref
], ObservablePromise.prototype, "_resolved", void 0);
//# sourceMappingURL=ObservablePromise.js.map