export const get_builtin = await (async () => {
    const nullary = op => op;
    const unary = op => r => (rec, _cc, ret) => rec([r, {}], dx => ret(op(dx)));
    const binary = op => r => (rec, _cc, ret) => rec([r, {}], dx => ret(a => (rec, _cc, ret) => rec([a, {}], dy => ret(op(dx, dy)))));
    return {
        __builtin_rec: r => (_rec, cc, _ret) => (e => (e.rhs = e, cc([e, {}])))({ kind: "app", lhs: r, rhs: undefined }),
        __builtin_if: r => (rec, _cc, ret) => rec([r, {}], dx => ret(a => (_rec, _cc, ret) => ret(b => (_rec, cc, _ret) => cc([dx ? a : b, {}])))),
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