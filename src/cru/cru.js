import { async_homproc } from '../run.js';
import { stam } from '../stam.js';
export const make = (...x) => x;
export const visit = o => (e, ...a) => (f => f(e, ...a))(o[e[0]]);
export const assign = (e, x) => {
    let i = 0;
    for (; i < x.length; i++) {
        e[i] = x[i];
    }
    for (; i < e.length; i++) {
        delete e[i];
    }
    return e;
};
export function tokenizer(s) {
    let t;
    function fatal(msg) {
        throw new Error(`(${s.pos()[0]}:${s.pos()[1]}:${s.pos()[2]}): tokenizer: ${msg}`);
    }
    function k(t) {
        const matches = s.get().match(t);
        if (matches === null) {
            return null;
        }
        return matches[0];
    }
    function pos() {
        return s.pos();
    }
    function take(k) {
        if (t[0] === k) {
            const r = t;
            skip();
            return r;
        }
        return undefined;
    }
    function ws() {
        const ws = k(/^(\s|\/\/([^\n\\]|\\.)*?(\n|$)|\/\*([^\*\\]|\\.|\*[^\/])*?(\*\/|$))*/);
        if (ws) {
            s.skip(ws.length);
        }
    }
    function skip() {
        if (t[0] === "eof") {
            return;
        }
        s.skip(t[1].length);
        ws();
        classify();
    }
    function classify() {
        if (s.get().length === 0) {
            t = ["eof"];
            return;
        }
        if (k(/^\(/)) {
            t = ["lparen", "("];
            return;
        }
        if (k(/^\)/)) {
            t = ["rparen", ")"];
            return;
        }
        if (k(/^{/)) {
            t = ["lbrace", "{"];
            return;
        }
        if (k(/^}/)) {
            t = ["rbrace", "}"];
            return;
        }
        if (k(/^\[/)) {
            t = ["lbracket", "["];
            return;
        }
        if (k(/^\]/)) {
            t = ["rbracket", "]"];
            return;
        }
        if (k(/^:/)) {
            t = ["colon", ":"];
            return;
        }
        if (k(/^\.\[/)) {
            t = ["dotbracket", ".["];
            return;
        }
        if (k(/^\.\.\./)) {
            t = ["dots", "..."];
            return;
        }
        if (k(/^\./)) {
            t = ["dot", "."];
            return;
        }
        if (k(/^\\/)) {
            t = ["rsolidus", "\\"];
            return;
        }
        if (k(/^=/)) {
            t = ["equal", "="];
            return;
        }
        if (k(/^,/)) {
            t = ["comma", ","];
            return;
        }
        if (k(/^->/)) {
            t = ["arrow", "->"];
            return;
        }
        if (k(/^#/)) {
            t = ["hash", "#"];
            return;
        }
        if (k(/^\$/)) {
            t = ["dollar", "$"];
            return;
        }
        let r = k(/^("([^"\\]|\\.)*($|")|[+-]?(?:\d+(?:\.\d+)?)(?:[eE][+-]?\d+)?|false|true|null|undefined)/);
        if (r) {
            t = ["literal", r];
            return;
        }
        r = k(/^[A-Za-z_][A-Za-z0-9_]*/);
        if (r === "where") {
            t = ["where", "where"];
            return;
        }
        if (r === "let") {
            t = ["let", "let"];
            return;
        }
        if (r === "in") {
            t = ["in", "in"];
            return;
        }
        if (r) {
            t = ["identifier", r];
            return;
        }
        fatal(`Unrecognized character sequence.`);
    }
    function unget(text) {
        s.unget(text);
        ws();
        classify();
    }
    function unpos(p) {
        s.unpos(p);
    }
    ws();
    classify();
    return { unget, pos, take, unpos };
}
const di = (x, f) => f(x);
const includes = {};
export const read = tk => async_homproc((call, cc, ret) => {
    const fatal = m => { throw new Error(`(${tk.pos()[0]}:${tk.pos()[1]}:${tk.pos()[2]}): parser: ${m}`); }, include = async () => {
        let ru = tk.take("literal");
        if (ru === undefined || typeof ru[1] !== "string") {
            fatal("Expected a string.");
        }
        const wp = tk.pos();
        const url = new URL(wp[0]);
        const dirname = url.href.substring(0, url.href.lastIndexOf('/'));
        const r = new URL(dirname + "/" + JSON.parse(ru[1])).href;
        const m = includes[r];
        if (m) {
            return ret(m);
        }
        let res = await fetch(`${r}`);
        if (!res.ok) {
            fatal(`HTTP status ${res.status} while requesting \`./${res.url}\`.`);
        }
        tk.unget(`${await res.text()})`);
        tk.unpos([r, 1, 1]);
        return call(expression, async (e) => {
            tk.take("rparen");
            tk.unpos(wp);
            const m = make("shr", e);
            includes[r] = m;
            return ret(m);
        });
    }, lst_elems = l => async () => await di(tk.take("dots"), async (is_splat) => call(expression, async (e) => tk.take("rbracket") ? ret(make("lst", [...l, [is_splat ? true : false, e]])) :
        tk.take("comma") ? cc(lst_elems([...l, [is_splat ? true : false, e]])) :
            fatal(`Expected \`,\` or \`]\`.`))), rec_defs = o => async () => tk.take("dots") ?
        call(expression, async (e) => await di(() => [...o, [true, e]], async (r) => tk.take("rbrace") ? ret(make("rec", r())) :
            tk.take("comma") ? cc(rec_defs(r())) :
                fatal(`Expected \`,\` or \`}\`.`))) :
        tk.take("lbracket") ?
            call(expression, async (i) => !tk.take("rbracket") ? fatal(`Expected \`]\`.`) :
                call(parameters("colon"), async (y) => await di(() => [...o, [false, i, y]], async (r) => tk.take("rbrace") ? ret(make("rec", r())) :
                    tk.take("comma") ? cc(rec_defs(r())) :
                        fatal(`Expected \`,\` or \`}\`.`)))) :
            await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected \`...\`, \`[\`, or an identifier.`) :
                await di(() => [...o, [false, make("lit", i[1]), make("var", i[1])]], async (r) => tk.take("rbrace") ? ret(make("rec", r())) :
                    tk.take("comma") ? cc(rec_defs(r())) :
                        call(parameters("colon"), async (y) => await di(() => [...o, [false, make("lit", i[1]), y]], async (r) => tk.take("rbrace") ? ret(make("rec", r())) :
                            tk.take("comma") ? cc(rec_defs(r())) :
                                fatal(`Expected \`,\` or \`}\`.`))))), let_defs = m => async () => await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected an identifier.`) :
        call(parameters("equal"), async (y) => tk.take("in") ? call(dollar, async (x) => ret(make("mod", [...m, [i[1], y]], x))) :
            tk.take("comma") ? cc(let_defs([...m, [i[1], y]])) :
                fatal(`Expected \`,\` or \`in\`.`))), parameters = k => async () => tk.take(k) ? cc(expression) :
        await di(tk.take("identifier"), async (i) => i ? call(parameters(k), async (dx) => ret(make("abs", i[1], dx))) :
            fatal(`Expected token kind \`${k}\`.`)), try_primary = async () => tk.take("hash") ? include :
        tk.take("lbracket") ?
            async () => tk.take("rbracket") ? ret(make("lst", [])) :
                cc(lst_elems([])) :
            tk.take("lbrace") ?
                async () => tk.take("rbrace") ? ret(make("rec", [])) :
                    cc(rec_defs([])) :
                tk.take("rsolidus") ?
                    parameters("arrow") :
                    tk.take("lparen") ?
                        async () => call(expression, async (x) => tk.take("rparen") ? ret(x) :
                            fatal(`Expected \`)\`.`)) :
                        tk.take("let") ?
                            async () => tk.take("in") ? cc(dollar) :
                                cc(let_defs([])) :
                            await di(tk.take("literal"), async (c) => c ? async () => ret(make("lit", c[1] === "undefined" ? undefined :
                                JSON.parse(c[1]))) :
                                await di(tk.take("identifier"), async (r) => r ? async () => ret(make("var", r[1])) : null)), access_rhs = async (x) => tk.take("dot") ?
        await di(tk.take("identifier"), async (i) => i ? access_rhs(make("acs", x, make("lit", i[1]))) :
            await di(tk.take("literal"), async (i) => i ? access_rhs(make("acs", x, make("lit", i[1]))) :
                fatal("Expected a subscript."))) :
        tk.take("dotbracket") ?
            call(expression, async (i) => !tk.take("rbracket") ? fatal(`Expected \`]\`.`) :
                access_rhs(make("acs", x, i))) :
            ret(x), try_access = async () => await di(await try_primary(), async (up) => up === null ? null :
        async () => call(up, access_rhs)), access = async () => await di(await try_access(), async (up) => up === null ? fatal("Expected a term.") :
        cc(up)), juxt_rhs = async (x) => await di(await try_access(), async (up) => up === null ? ret(x) :
        call(up, async (y) => juxt_rhs(make("app", x, y)))), juxt = async () => call(access, juxt_rhs), dollar = async () => call(juxt, async (x) => tk.take("dollar") ?
        call(dollar, async (y) => ret(make("app", x, y))) :
        ret(x)), where_defs = ([, m, x]) => async () => await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected an identifier.`) :
        call(parameters("equal"), async (y) => tk.take("rparen") ? ret(make("mod", [...m, [i[1], y]], x)) :
            tk.take("comma") ? cc(where_defs(make("mod", [...m, [i[1], y]], x))) :
                fatal(`Expected \`)\` or \`,\`.`))), where_clause = x => async () => di(make("mod", [], x), r => tk.take("rparen") ? ret(r) :
        cc(where_defs(r))), where_seq = async (x) => tk.take("where") ?
        !tk.take("lparen") ? fatal(`Expected \`(\`.`) :
            call(where_clause(x), where_seq) :
        ret(x), where = async () => call(dollar, where_seq), expression = where, all = async () => call(expression, async (e) => !tk.take("eof") ? fatal(`Expected end of file.`) :
        ret(e));
    return all;
});
export const print = visit({
    mod: () => `<module>`,
    app: () => `<application>`,
    abs: () => `<function>`,
    var: () => `<variable>`,
    acs: () => `<access>`,
    lit: ([, c]) => 
    // rec: ([, o]) => `{ ${Object.keys(o).map(k => `${k}: ${print((o[k] as Ptr)[0])}`).join(', ')} }` })
    Array.isArray(c) ? `[${c.map(print).join(', ')}]` :
        typeof c === "object" && c !== null ? `{ ${Object.keys(c).map(k => `${k}`).join(', ')} }` :
            typeof c === "undefined" ? "undefined" :
                JSON.stringify(c),
    sav: () => `<save>`,
    shr: () => `<shared>`,
    lst: () => `<list>`,
    rec: () => `<record>`
});
export const print_value = e => typeof e === "function" ? "<function>" :
    Array.isArray(e) ? `[${e.map(print).join(', ')}]` :
        e === null ? `null` :
            typeof e === "object" ? `{ ${Object.keys(e).map(k => `${e}: ${print(e[k])}`)} }` :
                typeof e === "undefined" ? "undefined" :
                    JSON.stringify(e);
