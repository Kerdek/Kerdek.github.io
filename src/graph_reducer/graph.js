const enumerate = (o) => Reflect.ownKeys(o).map(i => [i, o[i]]);
const narrow = (x) => x;
const fields = (() => {
    const binary = narrow(['lhs', 'rhs']);
    const unary = narrow(['body']);
    const nullary = narrow([]);
    const literal = narrow(['val']);
    const quantifier = narrow(['sym', 'body']);
    const symbol = narrow(['sym']);
    return narrow({
        thk: ['body', 'next'],
        ext: ['name', 'body'], mem: unary, nym: quantifier,
        uni: quantifier,
        ref: symbol,
        app: binary, cns: binary,
        ceq: binary, cne: binary,
        cgt: binary, clt: binary,
        cge: binary, cle: binary,
        add: binary, sub: binary,
        mul: binary, div: binary, mod: binary,
        itp: unary, fmt: unary, qot: unary, jst: unary,
        fls: nullary, tru: nullary, cst: nullary, rec: nullary,
        str: literal, num: literal
    });
})();
export const tblt = o => e => o[e.kind](e);
export const tbl = tblt;
export const tbln = tblt;
let cb_make = () => { };
let cb_change = () => { };
let cb_remove_child = () => { };
let cb_add_child = () => { };
export const set_cb_make = cb => {
    cb_make = cb;
};
export const set_cb_change = cb => {
    cb_change = cb;
};
export const set_cb_remove_child = cb => {
    cb_remove_child = cb;
};
export const set_cb_add_child = cb => {
    cb_add_child = cb;
};
export const maket = (why, kind, ...data) => {
    const e = { kind, ...Object.fromEntries(data.map((e, i) => [fields[kind][i], e])) };
    cb_make(e, why);
    if ('lhs' in e)
        cb_add_child(e, e.lhs, 'lhs');
    if ('rhs' in e)
        cb_add_child(e, e.rhs, 'rhs');
    if ('body' in e)
        cb_add_child(e, e.body, 'body');
    if ('name' in e)
        cb_add_child(e, e.name, 'name');
    return e;
};
export const make = maket;
export const maken = maket;
const reassign = (e, r) => {
    if ('lhs' in e)
        cb_remove_child(e, e.lhs);
    if ('rhs' in e)
        cb_remove_child(e, e.rhs);
    if ('body' in e)
        cb_remove_child(e, e.body);
    if ('name' in e)
        cb_remove_child(e, e.name);
    enumerate(e).forEach(([i]) => delete e[i]);
    Object.assign(e, r);
    cb_change(e);
    if ('lhs' in e)
        cb_add_child(e, e.lhs, 'lhs');
    if ('rhs' in e)
        cb_add_child(e, e.rhs, 'rhs');
    if ('body' in e)
        cb_add_child(e, e.body, 'body');
    if ('name' in e)
        cb_add_child(e, e.name, 'name');
    return e;
};
const redirect = (e, r) => {
    if ('lhs' in e)
        cb_remove_child(e, e.lhs);
    if ('rhs' in e)
        cb_remove_child(e, e.rhs);
    if ('body' in e)
        cb_remove_child(e, e.body);
    if ('name' in e)
        cb_remove_child(e, e.name);
    enumerate(e).forEach(([i]) => delete e[i]);
    Object.assign(e, make(e, 'mem', r));
    cb_change(e);
    if ('body' in e)
        cb_add_child(e, e.body, 'body');
    return r;
};
export const unthunk = e => {
    for (;;) {
        if (e.kind === 'thk') {
            return unthunk(e.next(unthunk(e.body), true));
        }
        else
            return e;
    }
};
export const sym = (() => {
    const syml = {};
    return v => syml[v] || (syml[v] = { id: v });
})();
export const flatten_stringlike = e => {
    let prefix = '';
    let parts = [e];
    for (;;) {
        let [a, ...rest] = parts;
        if (!a)
            return prefix;
        a = evaluate(a);
        if (a.kind === 'fls') {
            parts = rest;
        }
        else if (a.kind === 'str') {
            parts = rest;
            prefix += a.val;
        }
        else {
            const ap = reduce(make(e, 'app', a, make(e, 'cst')));
            if (!ap)
                return null;
            const bp = reduce(make(e, 'app', a, make(e, 'fls')));
            if (!bp)
                return null;
            parts = [ap, bp, ...rest];
        }
    }
};
export const reduce = (() => {
    const no = () => null;
    // various application rules
    const apply = e => {
        const table = tbl({
            uni: lhs => reassign(e, make(e, 'ext', make(e, 'nym', lhs.sym, e.rhs), lhs.body)),
            rec: () => {
                cb_remove_child(e, e.lhs);
                e.lhs = e.rhs;
                cb_add_child(e, e.lhs, 'lhs');
                cb_remove_child(e, e.rhs);
                e.rhs = e;
                cb_add_child(e, e.rhs, 'rhs');
                return e;
            },
            cns: lhs => reassign(e, make(e, 'app', make(e, 'app', e.rhs, lhs.lhs), lhs.rhs)),
            str: lhs => e.rhs.kind === 'str' ? null : //invalid
                lhs.val[0] !== undefined ?
                    reassign(e, make(e, 'app', make(e, 'app', e.rhs, make(e, 'str', lhs.val[0])), make(e, 'str', lhs.val.slice(1)))) :
                    reassign(e, make(e, 'tru')),
            num: lhs => {
                if (lhs.val === 0 || e.rhs.kind === 'num') {
                    return reassign(e, make(e, 'tru'));
                }
                return reassign(e, make(e, 'app', e.rhs, make(e, 'num', lhs.val - 1)));
            },
            tru: () => redirect(e, e.rhs),
            fls: () => reassign(e, make(e, 'tru')),
            cst: () => reassign(e, make(e, 'jst', e.rhs)),
            jst: lhs => redirect(e, lhs.body),
            qot: lhs => {
                const car = () => make(e, 'app', e.rhs, make(e, 'cst'));
                const cdr = () => { e.rhs = make(e, 'app', e.rhs, make(e, 'fls')); };
                const universal = a => literal(make(e, 'uni', a.sym, make(e, 'qot', a.body)));
                const literal = a => reassign(e, make(e, 'app', car(), a));
                const nullary = () => reassign(e, car());
                const unary = a => reassign(e, make(e, 'app', car(), make(e, 'qot', a.body)));
                const binary = a => reassign(e, make(e, 'app', make(e, 'app', car(), make(e, 'qot', a.lhs)), make(e, 'qot', a.rhs)));
                const l = reduce(lhs.body);
                if (l) {
                    cb_remove_child(lhs, lhs.body);
                    lhs.body = l;
                    cb_add_child(lhs, lhs.body, 'body');
                    return e;
                }
                if (lhs.body.kind === 'ext' || lhs.body.kind === 'mem' || lhs.body.kind === 'nym' || lhs.body.kind === 'thk' || lhs.body.kind === 'itp' || lhs.body.kind === 'fmt') {
                    return no(lhs.body);
                } // illegal
                const part = (k, f) => {
                    const b = lhs.body;
                    if (b.kind === k) {
                        return f(b);
                    }
                    cdr();
                    return null;
                };
                return part('uni', universal) ||
                    part('app', binary) || part('cns', binary) ||
                    part('ceq', binary) || part('cne', binary) ||
                    part('cgt', binary) || part('clt', binary) ||
                    part('cge', binary) || part('cle', binary) ||
                    part('add', binary) || part('sub', binary) ||
                    part('mul', binary) || part('div', binary) || part('mod', binary) ||
                    part('qot', unary) || part('jst', unary) ||
                    part('fls', nullary) || part('tru', nullary) || part('rec', nullary) || part('cst', nullary) ||
                    part('ref', literal) || part('str', literal) || part('num', literal);
            },
            fmt: no, itp: no, thk: no, ext: no,
            mem: no, nym: no, app: no, ceq: no,
            cne: no, cgt: no, clt: no, cge: no,
            cle: no, add: no, sub: no, mul: no,
            div: no, mod: no, ref: no
        });
        return table(e.lhs);
    };
    const reduce_thk = e => {
        if (e.body.kind === 'thk') {
            const final = fail => {
                const bn = b.next(b.body, fail);
                if (bn) {
                    const bnp = reduce(bn);
                    if (!bnp)
                        return e.next(bn, fail);
                    cb_remove_child(e, e.body);
                    e.body = bnp;
                    cb_add_child(e, e.body, 'body');
                    return make(e, 'thk', bnp, e.next);
                }
                return null;
            };
            const b = e.body;
            const bb = reduce(b.body);
            if (!bb)
                return final(false);
            cb_remove_child(b, b.body);
            b.body = bb;
            cb_add_child(b, b.body, 'body');
            return make(e, 'thk', bb, (bb, fail) => {
                cb_remove_child(e, e.body);
                b.body = bb;
                cb_add_child(e, e.body, 'body');
                if (fail) {
                    const bp = b.next(bb, fail);
                    if (bp) {
                        cb_remove_child(e, e.body);
                        e.body = bp;
                        cb_add_child(e, e.body, 'body');
                        return e.next(bp, fail);
                    }
                    return null;
                }
                return final(fail);
            });
        }
        const b = reduce(e.body);
        if (b) {
            cb_remove_child(e, e.body);
            e.body = b;
            cb_add_child(e, e.body, 'body');
            return e;
        }
        return e.next(e.body, false);
    };
    const reduce_app = e => {
        const l = reduce(e.lhs);
        if (!l)
            return apply(e);
        cb_remove_child(e, e.lhs);
        e.lhs = l;
        cb_add_child(e, e.lhs, 'lhs');
        return make(e, 'thk', l, (l, fail) => {
            cb_remove_child(e, e.lhs);
            e.lhs = l;
            cb_add_child(e, e.lhs, 'lhs');
            return fail ? e : apply(e);
        });
    };
    const reduce_mem = e => e.body;
    const reduce_nym = e => {
        while (e.body.kind === 'mem' || e.body.kind === 'nym') {
            cb_remove_child(e, e.body);
            e.body = e.body.body;
            cb_add_child(e, e.body, 'body');
        }
        return e.body;
    };
    const reduce_ext = e => {
        const re = a => make(e, 'ext', e.name, a);
        const nullary = b => redirect(e, b);
        const unary_dist = k => b => {
            while (b.body.kind === 'mem') {
                cb_remove_child(b, b.body);
                b.body = b.body.body;
                cb_add_child(b, b.body, 'body');
            }
            return reassign(e, make(e, k, re(b.body)));
        };
        const binary_dist = k => b => {
            while (b.lhs.kind === 'mem') {
                cb_remove_child(b, b.lhs);
                b.lhs = b.lhs.body;
                cb_add_child(b, b.lhs, 'lhs');
            }
            while (b.rhs.kind === 'mem') {
                cb_remove_child(b, b.rhs);
                b.rhs = b.rhs.body;
                cb_add_child(b, b.rhs, 'rhs');
            }
            return reassign(e, make(e, k, re(b.lhs), re(b.rhs)));
        };
        const unary_drop = b => {
            while (b.body.kind === 'mem') {
                cb_remove_child(b, b.body);
                b.body = b.body.body;
                cb_add_child(b, b.body, 'body');
            }
            return redirect(e, b);
        };
        const table = tbl({
            thk: no,
            mem: body => {
                cb_remove_child(e, e.body);
                e.body = body.body;
                cb_add_child(e, e.body, 'body');
                return e.body;
            },
            ext: body => (b => {
                if (b) {
                    cb_remove_child(e, e.body);
                    e.body = b;
                    cb_add_child(e, e.body, 'body');
                }
                return e;
            })(reduce_ext(body)),
            uni: body => e.name.sym === body.sym ?
                redirect(e, body) :
                reassign(e, make(e, 'uni', body.sym, make(e, 'ext', e.name, body.body))),
            rec: nullary,
            ref: body => e.name.sym === body.sym ?
                redirect(e, e.name) :
                reassign(e, body),
            nym: reduce_nym,
            jst: unary_drop,
            cst: nullary, str: nullary, num: nullary, fls: nullary, tru: nullary,
            app: binary_dist('app'), cns: binary_dist('cns'),
            ceq: binary_dist('ceq'), cne: binary_dist('cne'),
            cgt: binary_dist('cgt'), clt: binary_dist('clt'),
            cle: binary_dist('cle'), cge: binary_dist('cge'),
            add: binary_dist('add'), sub: binary_dist('sub'),
            mul: binary_dist('mul'), div: binary_dist('div'), mod: binary_dist('mod'),
            itp: unary_dist('itp'), fmt: unary_dist('fmt'), qot: unary_dist('qot')
        });
        return table(e.body);
    };
    const reduce_compare = op => e => {
        const final = () => e.lhs.kind === 'str' && e.rhs.kind === 'str' ||
            e.lhs.kind === 'num' && e.rhs.kind === 'num' ?
            reassign(e, make(e, op(e.lhs.val, e.rhs.val) ? 'tru' : 'fls')) :
            // invalid
            null;
        const rightside = () => {
            const r = reduce(e.rhs);
            if (!r)
                return final();
            cb_remove_child(e, e.rhs);
            e.rhs = r;
            cb_add_child(e, e.rhs, 'rhs');
            return make(e, 'thk', r, (r, fail) => {
                cb_remove_child(e, e.rhs);
                e.rhs = r;
                cb_add_child(e, e.rhs, 'rhs');
                return fail ? e : final();
            });
        };
        const l = reduce(e.lhs);
        if (!l)
            return rightside();
        cb_remove_child(e, e.lhs);
        e.lhs = l;
        cb_add_child(e, e.lhs, 'lhs');
        return make(e, 'thk', l, (l, fail) => {
            cb_remove_child(e, e.lhs);
            e.lhs = l;
            cb_add_child(e, e.lhs, 'lhs');
            if (fail)
                return e;
            return rightside();
        });
    };
    const reduce_arith = op => e => {
        const final = () => e.lhs.kind === 'num' && e.rhs.kind === 'num' ? (() => {
            return reassign(e, make(e, 'num', op(e.lhs.val, e.rhs.val)));
        })() :
            // invalid
            null;
        const rightside = () => {
            const r = reduce(e.rhs);
            if (!r)
                return final();
            cb_remove_child(e, e.rhs);
            e.rhs = r;
            cb_add_child(e, e.rhs, 'rhs');
            return make(e, 'thk', r, (r, fail) => {
                cb_remove_child(e, e.rhs);
                e.rhs = r;
                cb_add_child(e, e.rhs, 'rhs');
                return fail ? e : final();
            });
        };
        const l = reduce(e.lhs);
        if (!l)
            return rightside();
        cb_remove_child(e, e.lhs);
        e.lhs = l;
        cb_add_child(e, e.lhs, 'lhs');
        return make(e, 'thk', e.lhs, (l, fail) => {
            cb_remove_child(e, e.lhs);
            e.lhs = l;
            cb_add_child(e, e.lhs, 'lhs');
            if (fail)
                return e;
            return rightside();
        });
    };
    const reduce_itp = e => {
        if (e.body.kind === 'fls') {
            return reassign(e, make(e, 'fls'));
        }
        if (e.body.kind === 'cns') {
            return reassign(e, make(e, 'cns', make(e, 'fmt', e.body.lhs), make(e, 'itp', e.body.rhs)));
        }
        if (e.body.kind === 'ext') {
            const b = reduce_ext(e.body);
            if (b) {
                cb_remove_child(e, e.body);
                e.body = b;
                cb_add_child(e, e.body, 'body');
                return e;
            }
            return null;
        }
        return null;
    };
    const toStr = tbl({
        str: ({ val }) => `${val}`,
        num: ({ val }) => `${val}`,
        fls: () => `[fls]`, tru: () => `[tru]`,
        jst: () => `[jst]`, cst: () => `[cst]`,
        uni: () => `[uni]`, cns: () => `[cns]`,
        qot: () => `[qot]`,
        rec: no, thk: no, ext: no, mem: no, nym: no,
        app: no, ceq: no, cne: no, cgt: no,
        clt: no, cge: no, cle: no, add: no,
        sub: no, mul: no, div: no, mod: no,
        itp: no, fmt: no, ref: no
    });
    const reduce_fmt = e => {
        const final = () => {
            if (e.body.kind === 'cns') {
                return e.body;
            }
            const s = toStr(e.body);
            if (s == null) {
                return null;
            }
            return reassign(e, make(e, 'str', s));
        };
        if (e.body.kind === 'fmt') {
            const t = e.body;
            cb_remove_child(e, e.body);
            e.body = e.body.body;
            cb_add_child(e, e.body, 'body');
            return t;
        }
        const b = reduce(e.body);
        if (!b)
            return final();
        cb_remove_child(e, e.body);
        e.body = b;
        cb_add_child(e, e.body, 'body');
        return make(e, 'thk', e.body, (b, fail) => {
            cb_remove_child(e, e.body);
            e.body = b;
            cb_add_child(e, e.body, 'body');
            if (fail)
                return e;
            return final();
        });
    };
    return tbl({
        thk: reduce_thk,
        app: reduce_app,
        ext: reduce_ext,
        itp: reduce_itp,
        fmt: reduce_fmt,
        mem: reduce_mem,
        nym: reduce_nym,
        ceq: reduce_compare((a, b) => a === b),
        cne: reduce_compare((a, b) => a !== b),
        cgt: reduce_compare((a, b) => a > b),
        clt: reduce_compare((a, b) => a < b),
        cge: reduce_compare((a, b) => a >= b),
        cle: reduce_compare((a, b) => a <= b),
        add: reduce_arith((a, b) => a + b),
        sub: reduce_arith((a, b) => a - b),
        mul: reduce_arith((a, b) => a * b),
        div: reduce_arith((a, b) => Math.floor(a / b)),
        mod: reduce_arith((a, b) => a % b),
        uni: no, rec: no, qot: no, jst: no, cst: no,
        cns: no, ref: no, str: no, num: no,
        fls: no, tru: no
    });
})();
export const evaluate = e => {
    for (;;) {
        // ur like "oh this is inefficient
        // because we have to walk all the way down the
        // head every time" but
        // that's what the thunk nodes solve
        // at the cost of unthunking every time
        // we want to reflect
        const ep = reduce(e);
        if (!ep)
            return e;
        e = ep;
    }
};
// export const gc: (s: { [i: string]: Graph }) => (e: Graph) => Graph =
// s => {
//   const token = new Map<Graph, Graph>()
//   const irreducible: (e: Graph) => Graph = e => e
//   const quantifier: (e: Graph & { body: Graph }) => Graph =
//     e => {
//       e.body = gcs(e.body)
//       return e }
//   const binop: (e: Binary) => Graph =
//     e => (gcs(e.lhs), gcs(e.rhs), e)
//   const table = tbl({
//     thk: irreducible,
//     mem: quantifier,
//     ext: e => (gc({ ...s, [e.name.sym.id]: e.name.body })(e.body)),
//     itp: quantifier, fmt: quantifier,
//     bar: quantifier,
//     uni: e => {
//       const u = s[e.sym.id]
//       if (!u)
//     },
//     app: binop,
//     ceq: binop, cne: binop,
//     cgt: binop, clt: binop,
//     cge: binop, cle: binop,
//     add: binop, sub: binop,
//     mul: binop, div: binop,
//     qot: quantifier,
//     jst: quantifier,
//     cst: irreducible,
//     cns: binop,
//     ref: e => {
//       const u = s[e.sym.id]
//       return u ? reassign(e, (make('bar', gc({})(u)))) : e },
//     str: irreducible,
//     num: irreducible,
//     bol: irreducible })
//   const gcs: (e: Graph) => Graph =
//     e => {
//       let t = token.get(e)
//       if (t) return t
//       t = table(e)
//       token.set(e, t)
//       return t }
//   return gcs }
//# sourceMappingURL=graph.js.map