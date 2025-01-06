/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export class Debouncer {
    debounceMs;
    timeout = undefined;
    constructor(debounceMs) {
        this.debounceMs = debounceMs;
    }
    run(action) {
        this.clear();
        this.timeout = setTimeout(action, this.debounceMs);
    }
    clear() {
        if (this.timeout !== undefined) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
    }
    dispose() {
        this.clear();
    }
}
//# sourceMappingURL=Debouncer.js.map