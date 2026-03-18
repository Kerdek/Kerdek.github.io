import { visit } from '../common/util/di.js';
import { run } from '../common/util/run3.js';
import { walk_concrete_article } from './concrete.js';
import { fspan } from './scanner.js';
export const abstract_article = walk_concrete_article({
    proposition: {
        par: ({ b }, { lpu, rpu }) => ({ ...b, w: { begin: lpu.w.begin, end: (rpu || b).w.end } }),
        led: ({ b }) => b,
        trl: ({ l }) => l,
        uni: ({ b }, { l, i }) => i ? { k: 'uni', w: fspan(l || i, b), wi: i.w, i: i.text, b } : b,
        lam: ({ b }, { l, i }) => i ? { k: 'lam', w: fspan(l || i, b), wi: i.w, i: i.text, b } : b,
        dot: ({ b }, {}) => b,
        ref: ({}, { i }) => ({ k: 'ref', w: i.w, i: i.text }),
        imp: ({ l, r }, {}) => ({ k: 'imp', w: fspan(l, r), l, r }),
        app: ({ l, r }, {}) => ({ k: 'app', w: fspan(l, r), l, r }),
        err: ({}, { w }) => ({ k: 'err', w })
    },
    proof: {
        par: ({ b }, { lbu, rbu }) => ({ ...b, w: { begin: lbu.w.begin, end: (rbu || b).w.end } }),
        led: ({ b }, {}) => b,
        trl: ({ l }, {}) => l,
        prt: ({ d, b }, { l }) => ({ k: 'prt', w: fspan(l, b), d, b }),
        lam: ({ b }, {}) => b,
        uni: ({ b }, { l, i }) => !i ? b : ({ k: 'uni', w: fspan(l || i, b), wi: i.w, i: i.text, b }),
        dot: ({ b }, {}) => b,
        cdp: ({ b }, { l, i }) => !i ? b : { k: 'cdp', w: fspan(l || i, b), wi: i.w, i: i.text, b },
        cdt: ({ t, b }, { l, i }) => !i ? b : { k: 'cdp', w: fspan(l || i, b), wi: i.w, i: i.text, t, b },
        def: ({ d, b }, { l, i }) => !i ? b : { k: 'def', w: fspan(l, b), wi: i.w, i: i ? i.text : '', d, b, },
        lem: ({ d, b }, { l, i }) => !i ? b : { k: 'lem', w: fspan(l, b), wi: i.w, i: i.text, d, b },
        let: ({ t, d, b }, { l, i }) => !i ? b : { k: 'lem', w: fspan(l, b), wi: i.w, i: i.text, t, d, b },
        spe: ({ l, r }, {}) => ({ k: 'spe', w: fspan(l, r), l, r }),
        mop: ({ l, r }, {}) => ({ k: 'mop', w: fspan(l, r), l, r }),
        ref: ({}, { i }) => ({ k: 'ref', w: i.w, i: i.text }),
        err: ({}, { w }) => ({ k: 'err', w })
    },
    statement: {
        trl: ({ a }, {}) => a,
        imp: ({ a }, { l, i }) => !i ? a : { a, k: 'imp', w: fspan(l, i), wi: i.w, i: JSON.parse(i.text) },
        exf: ({ a }, { l, i }) => !i ? a : { a, k: 'exf', w: fspan(l, i), wi: i.w, i: i.text },
        def: ({ a, d }, { l, i }) => !i ? a : { a, k: 'def', w: fspan(l, d), wi: i.w, i: i.text, d },
        prt: ({ a, d }, { l }) => ({ a, k: 'prt', w: fspan(l, d), d }),
        thm: ({ a, t, d }, { l, i }) => !i ? a : { a, k: 'thm', w: fspan(l, d), wi: i.w, i: i.text, t, d }
    }
}), visit_proposition = visit, visit_proof = visit, visit_statement = visit, walk_proposition = (p) => run(({ proc, call, ret }) => {
    const main = proc(visit_proposition({
        uni: e => call(main(e.b), b => ret(p.uni({ b }, e))),
        lam: e => call(main(e.b), b => ret(p.lam({ b }, e))),
        imp: e => call(main(e.l), l => call(main(e.r), r => ret(p.imp({ l, r }, e)))),
        app: e => call(main(e.l), l => call(main(e.r), r => ret(p.app({ l, r }, e)))),
        ref: e => ret(p.ref({}, e)),
        var: e => e.d[0] ? call(main(e.d[0]), d => ret(p.var({ d }, e))) : ret(p.var({ d: null }, e)),
        err: e => ret(p.err({}, e))
    }));
    return main;
}), walk_proposition_conditional = (c, f, p) => run(({ proc, call, ret }) => {
    const inner = proc(visit_proposition({
        uni: e => call(main(e.b), b => ret(p.uni({ b }, e))),
        lam: e => call(main(e.b), b => ret(p.lam({ b }, e))),
        imp: e => call(main(e.l), l => call(main(e.r), r => ret(p.imp({ l, r }, e)))),
        app: e => call(main(e.l), l => call(main(e.r), r => ret(p.app({ l, r }, e)))),
        ref: e => ret(p.ref({}, e)),
        var: e => e.d[0] ? call(main(e.d[0]), d => ret(p.var({ d }, e))) : ret(p.var({ d: null }, e)),
        err: e => ret(p.err({}, e))
    })), main = proc((e) => c(e) ? call(inner(e), u => ret(u || f(e))) : ret(null));
    return main;
}), walk_proof = (o) => run(({ proc, call, ret }) => {
    const main = proc(visit_proof({
        uni: e => call(main(e.b), b => ret(o.uni({ b }, e))),
        spe: e => call(main(e.l), l => ret(o.spe({ l }, e))),
        mop: e => call(main(e.l), l => call(main(e.r), r => ret(o.mop({ l, r }, e)))),
        ref: e => ret(o.ref({}, e)),
        cdp: e => call(main(e.b), b => ret(o.cdp({ b }, e))),
        def: e => call(main(e.b), b => ret(o.def({ b }, e))),
        lem: e => call(main(e.d), d => call(main(e.b), b => ret(o.lem({ d, b }, e)))),
        prt: e => call(main(e.b), b => ret(o.prt({ b }, e))),
        err: e => ret(o.err({}, e))
    }));
    return main;
}), walk_proof_conditional = (c, f, o) => run(({ proc, call, ret }) => {
    const inner = proc(visit_proof({
        uni: e => call(main(e.b), b => ret(o.uni({ b }, e))),
        spe: e => call(main(e.l), l => ret(o.spe({ l }, e))),
        mop: e => call(main(e.l), l => call(main(e.r), r => ret(o.mop({ l, r }, e)))),
        ref: e => ret(o.ref({}, e)),
        cdp: e => call(main(e.b), b => ret(o.cdp({ b }, e))),
        def: e => call(main(e.b), b => ret(o.def({ b }, e))),
        lem: e => call(main(e.d), d => call(main(e.b), b => ret(o.lem({ d, b }, e)))),
        prt: e => call(main(e.b), b => ret(o.prt({ b }, e))),
        err: e => ret(o.err({}, e))
    })), main = proc((e) => c(e) ? call(inner(e), u => ret(u || f(e))) : ret(null));
    return main;
}), walk_statement = (n) => run(({ proc, call, cc, ret }) => {
    const pre = proc((a) => a ? cc(main(a)) : ret(null));
    const main = proc(visit_statement({
        imp: e => call(pre(e.a), a => ret(n.imp({ a }, e))),
        exf: e => call(pre(e.a), a => ret(n.exf({ a }, e))),
        def: e => call(pre(e.a), a => ret(n.def({ a }, e))),
        thm: e => call(pre(e.a), a => ret(n.thm({ a }, e))),
        prt: e => call(pre(e.a), a => ret(n.prt({ a }, e)))
    }));
    return main;
}), walk_statement_conditional = (c, n) => run(({ proc, cc, ret }) => {
    const pre = proc((a) => a ? cc(main(a)) : ret(null));
    const main = proc(visit_statement({
        imp: e => c(e) ? ret(n(e)) : cc(pre(e.a)),
        exf: e => c(e) ? ret(n(e)) : cc(pre(e.a)),
        def: e => c(e) ? ret(n(e)) : cc(pre(e.a)),
        thm: e => c(e) ? ret(n(e)) : cc(pre(e.a)),
        prt: e => c(e) ? ret(n(e)) : cc(pre(e.a))
    }));
    return main;
});
//# sourceMappingURL=abstract.js.map