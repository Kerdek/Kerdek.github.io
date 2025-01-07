import { cnj, dsj, lit, rec, str, typ_lit, ref, typ_rec, typ_new, typ_dsj, typ_str, aka } from "./graph.js";
import { di } from "./di.js";
import { homproc, jmp } from "./run.js";
import { print_type } from "./print.js";
import { conjoin_inequalities, disjoin_inequalities, empty_inequalities } from "./constraints.js";
import { subsume } from "./subsume.js";
export const element = (t, a) => {
    const r = homproc((call, ret) => {
        const n = (k, m, r) => () => !k[0] ? ret(r) :
            di(k[0], k0 => di(m[k0], mk0 => typeof mk0 === "string" ? ret(mk0) :
                di(subsume(typ_lit(k0), a), z => typeof z === "string" ?
                    jmp(n(k.slice(1), m, typeof r === "string" ? r + z : r)) :
                    typeof r === "string" ?
                        jmp(n(k.slice(1), m, [mk0, z])) :
                        di(conjoin_inequalities(z, r[1]), c => jmp(n(k.slice(1), m, [typ_dsj(r[0], mk0), c]))))));
        const p = (i, v, r) => () => !v[0] ? ret(r) :
            di(v[0], t0 => di(subsume(typ_lit(i), a), z => typeof z === "string" ?
                jmp(p(i + 1, v.slice(1), typeof r === "string" ? r + z : r)) :
                typeof r === "string" ?
                    jmp(p(i + 1, v.slice(1), [typ_lit(t0), z])) :
                    di(conjoin_inequalities(z, r[1]), c => typeof c === "string" ? ret(c) :
                        jmp(p(i + 1, v.slice(1), [typ_dsj(r[0], typ_lit(t0)), c])))));
        const s = (t, a) => () => a.kind === dsj ?
            call(s(t, a.lhs), dx => typeof dx === "string" ? ret(dx) :
                call(s(t, a.rhs), dy => typeof dy === "string" ? ret(dy) :
                    ret([typ_dsj(dx[0], dy[0]), conjoin_inequalities(dx[1], dy[1])]))) :
            t.kind === ref && a.kind === lit && typeof a.value === "string" ? di(a.value, i => di(typ_new(), n => ret([n, { less: { [t.name]: typ_rec({ [i]: n }) }, greater: {} }]))) :
                t.kind === str ? ret([typ_str(), empty_inequalities()]) :
                    t.kind === lit && typeof t.value === "string" ? jmp(p(0, t.value, `No element \`${print_type(a)}\` of string \`${print_type(t)}\`.`)) :
                        t.kind === rec ? jmp(n(Object.keys(t.elements), t.elements, `No element \`${print_type(a)}\` of record \`${print_type(t)}\`.`)) :
                            t.kind === aka ? jmp(s(t.identity, a)) :
                                t.kind === cnj ?
                                    call(s(t.lhs, a), dx => typeof dx === "string" ?
                                        call(s(t.rhs, a), dy => typeof dy === "string" ? ret(`${dx}\n${dy}`) :
                                            ret(dy)) :
                                        call(s(t.rhs, a), dy => typeof dy === "string" ? ret(dx) :
                                            ret([typ_dsj(dx[0], dy[0]), disjoin_inequalities(dx[1], dy[1])]))) :
                                    t.kind === dsj ?
                                        call(s(t.lhs, a), dx => typeof dx === "string" ? ret(dx) :
                                            call(s(t.rhs, a), dy => typeof dy === "string" ? ret(dy) :
                                                ret([typ_dsj(dx[0], dy[0]), conjoin_inequalities(dx[1], dy[1])]))) :
                                        ret(`\`${print_type(t)}\` is not a string, tuple, or record.`);
        return s(t, a);
    });
    if (typeof r === "string")
        return r;
    // console.log(`Element of \`${print_type(t)}\` with index \`${print_type(a)}\` is \`${print_type(r[0])} with constraints \`${print_inequalities(r[1])}\`\`.`)
    return r;
};
//# sourceMappingURL=element.js.map