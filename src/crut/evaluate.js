import { assign } from './assign.js';
import { builtins } from './builtins.js';
import { term_sav, visit_graph, term_lit, term_aka, term_mod, term_app, term_abs, term_acs, term_rec, abs, acs, app, blt, iov, lit, mod, rec, sav, aka, ref, term_res, res, cst, ext } from './graph.js';
import { di } from './di.js';
import { homproc, jmp } from './run.js';
import { print_term } from './print.js';
const bubble_sav = (e, y) => (call, ret) => () => call(bubble_root(y)(call, ret), () => jmp(bubble_root(e)(call, ret)));
const bubble_mod = (e, y) => (_call, ret) => () => {
    const o = { ...e.record };
    for (const def of y.module) {
        delete o[def[0]];
    }
    return ret(term_mod(y.module.map(d => [d[0], term_sav(o, d[1]), d[2], d[3]]), term_sav(o, y.body)));
};
const bubble_app = (e, y) => (_call, ret) => () => ret(term_app(y.location, term_sav(e.record, y.lhs), term_sav(e.record, y.rhs)));
const bubble_abs = (e, y) => (_call, ret) => () => di({ ...e.record }, o => (delete o[y.parameter],
    ret(term_abs(y.location, y.parameter, term_sav(o, y.body)))));
const bubble_var = (e, y) => (_call, ret) => () => di(e.record[y.name], u => ret(u === undefined ? y : term_aka(u, y.name)));
const bubble_cst = (e, y) => (call, ret) => () => jmp(bubble_root(term_sav(e.record, y.body))(call, ret));
const bubble_res = (e, y) => (_call, ret) => () => ret(term_res(y.elements.map(a => a[0] ?
    [true, term_sav(e.record, a[1])] :
    [false, a[1], term_sav(e.record, a[2])])));
const bubble_acs = (e, y) => (_call, ret) => () => ret(term_acs(y.location, term_sav(e.record, y.lhs), term_sav(e.record, y.rhs)));
const bubble_rec = (_e, y) => (_call, ret) => () => ret(y);
const bubble_shr = (_e, y) => (_call, ret) => () => ret(y);
const bubble_lit = (_e, y) => (_call, ret) => () => ret(y);
const bubble_ext = (_e, y) => (_call, ret) => () => ret(y);
const bubble_iov = (_e, y) => (_call, ret) => () => ret(y);
const bubble_blt = (_e, y) => (_call, ret) => () => ret(y);
const bubble_switch = e => (call, ret) => visit_graph({
    [sav]: y => jmp(bubble_sav(e, y)(call, ret)),
    [mod]: y => jmp(bubble_mod(e, y)(call, ret)),
    [app]: y => jmp(bubble_app(e, y)(call, ret)),
    [abs]: y => jmp(bubble_abs(e, y)(call, ret)),
    [cst]: y => jmp(bubble_cst(e, y)(call, ret)),
    [ref]: y => jmp(bubble_var(e, y)(call, ret)),
    [res]: y => jmp(bubble_res(e, y)(call, ret)),
    [rec]: y => jmp(bubble_rec(e, y)(call, ret)),
    [acs]: y => jmp(bubble_acs(e, y)(call, ret)),
    [aka]: y => jmp(bubble_shr(e, y)(call, ret)),
    [lit]: y => jmp(bubble_lit(e, y)(call, ret)),
    [ext]: y => jmp(bubble_ext(e, y)(call, ret)),
    [iov]: y => jmp(bubble_iov(e, y)(call, ret)),
    [blt]: y => jmp(bubble_blt(e, y)(call, ret))
})(e.body);
const bubble_root = e => (call, ret) => () => call(bubble_switch(e)(call, ret), de => ret(assign(e, de)));
export const bubble = e => homproc(bubble_root(e));
const evaluate_sav = e => (call, ret) => () => jmp(evaluate_root(bubble(e))(call, ret));
const evaluate_mod = e => (call, ret) => () => {
    const op = {};
    for (const def of e.module) {
        op[def[0]] = [term_sav(op, def[1])];
    }
    return jmp(evaluate_root(term_sav(op, e.body))(call, ret));
};
const evaluate_app = e => (call, ret) => () => call(evaluate_root(e.lhs)(call, ret), dx => jmp(visit_graph({
    [abs]: x => jmp(evaluate_root(term_sav({ [x.parameter]: [e.rhs] }, x.body))(call, ret)),
    [blt]: x => jmp(x.code(e.rhs)(call, ret)),
    [ext]: x => { throw new Error(`runtime: Expected a function instead of \`${print_term(x)}\`.`); },
    [iov]: x => { throw new Error(`runtime: Expected a function instead of \`${print_term(x)}\`.`); },
    [rec]: x => { throw new Error(`runtime: Expected a function instead of \`${print_term(x)}\`.`); },
    [lit]: x => { throw new Error(`runtime: Expected a function instead of \`${print_term(x)}\`.`); }
})(dx)));
const evaluate_shr = e => (call, ret) => () => call(evaluate_root(e.identity[0])(call, ret), dx => (e.identity[0] = dx,
    ret(dx)));
