import { homproc } from "../run.js";
import { visit } from "./church.js";
const parens = (b, s) => b ? `(${s})` : s;
export const print = e => homproc((call, cc, ret) => {
    const p = ({ body }) => () => body.kind === 'abs' ? call(p(body), dx => ret(` ${body.param}${dx}`)) : call(s(body, false, true), dx => ret(`.${dx}`));
    const s = (e, pr, rm) => () => visit({
        abs: e => call(p(e), dx => ret(parens(!rm, `λ${e.param}${dx}`))),
        app: ({ lhs, rhs }) => call(s(lhs, false, false), dx => call(s(rhs, true, pr || rm), dy => ret(parens(pr, `${dx} ${dy}`)))),
        ref: ({ id }) => ret(id),
        shr: e => cc(s('value' in e ? e.value : e.body, pr, rm))
    })(e);
    return s(e, false, true);
});
//# sourceMappingURL=print.js.map