export const get_builtin = await (async () => {
    const nullary = op => op;
    const unary = op => r => (rec, _cc, ret) => rec([r, {}], dx => ret(op(dx)));
    const binary = op => r => (rec, _cc, ret) => rec([r, {}], dx => ret(unary(dy => op(dx, dy))));
    const ternary = op => r => (rec, _cc, ret) => rec([r, {}], dx => ret(binary((dy, dz) => op(dx, dy, dz))));
    return {
        __builtin_typeof: r => (rec, _rc, ret) => rec([r, {}], dx => ret(Array.isArray(dx) ? "tuple" : typeof dx === "object" ? "record" : typeof dx)),
        __builtin_length: unary(x => x.length),
        __builtin_keys: unary(x => Object.keys(x).map(x => make("shr", make("lit", x), x))),
        __builtin_slice: ternary((x, y, z) => x.slice(y, z)),
        __builtin_rec: r => (_rec, cc, _ret) => (e => (e[2] = e, cc([e, {}])))(make("app", r, undefined)),
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
        __builtin_stringify: unary(JSON.stringify),
        __builtin_document: nullary(document),
        __builtin_console: nullary(console),
        __builtin_WebSocket: nullary(WebSocket)
    };
})();
const fatal = m => { throw new Error(m); };
export const evaluate = stam((rec, rc, ret) => {
    const r = (a, d, o) => di(a[0], e => e === undefined ? ret(d) :
        e[0] ?
            rec([e[1], o], de => typeof de !== "object" || de === null || Array.isArray(de) ? (() => { throw new Error("Expected a record."); })() :
                r(a.slice(1), { ...d, ...de }, o)) :
            rec([e[1], o], di => typeof di !== "string" ? (() => { throw new Error("Expected a string."); })() :
                r(a.slice(1), { ...d, [di]: make("shr", make("sav", o, e[2])) }, o)));
    const l = (a, d, o) => di(a[0], e => e === undefined ? ret(d) :
        e[0] ?
            rec([e[1], o], de => !Array.isArray(de) ? (() => { throw new Error("Expected a list."); })() :
                l(a.slice(1), [...d, ...de], o)) :
            l(a.slice(1), [...d, make("shr", make("sav", o, e[1]))], o));
    const table = visit({
        sav: ([, i, x], o) => rc([x, { ...o, ...i }]),
        mod: (e, o) => {
            const op = {};
            for (const def of e[1]) {
                op[def[0]] = make("shr", make("sav", o, make("sav", op, def[1])));
            }
            return rc([make("sav", op, e[2]), o]);
        },
        app: (e, o) => rec([e[1], o], dx => typeof dx !== "function" ? fatal(`Expected a function.`) :
            dx(make("sav", o, e[2]))(rec, rc, ret)),
        shr: (e, _o) => 2 in e ? ret(e[2]) : rec([e[1], {}], dx => (e[2] = dx, ret(dx))),
        var: (e, o) => (r => r ? rc([r, {}]) :
            (r => r !== undefined ? ret(r) :
                fatal(`Undefined reference to \`${e[1]}\`.`))(get_builtin[e[1]]))(o[e[1]]),
        acs: ([, x, y], o) => rec([x, o], dx => rec([y, o], dy => typeof dx === "object" && dx !== null && !Array.isArray(dx) ?
            typeof dy !== "string" ? (() => { throw new Error(`Expected a string instead of \`${print_value(dy)}\` on rhs of subscript with \`${print_value(dx)}\`.`); })() :
                di(dx[dy], j => j === undefined ? (() => { throw new Error(`\`${print(y)}\` (aka \`${dy}\`) is not a property of \`${print(x)}\` (aka \`${print_value(dx)}\`).`); })() :
                    rc([make("shr", j), {}])) :
            Array.isArray(dx) ?
                typeof dy !== "number" ? (() => { throw new Error(`Expected a number instead of \`${print_value(dy)}\` on rhs of subscript with \`${print_value(dx)}\`.`); })() :
                    di(dx[dy], j => j === undefined ? (() => { throw new Error(`\`${print(y)}\` (aka \`${dy}\`) is not a property of \`${print(x)}\` (aka \`${print_value(dx)}\`).`); })() :
                        rc([make("shr", j), {}])) :
                typeof dx === "string" ?
                    typeof dy !== "number" ? (() => { throw new Error(`Expected a number instead of \`${print_value(dy)}\` on rhs of subscript with \`${print_value(dx)}\`.`); })() :
                        di(dx[dy], j => j === undefined ? (() => { throw new Error(`\`${print(y)}\` (aka \`${dy}\`) is not a property of \`${print(x)}\` (aka \`${print_value(dx)}\`).`); })() :
                            rc([make("lit", j), {}])) :
                    (() => { throw new Error(`Expected a record instead of \`${print_value(dx)}\` on lhs of subscript with \`${print_value(dy)}\`.`); })())),
        rec: ([, x], o) => r(x, {}, o),
        lst: ([, x], o) => l(x, [], o),
        abs: (e, o) => ret(a => (_rec, cc, _ret) => cc([e[2], { ...o, [e[1]]: make("shr", a) }])),
        lit: (e, _o) => ret(e[1])
    });
    return ([e, o]) => () => table(e, o);
});
//# sourceMappingURL=cru.js.map