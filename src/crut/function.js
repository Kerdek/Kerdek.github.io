import { abs, cnj, dsj, typ_new, ref, typ_dsj, typ_abs, typ_cnj, aka } from "./graph.js";
import { di } from "./di.js";
import { homproc, jmp } from "./run.js";
import { subsume } from "./subsume.js";
import { print_inequalities, print_type } from "./print.js";
import { rename } from "./rename.js";
import { eliminate } from "./eliminate.js";
import { conjoin_inequalities, disjoin_inequalities } from "./constraints.js";
import { substitute } from "./substitute.js";
import { clean } from "./clean.js";
// export const operand: (t: TypeTree) => TypeTree | null = t => homproc((call, ret) => {
// const s: (t: TypeTree) => Process = t => () =>
// t.kind === abs ? ret(t.lhs) :
// t.kind === aka ? jmp(s(t.identity)) :
// t.kind === cnj ?
//   call(s(t.lhs), dx =>
//   call(s(t.rhs), dy =>
//   ret(dx && dy && typ_dsj(dx, dy)))) :
// t.kind === dsj ?
//   call(s(t.lhs), dx =>
//   call(s(t.rhs), dy =>
//   ret(dx && dy && typ_cnj(dx, dy)))) :
// ret(null)
// return s(t) })
export const result = (t, a) => {
    t = rename(typ_new, t, {});
    const r = homproc((call, ret) => {
        const s = (t, a) => () => a.kind === dsj ?
            call(s(t, a.lhs), dx => typeof dx === "string" ? ret(dx) :
                call(s(t, a.rhs), dy => typeof dy === "string" ? ret(dy) :
                    di(conjoin_inequalities(dx[1], dy[1]), c => ret([typ_dsj(dx[0], dy[0]), c])))) :
            t.kind === ref ? di(a, a => typeof a === "string" ? ret(a) : di(typ_new(), n => ret([n, { less: { [t.name]: typ_abs([], a, n) }, greater: {} }]))) :
                t.kind === abs ?
                    ret(di(subsume(a, t.lhs), vars => typeof vars === "string" ? vars :
                        di(eliminate(vars, t.vars, false), soln => typeof soln === "string" ? soln :
                            di(substitute(soln[0], t.rhs, false), r => typeof r === "string" ? r :
                                [r, clean(soln[1], t.vars, true)])))) :
                    t.kind === aka ? jmp(s(t.identity, a)) :
                        t.kind === cnj ?
                            call(s(t.lhs, a), dx => typeof dx === "string" ?
                                call(s(t.rhs, a), dy => typeof dy === "string" ? ret(`${dx}\n${dy}`) :
                                    ret(dy)) :
                                call(s(t.rhs, a), dy => typeof dy === "string" ? ret(dx) :
                                    di(typ_cnj(dx[0], dy[0]), r => typeof r === "string" ? ret(r) :
                                        ret([r, disjoin_inequalities(dx[1], dy[1])])))) :
                            t.kind === dsj ?
                                call(s(t.lhs, a), dx => typeof dx === "string" ? ret(dx) :
                                    call(s(t.rhs, a), dy => typeof dy === "string" ? ret(dy) :
                                        di(conjoin_inequalities(dx[1], dy[1]), c => typeof c === "string" ? ret(c) :
                                            ret([typ_dsj(dx[0], dy[0]), c])))) :
                                ret(`\`${print_type(t)}\` is not a function.`);
        return s(t, a);
    });
    if (typeof r === "string")
        return r;
    console.log(`Result of \`${print_type(t)}\` called with \`${print_type(a)}\` is \`${print_type(r[0])}\` with constraints \`${print_inequalities(r[1])}\`\`.`);
    return [r[0], r[1]];
};
//# sourceMappingURL=function.js.map