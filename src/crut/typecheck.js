import { abs, acs, app, blt, iov, lit, mod, rec, sav, aka, visit_graph, ref, res, cst, typ_new, typ_unk, typ_cnj, typ_rec, typ_abs, typ_lit, ext, unk } from "./graph.js";
import { di } from "./di.js";
import { homproc, jmp } from "./run.js";
import { print_term, print_type } from "./print.js";
import { builtins_types } from "./builtin_types.js";
import { apply_inequalities, conjoin_inequalities, empty_inequalities } from "./constraints.js";
import { eliminate } from "./eliminate.js";
import { subsume } from "./subsume.js";
import { element } from "./element.js";
import { result } from "./function.js";
import { inequality_vars, subtract_vars } from "./free_vars.js";
const includes = new Map();
export const typecheck = (e) => {
    const r = homproc((call, ret) => {
        const r = (e, m, g) => () => !m[0] ? jmp(s(e, g)) :
            di(m[0], ([i, x, u, w]) => (g[i] = (() => {
                let m;
                return (call, ret) => () => m ? ret(m) :
                    (m = [u || typ_unk(), empty_inequalities()],
                        call(s(x, g), zp => typeof zp === "string" ? ret(zp) :
                            u ?
                                di(subsume(zp[0], u), vars => typeof vars === "string" ? ret(`(${w[0]}:${w[1]}:${w[2]}): typecheck module: Expected \`${print_type(u)}\` but found \`${print_type(zp[0])}\`.\n${vars}\n\n\t${print_term(x)}`) :
                                    di(conjoin_inequalities(vars, zp[1]), c => (m = [u, c],
                                        ret(m)))) : (m = zp,
                                ret(m))));
            })(),
                jmp(r(e, m.slice(1), g))));
        const h = (x, g, r, m) => () => !x[0] ? ret([r, m]) :
            di(x[0], f => f[0] ?
                call(s(f[1], g), dx => typeof dx === "string" ? ret(dx) :
                    di(r.kind === unk ? dx[0] : typ_cnj(r, dx[0]), t => typeof t === "string" ? ret(t) :
                        di(conjoin_inequalities(m, dx[1]), c => jmp(h(x.slice(1), g, t, c))))) :
                call(s(f[2], g), dx => typeof dx === "string" ? ret(dx) :
                    di(r.kind === unk ? typ_rec({ [f[1]]: dx[0] }) : typ_cnj(r, typ_rec({ [f[1]]: dx[0] })), t => typeof t === "string" ? ret(t) :
                        di(conjoin_inequalities(m, dx[1]), c => jmp(h(x.slice(1), g, t, c))))));
        const s = (e, g) => () => call(visit_graph({
            [mod]: ({ module: definitions, body }) => jmp(r(body, definitions, g)),
            [res]: ({ elements }) => jmp(h(elements, g, typ_unk(), empty_inequalities())),
            [acs]: ({ location: w, lhs, rhs }) => call(s(lhs, g), dx => typeof dx === "string" ? ret(dx) :
                call(s(rhs, g), dy => typeof dy === "string" ? ret(dy) :
                    di(element(dx[0], dy[0]), tr => typeof tr === "string" ? ret(`(${w[0]}:${w[1]}:${w[2]}): typecheck: No element \`${print_type(dy[0])}\` of \`${print_type(dx[0])}\`.\n\n\t${print_term(rhs)}`) :
                        di(conjoin_inequalities(dx[1], dy[1]), c => di(apply_inequalities(c, tr[1]), c => ret([tr[0], c])))))),
            [sav]: ({ body }) => jmp(s(body, g)),
            [cst]: ({ location: w, destination, body }) => call(s(body, g), dx => typeof dx === "string" ? ret(dx) :
                di(subsume(dx[0], destination), u => typeof u === "string" ? ret(`(${w[0]}:${w[1]}:${w[2]}): typecheck: Cannot cast \`${print_type(dx[0])}\` to \`${print_type(destination)}\`.\n${u}\n\n\t${print_term(e)}`) :
                    di(apply_inequalities(dx[1], u), c => ret([destination, c])))),
            [app]: ({ location: w, lhs, rhs }) => call(s(lhs, g), dx => typeof dx === "string" ? ret(dx) :
                call(s(rhs, g), dy => typeof dy === "string" ? ret(dy) :
                    di(result(dx[0], dy[0]), r => typeof r === "string" ? ret(`(${w[0]}:${w[1]}:${w[2]}): typecheck: Cannot apply \`${print_type(dx[0])}\` to \`${print_type(dy[0])}\`.\n${r}\n\n\t${print_term(e)}`) :
                        di(conjoin_inequalities(dx[1], dy[1]), c => di(apply_inequalities(c, r[1]), c => ret([r[0], c])))))),
            [abs]: e => call(s(e.body, { ...g, [e.parameter]: null }), dx => typeof dx === "string" ? ret(dx) :
                di(eliminate(dx[1], [[e.parameter, true]], false), soln => typeof soln === "string" ? ret(soln) :
                    di(soln[0].less[e.parameter] || typ_unk(), c => {
                        const vi = inequality_vars(soln[0], false);
                        const vd = inequality_vars(soln[1], true);
                        return ret([typ_abs(subtract_vars(vi, vd), c, dx[0]), soln[1]]);
                    }))),
            [ref]: e => di(g[e.name], l => l === undefined ? ret(`(${e.location[0]}:${e.location[1]}:${e.location[2]}): typecheck: Undefined reference to \`${e.name}\`.`) :
                l === null ? di(typ_new(), n => ret([n, { less: { [e.name]: n }, greater: {} }])) :
                    jmp(l(call, ret))),
            [aka]: ({ identity }) => di(includes.get(identity), l => l ? ret([l, empty_inequalities()]) :
                call(s(identity[0], builtins_types), z => typeof z === "string" ? ret(z) : (includes.set(identity, z[0]),
                    ret([z[0], empty_inequalities()])))),
            [blt]: () => ret("typecheck: native code should not exist at typecheck"),
            [ext]: () => ret("typecheck: reference values should not exist at typecheck"),
            [iov]: () => ret("typecheck: io values should not exist at typecheck"),
            [rec]: () => ret("typecheck: record values should not exist at typecheck"),
            [lit]: e => ret([typ_lit(e.value), empty_inequalities()])
        })(e), r => typeof r === "string" ? ret(r) : (
        // console.log(`Synthesized type \`${print_type(r[0])}\` for term \`${print_term(e)}\` with constraints \`${print_inequalities(r[1])}\`.`),
        ret(r)));
        return s(e, builtins_types);
    });
    return r;
};
//# sourceMappingURL=typecheck.js.map