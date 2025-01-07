import { typ_cnj, typ_dsj } from "./graph.js";
import { print_inequalities } from "./print.js";
import { substitute } from "./substitute.js";
export const empty_inequalities = () => ({ less: {}, greater: {} });
export const apply_inequalities = (l, r) => {
    const o = { less: {}, greater: {} };
    for (const k in l.less) {
        o.less[k] = substitute(r, l.less[k], true);
    }
    for (const k in l.greater) {
        o.greater[k] = substitute(r, l.greater[k], false);
    }
    console.log(`Applied \`${print_inequalities(r)}\` to \`${print_inequalities(l)}\` to get \`${print_inequalities(o)}\`.`);
    return o;
};
export const conjoin_inequalities = (l, r) => {
    const o = { less: { ...l.less }, greater: { ...l.greater } };
    for (const k in r.less) {
        if (k in o.less) {
            o.less[k] = typ_cnj(r.less[k], o.less[k]);
        }
        else {
            o.less[k] = r.less[k];
        }
    }
    for (const k in r.greater) {
        if (k in o.greater) {
            o.greater[k] = typ_cnj(r.greater[k], o.greater[k]);
        }
        else {
            o.greater[k] = r.greater[k];
        }
    }
    return o;
};
export const disjoin_inequalities = (l, r) => {
    const o = { less: { ...l.less }, greater: { ...l.greater } };
    for (const k in r.less) {
        if (k in o.less) {
            o.less[k] = typ_dsj(r.less[k], o.less[k]);
        }
        else {
            o.less[k] = r.less[k];
        }
    }
    for (const k in r.greater) {
        if (k in o.greater) {
            o.greater[k] = typ_dsj(r.greater[k], o.greater[k]);
        }
        else {
            o.greater[k] = r.greater[k];
        }
    }
    return o;
};
//# sourceMappingURL=constraints.js.map