import { make, pretty, read } from './church.js';
import { jmp } from '../run.js';
export const get_builtin = await (async () => {
    const car = await read('λx y.x'), cdr = await read('λx y.y');
    const fatal_literal = (fatal, e) => fatal(`A literal is required where \`${pretty(e)}\` was provided.`);
    const nullary = op => make("lit", op);
    const unary = op => make("blt", (call, ret, s, fatal, r) => call(s(r), dx => dx[0] !== "lit" ? fatal_literal(fatal, dx) :
        ret(make("lit", op(dx[1])))));
    const binary = op => make("blt", (call, ret, s, fatal, r) => call(s(r), dr => call(s(make("app", dr, car)), dx => dx[0] !== "lit" ? fatal_literal(fatal, dx) :
        call(s(make("app", dr, cdr)), dy => dy[0] !== "lit" ? fatal_literal(fatal, dy) :
            ret(make("lit", op(dx[1], dy[1])))))));
    return {
        __builtin_rec: make("blt", (_call, _ret, s, _fatal, r) => (e => (e[2] = e, jmp(s(e))))(make("app", r, undefined))),
        __builtin_if: make("blt", (call, ret, s, fatal, r) => call(s(r), dx => dx[0] !== "lit" ? fatal_literal(fatal, dx) :
            ret(make("abs", "y", "lazy", make("abs", "z", "lazy", make("ref", dx[1] ? "y" : "z")))))),
        __builtin_add: binary((a, b) => a + b),
        __builtin_sub: binary((a, b) => a - b),
        __builtin_mul: binary((a, b) => a * b),
        __builtin_div: binary((a, b) => a / b),
        __builtin_eq: binary((a, b) => a === b),
        __builtin_neq: binary((a, b) => a !== b),
        __builtin_gt: binary((a, b) => a > b),
        __builtin_lt: binary((a, b) => a < b),
        __builtin_ge: binary((a, b) => a >= b),
        __builtin_le: binary((a, b) => a <= b),
        __builtin_elem: binary((a, b) => a[b]),
        __builtin_pi: nullary(Math.PI),
        __builtin_sqrt: unary(Math.sqrt),
        __builtin_log: unary(Math.log),
        __builtin_exp: unary(Math.exp),
        __builtin_cos: unary(Math.cos),
        __builtin_sin: unary(Math.sin),
        __builtin_tan: unary(Math.tan),
        __builtin_acos: unary(Math.acos),
        __builtin_asin: unary(Math.asin),
        __builtin_atan: unary(Math.atan),
        __builtin_atan2: binary(Math.atan2),
        __builtin_cosh: unary(Math.cosh),
        __builtin_sinh: unary(Math.sinh),
        __builtin_tanh: unary(Math.tanh),
        __builtin_acosh: unary(Math.acosh),
        __builtin_asinh: unary(Math.asinh),
        __builtin_atanh: unary(Math.atanh),
        __builtin_sempty: unary(x => x.length === 0),
        __builtin_shead: unary(x => x[0]),
        __builtin_stail: unary(x => x.substring(1)),
        __builtin_jsonstringify: unary(JSON.stringify),
        __builtin_jsonparse: unary(JSON.parse),
        __builtin_document: nullary(document),
        __builtin_console: nullary(console),
        __builtin_WebSocket: nullary(WebSocket)
    };
})();
//# sourceMappingURL=builtin.js.map