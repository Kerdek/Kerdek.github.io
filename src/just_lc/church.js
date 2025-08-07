export const fatal = m => { throw new Error(m); };
const parens = (c, s) => c ? `(${s})` : s;
export const abs = (param, body) => {
    const e = {
        print: (_p, r) => (call, _cc, ret) => call(body.print(false, true), dx => ret(parens(!r, `λ${param}.${dx}`))),
        to_JS: (call, _cc, ret) => call(body.to_JS, dx => ret(`(call, ret) => _${param} => ${dx}`))
    };
    return e;
};
export const app = (lhs, rhs) => {
    const e = {
        print: (p, r) => (call, _cc, ret) => call(lhs.print(false, false), dx => call(rhs.print(true, p || r), dy => ret(parens(p, `${dx} ${dy}`)))),
        to_JS: (call, _cc, ret) => call(lhs.to_JS, dx => call(rhs.to_JS, dy => ret(`call(${dy}, (${dx})(call, ret))`)))
    };
    return e;
};
export const ref = id => {
    const e = {
        print: (_p, _r) => (_call, _cc, ret) => ret(id),
        to_JS: (_call, _cc, ret) => ret(`ret(${id})`)
    };
    return e;
};
//# sourceMappingURL=church.js.map