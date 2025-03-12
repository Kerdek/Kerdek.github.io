import { visit } from './church.js';
import { stam } from '../stam.js';
const fatal = m => { throw new Error(m); };
export const beta = (i, x) => stam((rec, _rc, ret) => {
    const table = visit({
        shr: ret,
        app: e => rec(e.lhs, dx => rec(e.rhs, dy => ret(dx === e.lhs && dy === e.rhs ? e : { kind: "app", lhs: dx, rhs: dy }))),
        abs: e => i === e.param ? ret(e) : rec(e.body, dx => ret({ kind: "abs", param: e.param, body: dx })),
        ref: e => (ret(i === e.id ? x : e)),
        lit: ret
    });
    return e => () => table(e);
});
export const evaluate = stam((rec, rc, ret) => {
    const table = visit({
        shr: e => 'value' in e ? ret(e.value) : rec(e.body, dx => (e.value = dx, ret(dx))),
        app: ({ lhs, rhs }) => rec(lhs, dx => dx.kind === "abs" ? rc(beta(dx.param, { kind: "shr", body: rhs })((_rec, rc, _ret) => rc(dx.body))) :
            dx.kind === "lit" && typeof dx.val === "function" ? (v => rec(rhs, dy => rc(v(dy))))(dx.val) :
                fatal("Not a function.")),
        abs: ret,
        ref: ({ id }) => fatal(`Undefined reference to \`${id}\`.`),
        lit: ret
    });
    return e => () => table(e);
});
//# sourceMappingURL=evaluate.js.map