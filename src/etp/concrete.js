import { di, visit } from '../common/util/di.js';
import { run } from './run.js';
export const visit_concrete_proposition = visit, visit_concrete_proof = visit, visit_concrete_statement = visit, walk_concrete_article = (c) => {
    const { proposition: p, proof: o, statement: n } = c, typ = run(({ proc, call, ret }) => {
        const main = proc(visit_concrete_proposition({
            par: e => call(main(e.b), b => ret(p.par({ b }, e))),
            led: e => call(main(e.b), b => ret(p.led({ b }, e))),
            trl: e => call(main(e.l), l => ret(p.trl({ l }, e))),
            uni: e => call(main(e.b), b => ret(p.uni({ b }, e))),
            lam: e => call(main(e.b), b => ret(p.lam({ b }, e))),
            dot: e => call(main(e.b), b => ret(p.dot({ b }, e))),
            imp: e => call(main(e.l), l => call(main(e.r), r => ret(p.imp({ l, r }, e)))),
            app: e => call(main(e.l), l => call(main(e.r), r => ret(p.app({ l, r }, e)))),
            ref: e => ret(p.ref({}, e)),
            err: e => ret(p.err({}, e))
        }));
        return main;
    }), trm = run(({ proc, call, ret }) => {
        const main = proc(visit_concrete_proof({
            par: e => call(main(e.b), b => ret(o.par({ b }, e))),
            led: e => call(main(e.b), b => ret(o.led({ b }, e))),
            trl: e => call(main(e.l), l => ret(o.trl({ l }, e))),
            uni: e => call(main(e.b), b => ret(o.uni({ b }, e))),
            lam: e => call(main(e.b), b => ret(o.lam({ b }, e))),
            dot: e => call(main(e.b), b => ret(o.dot({ b }, e))),
            spe: e => call(main(e.l), l => di(typ(e.r), rp => ret(o.spe({ l, r: rp }, e)))),
            mop: e => call(main(e.l), l => call(main(e.r), r => ret(o.mop({ l, r }, e)))),
            ref: e => ret(o.ref({}, e)),
            cdp: e => call(main(e.b), b => ret(o.cdp({ b }, e))),
            cdt: e => di(typ(e.t), t => call(main(e.b), b => ret(o.cdt({ b, t }, e)))),
            def: e => di(typ(e.d), d => call(main(e.b), b => ret(o.def({ d, b }, e)))),
            lem: e => call(main(e.d), d => call(main(e.b), b => ret(o.lem({ d, b }, e)))),
            let: e => di(typ(e.t), t => call(main(e.d), d => call(main(e.b), b => ret(o.let({ t, d, b }, e))))),
            prt: e => di(typ(e.d), d => call(main(e.b), b => ret(o.prt({ d, b }, e)))),
            err: e => di(typ(e.b), b => ret(o.err({ b }, e)))
        }));
        return main;
    }), stmt = run(({ proc, call, cc, ret }) => {
        const pre = proc((a) => a ? cc(main(a)) : ret(null));
        const main = proc(visit_concrete_statement({
            imp: e => call(pre(e.a), a => ret(n.imp({ a }, e))),
            exf: e => call(pre(e.a), a => ret(n.exf({ a }, e))),
            def: e => call(pre(e.a), a => di(typ(e.d), d => ret(n.def({ a, d }, e)))),
            thm: e => call(pre(e.a), a => di(typ(e.t), t => di(trm(e.d), d => ret(n.thm({ a, t, d }, e))))),
            prt: e => call(pre(e.a), a => di(typ(e.d), d => ret(n.prt({ a, d }, e)))),
            trl: e => call(pre(e.a), a => ret(n.trl({ a }, e)))
        }));
        return main;
    });
    return stmt;
};
//# sourceMappingURL=concrete.js.map