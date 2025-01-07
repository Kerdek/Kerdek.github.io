import { di } from "./di.js";
import { abs, acs, any, app, blt, bol, cnj, dsj, iov, lit, mod, num, rec, sav, aka, str, unk, visit_graph, visit_type, ref, res, cst, ext } from "./graph.js";
import { homproc, jmp } from "./run.js";
const parens = (x, c) => x ? `(${c})` : c;
export const print_inequalities = m => [
    ...Object.keys(m.less).map(k => di(m.less[k], t => `${k} <= ${print_type(t)}`)),
    ...Object.keys(m.greater).map(k => di(m.greater[k], t => `${k} >= ${print_type(t)}`))
].join(' && ');
export const print_type = e => homproc((call, ret) => {
    const qq = (a, k, r, d) => () => !k[0] ? ret(`{ ${r.join(', ')} }`) :
        di(k[0], i => call(s(a[i], 0, d + 1), dx0 => jmp(qq(a, k.slice(1), [...r, `${i}: ${dx0}`], d))));
    const q = (a, d) => () => !a[0] ? ret(``) :
        call(s(a[0], 0, d + 1), dx0 => call(q(a.slice(1), d), rest => ret(`, ${dx0}${rest}`)));
    const s = (e, p, d) => d === 10 ? () => ret(`...`) : (visit_type({
        [ref]: ({ name }) => ret(name),
        [aka]: ({ name }) => ret(name),
        [ext]: ({ operand }) => call(s(operand, 4, d + 1), dx => ret(parens(p > 3, `Ref ${dx}`))),
        [iov]: ({ operand }) => call(s(operand, 4, d + 1), dx => ret(parens(p > 3, `IO ${dx}`))),
        [num]: () => ret(`Number`),
        [str]: () => ret(`String`),
        [bol]: () => ret(`Boolean`),
        [lit]: ({ value }) => ret(JSON.stringify(value)),
        [unk]: () => ret(`Unknown`),
        [any]: () => ret(`Any`),
        [rec]: ({ elements }) => jmp(qq(elements, Object.keys(elements), [], d)),
        [abs]: ({ vars, lhs, rhs }) => call(s(lhs, 1, d + 1), dx => call(s(rhs, 0, d + 1), dy => ret(parens(p > 0, `${vars.length > 0 ? `\\${vars.map(x => `${x[1] ? '+' : '-'}${x[0]}`).join(' ')}.` : ``}${dx} -> ${dy}`)))),
        [cnj]: ({ lhs, rhs }) => call(s(lhs, 2, d + 1), dx => call(s(rhs, 3, d + 1), dy => ret(parens(p > 2, `${dx} & ${dy}`)))),
        [dsj]: ({ lhs, rhs }) => call(s(lhs, 1, d + 1), dx => call(s(rhs, 2, d + 1), dy => ret(parens(p > 1, `${dx} | ${dy}`))))
    }))(e);
    return s(e, 0, 0);
});
export const print_term = e => homproc((call, ret) => {
    const qq = (a, k, r, d) => () => !k[0] ? ret(`{ ${r.join(', ')} }`) :
        di(k[0], i => call(s(a[i][0], 0, true, d + 1), dx0 => jmp(qq(a, k.slice(1), [...r, `${i}: ${dx0}`], d))));
    const q = (a, d) => () => !a[0] ? ret(``) :
        call(s(a[0][0], 0, true, d + 1), dx0 => call(q(a.slice(1), d), rest => ret(`, ${dx0}${rest}`)));
    const s = (e, pr, rm, d) => visit_graph({
        [mod]: ({ body }) => jmp(s(body, pr, rm, d)),
        [app]: ({ lhs, rhs }) => call(s(lhs, 0, false, d + 1), dx => call(s(rhs, 1, pr > 0 || rm, d + 1), dy => ret(parens(pr > 0, `${dx} ${dy}`)))),
        [abs]: ({ parameter, body }) => call(s(body, 0, true, d + 1), dx => ret(parens(!rm, `\\${parameter}.${dx}`))),
        [ref]: ({ name }) => ret(name),
        [sav]: ({ body }) => jmp(s(body, pr, rm, d)),
        [aka]: ({ name }) => ret(name),
        [cst]: ({ destination, body }) => call(s(body, 0, false, d + 1), dx => ret(parens(pr > 0, `${dx} as ${print_type(destination)}`))),
        [acs]: ({ lhs, rhs }) => call(s(lhs, 1, false, d + 1), dx => call(s(rhs, 0, true, d + 1), dy => ret(`${dx}.[${dy}]`))),
        [res]: () => ret(`<record>`),
        [rec]: ({ elements }) => jmp(qq(elements, Object.keys(elements), [], d)),
        [blt]: () => ret(`<native code>`),
        [ext]: () => ret(`<reference>`),
        [iov]: () => ret(`<IO>`),
        [lit]: ({ value }) => ret(Array.isArray(value) ? `[${value.map(_ => "").join(', ')}]` :
            value === undefined ? "undefined" :
                JSON.stringify(value))
    })(e);
    return s(e, 0, true, 0);
});
//# sourceMappingURL=print.js.map