import { visit } from "./cru.js";
export const print = visit({
    mod: () => `<module>`,
    app: () => `<application>`,
    abs: () => `<function>`,
    var: () => `<variable>`,
    acs: () => `<access>`,
    lit: ([, c]) => Array.isArray(c) ? `[${c.map(print).join(', ')}]` :
        c === null ? `null` :
            typeof c === "object" ? `{ ${Object.keys(c).map(k => `${k}: ${print(c[k])}`).join(', ')} }` :
                typeof c === "undefined" ? "undefined" :
                    JSON.stringify(c),
    shr: () => `<shared>`,
    lst: () => `<list>`,
    rec: () => `<record>`
});
export const print_value = e => typeof e === "function" ? "<function>" :
    Array.isArray(e) ? `[${e.map(print).join(', ')}]` :
        e === null ? `null` :
            typeof e === "object" ? `{ ${Object.keys(e).map(k => `${e}: ${print(e[k])}`).join(', ')} }` :
                typeof e === "undefined" ? "undefined" :
                    JSON.stringify(e);
//# sourceMappingURL=print.js.map