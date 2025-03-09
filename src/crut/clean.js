import { type_vars } from "./free_vars.js";
export const clean = (given, vars, b) => {
    const o = { less: {}, greater: {} };
    for (const k in given.less) {
        if (type_vars(given.less[k], b).some(v => vars.some(x => x[0] === v[0] && x[1] === v[1])))
            continue;
        o.less[k] = given.less[k];
    }
    for (const k in given.greater) {
        if (type_vars(given.greater[k], !b).some(v => vars.some(x => x[0] === v[0] && x[1] === v[1])))
            continue;
        o.greater[k] = given.greater[k];
    }
    return o;
};
//# sourceMappingURL=clean.js.map