const evaluate_war = ({ location: w, name }) => (_call, ret) => () => di(builtins[name], r => !r ? (() => { throw new Error(`(${w[0]}:${w[1]}:${w[2]}): runtime: Undefined reference to \`${name}\`.`); })() :
    ret(r));
const evaluate_cst = e => (call, ret) => () => jmp(evaluate_root(e.body)(call, ret));
const evaluate_acs = ({ lhs, rhs }) => (call, ret) => () => call(evaluate_root(lhs)(call, ret), dx => call(evaluate_root(rhs)(call, ret), dy => di(dx.elements[dy.value], j => typeof dx.value === "string" ? ret(term_lit(j[0])) :
    jmp(evaluate_root(term_aka(j, "<object access>"))(call, ret)))));
const evaluate_res = ({ elements }) => (call, ret) => () => jmp(evaluate_record_syntax(elements, {})(call, ret));
const evaluate_record_syntax = (a, o) => (call, ret) => () => di(a[0], e => e === undefined ? ret(term_rec(o)) :
    e[0] ?
        call(evaluate_root(e[1])(call, ret), de => de.kind !== rec ? (() => { throw new Error("runtime: Expected a string."); })() :
            jmp(evaluate_record_syntax(a.slice(1), { ...o, ...de.elements })(call, ret))) :
        jmp(evaluate_record_syntax(a.slice(1), { ...o, [e[1]]: [e[2]] })(call, ret)));
const evaluate_rec = e => (_call, ret) => () => ret(e);
const evaluate_abs = e => (_call, ret) => () => ret(e);
const evaluate_blt = e => (_call, ret) => () => ret(e);
const evaluate_ext = e => (_call, ret) => () => ret(e);
const evaluate_iov = e => (_call, ret) => () => ret(e);
const evaluate_lit = e => (_call, ret) => () => ret(e);
export const evaluate_root = e => (call, ret) => visit_graph({
    [sav]: e => jmp(evaluate_sav(e)(call, ret)),
    [mod]: e => jmp(evaluate_mod(e)(call, ret)),
    [app]: e => jmp(evaluate_app(e)(call, ret)),
    [aka]: e => jmp(evaluate_shr(e)(call, ret)),
    [ref]: e => jmp(evaluate_war(e)(call, ret)),
    [cst]: e => jmp(evaluate_cst(e)(call, ret)),
    [acs]: e => jmp(evaluate_acs(e)(call, ret)),
    [res]: e => jmp(evaluate_res(e)(call, ret)),
    [rec]: e => jmp(evaluate_rec(e)(call, ret)),
    [abs]: e => jmp(evaluate_abs(e)(call, ret)),
    [blt]: e => jmp(evaluate_blt(e)(call, ret)),
    [ext]: e => jmp(evaluate_ext(e)(call, ret)),
    [iov]: e => jmp(evaluate_iov(e)(call, ret)),
    [lit]: e => jmp(evaluate_lit(e)(call, ret))
})(e);
export const evaluate = e => homproc(evaluate_root(e));
//# sourceMappingURL=evaluate.js.map