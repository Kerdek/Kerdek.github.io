import { di } from "./di.js";
import { abs, any, cnj, dsj, ref, unk, visit_type, lit, num, str, bol, iov, rec, aka, ext } from "./graph.js";
import { homproc, jmp } from "./run.js";
export const inequality_vars = (m, b) => [
    ...map_vars(m.less, b),
    ...map_vars(m.greater, !b)
];
export const map_vars = (m, b) => Object.keys(m).map(k => type_vars(m[k], b)).flat(1);
export const subtract_vars = (l, r) => {
    const o = [];
    for (const ll of l) {
        if (r.some(rr => ll[0] === rr[0] && ll[1] === rr[1])) {
            continue;
        }
        o.push(ll);
    }
    return o;
};
export const type_vars = (t, b) => homproc((call, ret) => {
    const q = (t, k, b) => () => !k[0] ? ret([]) :
        di(k[0], i => call(s(t[i], b), dx => call(q(t, k.slice(1), b), dr => ret([...dx, ...dr]))));
    const s = (t, b) => visit_type({
        [unk]: () => ret([]),
        [any]: () => ret([]),
        [aka]: () => ret([]),
        [lit]: () => ret([]),
        [num]: () => ret([]),
        [str]: () => ret([]),
        [bol]: () => ret([]),
        [ref]: e => ret([[e.name, b]]),
        [ext]: e => jmp(s(e.operand, b)),
        [iov]: e => jmp(s(e.operand, b)),
        [rec]: e => jmp(q(e.elements, Object.keys(e.elements), b)),
        [abs]: e => call(s(e.lhs, !b), dx => call(s(e.rhs, b), dy => ret(subtract_vars([...dx, ...dy], e.vars)))),
        [cnj]: e => call(s(e.lhs, b), dx => call(s(e.rhs, b), dy => ret([...new Set([...dx, ...dy])]))),
        [dsj]: e => call(s(e.lhs, b), dx => call(s(e.rhs, b), dy => ret([...new Set([...dx, ...dy])])))
    })(t);
    return s(t, b);
});
//# sourceMappingURL=free_vars.js.map