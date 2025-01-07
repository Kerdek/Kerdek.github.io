import { assign } from "./assign.js";
import { di } from "./di.js";
import { abs, any, bol, cnj, dsj, iov, lit, num, rec, ref, str, typ_abs, typ_cnj, typ_dsj, typ_iov, typ_rec, typ_unk, unk, visit_type, aka, ext, typ_ext } from "./graph.js";
// import { print_inequalities, print_type } from "./print.js"
import { homproc, jmp } from "./run.js";
export const substitute = (o, r, b) => {
    const t = homproc((call, ret) => {
        const m = new Map();
        const p = (o, l, k, r) => () => !k[0] ? ret(typ_rec(r)) :
            di(k[0], i => call(s(o, l[i]), de => jmp(p(o, l, k.slice(1), { ...r, [i]: de }))));
        const s = (o, e) => () => di(m.get(e), l => l ? ret(l) :
            di(typ_unk(), t => (m.set(e, t),
                call(visit_type({
                    [unk]: ret,
                    [any]: ret,
                    [num]: ret,
                    [lit]: ret,
                    [str]: ret,
                    [bol]: ret,
                    [ref]: e => di(o[b ? "less" : "greater"][e.name], u => ret(u || e)),
                    [ext]: ({ operand }) => call(s(o, operand), dx => ret(typ_ext(dx))),
                    [iov]: ({ operand }) => call(s(o, operand), dx => ret(typ_iov(dx))),
                    [rec]: ({ elements }) => jmp(p(o, elements, Object.keys(elements), {})),
                    [abs]: ({ vars, lhs, rhs }) => call(s({ less: o.greater, greater: o.less }, lhs), dx => call(s(o, rhs), dy => ret(typ_abs(vars, dx, dy)))),
                    [aka]: ret,
                    [dsj]: ({ lhs, rhs }) => call(s(o, lhs), dx => call(s(o, rhs), dy => ret(typ_dsj(dx, dy)))),
                    [cnj]: ({ lhs, rhs }) => call(s(o, lhs), dx => call(s(o, rhs), dy => ret(typ_cnj(dx, dy))))
                })(e), tp => ret(assign(t, tp))))));
        return s(o, r);
    });
    // console.log(`Substituted \`${print_type(r)}\` to \`${print_type(t)}\` based on \`${print_inequalities(o)}\`.`)
    return t;
};
//# sourceMappingURL=substitute.js.map