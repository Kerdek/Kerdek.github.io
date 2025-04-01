import { homproc } from "./run.js";
import { visit } from "./lang.js";
const parens = (c, s) => c ? `(${s})` : s;
export const print_prop = (e, b) => homproc((call, _cc, ret) => {
    const p = e => () => e.body.kind === "all" ? (x => call(p(x), dx => ret(` ${x.id}${dx}`)))(e.body) : call(s(e.body)(0, true), dx => ret(`.${dx}`));
    const t = visit({
        all: e => (_p, r) => call(p(e), dx => ret(parens(!r, `\\${e.id}${dx}`))),
        imp: ({ lhs, rhs }) => (p, r) => call(s(lhs)(1, false), dx => call(s(rhs)(0, p > 0 || r), dy => ret(parens(p > 0, `${dx} -> ${dy}`)))),
        app: ({ lhs, rhs }) => (p, r) => call(s(lhs)(1, false), dx => call(s(rhs)(2, p > 1 || r), dy => ret(parens(p > 1, `${dx} ${dy}`)))),
        ref: ({ id }) => (_p, _r) => ret(id)
    });
    const s = (e) => (p, r) => () => t(e)(p, r);
    return b ? s(e)(2, false)() : s(e)(0, true)();
});
export const print_goals = g => {
    const o = [];
    for (const gp of g) {
        o.push([
            ...gp.scope.props.size === 0 ? [] : [[...gp.scope.props].join(' ')],
            ...Object.keys(gp.scope.proofs).map(k => `${k} : ${print_prop(gp.scope.proofs[k], false)}`),
            `⊢ ${print_prop(gp.prop, false)}`
        ].join('\n'));
    }
    return o.join('\n\n');
};
//# sourceMappingURL=print.js.map