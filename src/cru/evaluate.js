import { di } from "../di.js";
import { homproc } from "../run.js";
import { stam } from "../stam.js";
import { get_builtin } from "./builtin.js";
import { make, visit } from "./cru.js";
import { print, print_value } from "./print.js";
const fatal = m => { throw new Error(m); };
export const delimit = e => homproc((call, _cc, ret) => {
    const merge = ([dx, dxuses], [dy, dyuses]) => {
        const uses = new Set();
        const dynonuses = new Set();
        const dxnonuses = new Set();
        for (const u of dxuses) {
            uses.add(u);
            if (!dyuses.includes(u)) {
                dynonuses.add(u);
            }
        }
        for (const u of dyuses) {
            uses.add(u);
            if (!dxuses.includes(u)) {
                dxnonuses.add(u);
            }
        }
        return [dxnonuses.size == 0 ? dx : make("elm", [...dxnonuses], dx), dynonuses.size == 0 ? dy : make("elm", [...dynonuses], dy), [...uses]];
    };
    const discard = (i, [dx, dxuses]) => {
        const uses = [...dxuses];
        const j = uses.indexOf(i);
        if (j === -1) {
            dx = make("elm", [i], dx);
        }
        else {
            uses.splice(j, 1);
        }
        return [dx, uses];
    };
    const s = e => () => visit({
        mod: ([, u, x]) => {
            let i = new Set();
            const uq = u.map(([name, term]) => {
                const [e, f] = delimit(term);
                f.forEach(v => i.add(v));
                return [name, e, f];
            });
            const [e, f] = delimit(x);
            f.forEach(v => i.add(v));
            const ip = [...i];
            u.forEach(v => i.add(v[0]));
            const iq = [...i];
            const up = uq.map(([name, e, f]) => {
                const ev = iq.filter(n => !f.includes(n));
                return [name, ev.length ? make("elm", ev, e) : e];
            });
            const ev = iq.filter(n => !f.includes(n));
            return ret([make("mod", up, ev.length ? make("elm", ev, e) : e), ip]);
        },
        app: ([, x, y]) => call(s(x), dx => call(s(y), dy => (([dx, dy, uses]) => ret([make("app", dx, dy), uses]))(merge(dx, dy)))),
        acs: ([, x, y]) => call(s(x), dx => call(s(y), dy => (([dx, dy, uses]) => ret([make("acs", dx, dy), uses]))(merge(dx, dy)))),
        rec: ([, u]) => {
            let i = new Set();
            const uq = u.map(u => {
                if (u[0] === true) {
                    const [w, f] = delimit(u[1]);
                    f.forEach((v) => i.add(v));
                    return [true, w, f];
                }
                else {
                    const [k, kfv] = delimit(u[1]);
                    const [v, vfv] = delimit(u[2]);
                    kfv.forEach((v) => i.add(v));
                    vfv.forEach((v) => i.add(v));
                    return [false, k, v, [...kfv, ...vfv]];
                }
            });
            const ip = [...i];
            const up = uq.map(e => {
                if (e[0] === true) {
                    const ev = ip.filter((name) => !e[2].includes(name));
                    return [true, ev.length ? make("elm", ev, e[1]) : e[1]];
                }
                else {
                    const ek = ip.filter((name) => !e[3].includes(name));
                    const k = ek.length > 0 ? make("elm", ek, e[1]) : e[1];
                    const v = ek.length > 0 ? make("elm", ek, e[2]) : e[2];
                    return [false, k, v];
                }
            });
            return ret([make("rec", up), ip]);
        },
        lst: ([, u]) => {
            let i = new Set();
            const uq = u.map(([b, term]) => {
                const [e, f] = delimit(term);
                f.forEach(v => i.add(v));
                return [b, e, f];
            });
            const ip = [...i];
            const up = uq.map(([b, e, f]) => {
                const ev = ip.filter(name => !f.includes(name));
                return [b, ev.length ? make("elm", ev, e) : e];
            });
            return ret([make("lst", up), ip]);
        },
        abs: ([, i, x]) => call(s(x), dx => (([dx, uses]) => ret([make("abs", i, dx), uses]))(discard(i, dx))),
        var: e => ret([e, [e[1]]]),
        elm: () => fatal("Internal Error"),
        shr: e => ret([e, []]),
        lit: e => ret([e, []])
    })(e);
    return s(e);
});
export const beta_reduce = visit({
    mod: (e, o) => {
        const op = { ...o };
        for (const [i] of e[1]) {
            delete op[i];
        }
        return Object.keys(op).length === 0 ? e : make("mod", e[1].map(([i, e]) => [i, beta_reduce(e, op)]), beta_reduce(e[2], op));
    },
    app: ([, x, y], o) => make("app", beta_reduce(x, o), beta_reduce(y, o)),
    shr: (e, _o) => e,
    elm: (e, o) => {
        const op = { ...o };
        for (const k of e[1]) {
            delete op[k];
        }
        return Object.keys(op).length == 0 ? e : make("elm", e[1], beta_reduce(e[2], op));
    },
    var: (e, o) => o[e[1]] || e,
    acs: ([, x, y], o) => make("acs", beta_reduce(x, o), beta_reduce(y, o)),
    rec: ([, u], o) => make("rec", u.map(ie => ie[0] ? (([, e]) => [true, beta_reduce(e, o)])(ie) : (([, k, v]) => [false, beta_reduce(k, o), beta_reduce(v, o)])(ie))),
    lst: ([, u], o) => make("lst", u.map(([i, e]) => [i, beta_reduce(e, o)])),
    abs: (e, o) => {
        const op = { ...o };
        delete op[e[1]];
        return Object.keys(op).length === 0 ? e : make("abs", e[1], beta_reduce(e[2], op));
    },
    lit: (e, _o) => e
});
export const evaluate = stam((rec, rc, ret) => {
    const r = (a, d) => di(a[0], e => e === undefined ? ret(d) :
        e[0] ?
            rec(e[1], de => typeof de !== "object" || de === null || Array.isArray(de) ? (() => { throw new Error("Expected a record."); })() :
                r(a.slice(1), { ...d, ...de })) :
            rec(e[1], di => typeof di !== "string" ? (() => { throw new Error("Expected a string."); })() :
                r(a.slice(1), { ...d, [di]: make("shr", e[2]) })));
    const l = (a, d) => {
        for (;;) {
            const e = a[0];
            if (e === undefined) {
                return ret(d);
            }
            if (e[0]) {
                return rec(e[1], de => !Array.isArray(de) ? (() => { throw new Error("Expected a list."); })() :
                    l(a.slice(1), [...d, ...de]));
            }
            a = a.slice(1);
            d = [...d, make("shr", e[1])];
        }
    };
    const table = visit({
        mod: e => {
            const op = {};
            for (const def of e[1]) {
                op[def[0]] = make("shr", undefined);
            }
            for (const def of e[1]) {
                op[def[0]][1] = beta_reduce(def[1], op);
            }
            return rc(beta_reduce(e[2], op));
        },
        app: e => rec(e[1], dx => typeof dx !== "function" ? fatal(`Expected a function.`) :
            dx(e[2])(rec, rc, ret)),
        shr: e => rec(e[1], dx => (e[0] = "lit", e[1] = dx, ret(dx))),
        elm: ([, , x]) => rc(x),
        var: e => (r => r !== undefined ? ret(r) :
            fatal(`Undefined reference to \`${e[1]}\`.`))(get_builtin[e[1]]),
        acs: ([, x, y]) => rec(x, dx => rec(y, dy => typeof dx === "object" && dx !== null && !Array.isArray(dx) ?
            typeof dy !== "string" ? (() => { throw new Error(`Expected a string instead of \`${print_value(dy)}\` on rhs of subscript with \`${print_value(dx)}\`.`); })() :
                di(dx[dy], j => j === undefined ? (() => { throw new Error(`\`${print(y)}\` (aka \`${dy}\`) is not a property of \`${print(x)}\` (aka \`${print_value(dx)}\`).`); })() :
                    rc(make("shr", j))) :
            Array.isArray(dx) ?
                typeof dy !== "number" ? (() => { throw new Error(`Expected a number instead of \`${print_value(dy)}\` on rhs of subscript with \`${print_value(dx)}\`.`); })() :
                    di(dx[dy], j => j === undefined ? (() => { throw new Error(`\`${print(y)}\` (aka \`${dy}\`) is not a property of \`${print(x)}\` (aka \`${print_value(dx)}\`).`); })() :
                        rc(make("shr", j))) :
                typeof dx === "string" ?
                    typeof dy !== "number" ? (() => { throw new Error(`Expected a number instead of \`${print_value(dy)}\` on rhs of subscript with \`${print_value(dx)}\`.`); })() :
                        di(dx[dy], j => j === undefined ? (() => { throw new Error(`\`${print(y)}\` (aka \`${dy}\`) is not a property of \`${print(x)}\` (aka \`${print_value(dx)}\`).`); })() :
                            rc(make("lit", j))) :
                    (() => { throw new Error(`Expected a record instead of \`${print_value(dx)}\` on lhs of subscript with \`${print_value(dy)}\`.`); })())),
        rec: ([, x]) => r(x, {}),
        lst: ([, x]) => l(x, []),
        abs: e => ret(a => (_rec, cc, _ret) => cc(beta_reduce(e[2], { [e[1]]: make("shr", a) }))),
        lit: e => ret(e[1])
    });
    return e => () => table(e);
});
//# sourceMappingURL=evaluate.js.map