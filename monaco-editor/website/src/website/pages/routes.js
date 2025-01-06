/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export class Route {
    href;
    constructor(href) {
        this.href = href;
    }
    get isActive() {
        const target = new URL(this.href, window.location.href);
        return (trimEnd(target.pathname, ".html") ===
            trimEnd(window.location.pathname, ".html"));
    }
}
function trimEnd(str, end) {
    if (str.endsWith(end)) {
        return str.substring(0, str.length - end.length);
    }
    return str;
}
export const home = new Route("./");
export const playground = new Route("./playground.html");
export const docs = new Route("./docs.html");
export const monarch = new Route("./monarch.html");
//# sourceMappingURL=routes.js.map