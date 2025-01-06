const enumerate = (o) => Reflect.ownKeys(o).map(i => [i, o[i]]);
const narrow = (x) => x;
const fields = (() => {
    return narrow({
        ext: ['name', 'body'],
        mem: ['body'],
        nym: ['sym', 'body'],
        uni: ['sym', 'body'],
        ref: ['sym'],
        app: ['lhs', 'rhs'],
        rec: [],
        lit: ['val']
    });
})();
export const tbl = o => e => o[e.kind](e);
export const make = (kind, ...data) => ({ kind, ...Object.fromEntries(data.map((e, i) => [fields[kind][i], e])) });
const reassign = (e, r) => {
    enumerate(e).forEach(([i]) => delete e[i]);
    Object.assign(e, r);
    return e;
};
const redirect = (e, r) => {
    enumerate(e).forEach(([i]) => delete e[i]);
    Object.assign(e, make('mem', r));
    return r[0];
};
export const reduce = (() => {
    const apply = e => tbl({
        uni: lhs => reassign(e, make('ext', { sym: lhs.sym, body: [e.rhs] }, lhs.body)),
        rec: () => {
            e.lhs = e.rhs;
            e.rhs = e;
            return e;
        },
        lit: () => { throw new Error("Invalid application of literal."); },
        ref: () => { throw new Error("Invalid application of reference."); }
    })(e.lhs);
    const reduce_app = e => {
        const l = reduce(e.lhs);
        if (!l)
            return apply(e);
        e.lhs = l;
        return e;
    };
    const reduce_mem = e => e.body[0];
    const reduce_ext = e => {
        const re = a => make('ext', e.name, a);
        const nullary = b => redirect(e, [b]);
        const binary_dist = k => b => {
            while (b.lhs.kind === 'mem') {
                b.lhs = b.lhs.body[0];
            }
            while (b.rhs.kind === 'mem') {
                b.rhs = b.rhs.body[0];
            }
            return reassign(e, make(k, re(b.lhs), re(b.rhs)));
        };
        const table = tbl({
            mem: body => {
                e.body = body.body[0];
                return e.body;
            },
            ext: body => (b => {
                if (b) {
                    e.body = b;
                }
                return e;
            })(reduce_ext(body)),
            uni: body => e.name.sym === body.sym ?
                redirect(e, [body]) :
                reassign(e, make('uni', body.sym, make('ext', e.name, body.body))),
            rec: nullary,
            ref: body => e.name.sym === body.sym ?
                redirect(e, e.name.body) :
                reassign(e, body),
            lit: b => redirect(e, [b]),
            app: binary_dist('app')
        });
        return table(e.body);
    };
    const normal = () => null;
    return tbl({
        app: reduce_app,
        ext: reduce_ext,
        mem: reduce_mem,
        ref: e => { throw new Error(`Undefined reference to ${e.sym}`); },
        uni: normal, rec: normal, lit: normal
    });
})();
export const evaluate = e => {
    for (;;) {
        const ep = reduce(e);
        if (!ep)
            return e;
        e = ep;
    }
};
//# sourceMappingURL=graph.js.map