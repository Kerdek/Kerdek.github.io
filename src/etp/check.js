import { run } from './run.js';
import { uniques } from '../common/util/di.js';
import { msg, rho, pi, push_sigma, push_rho, push_pi, push_module, empty_prefix, set_tau, empty_goal, push_hi, look_up_proof, proof_bound, proposition_bound, safe } from './context.js';
import { visit_proof, visit_statement } from './abstract.js';
import { beta_equivalent, free_references, closed, aka, reduce, rename, substitute, uni, imp, mvar } from './proposition.js';
const specialize = (g) => {
    for (;;) {
        const taup = aka(g.tau, rho(g));
        if (taup.k === 'uni') {
            const i = safe(taup.i, [...g.prefix.pi, ...g.pi, ...g.hi]);
            g = set_tau(push_hi(g, i), rename(taup.b, taup.i, i));
            continue;
        }
        return g;
    }
}, check_proof = (eps, goal, f, m) => {
    const err = (title, ...c) => (w) => {
        m.push(msg(w, title, ...c));
    }, err_wrong_proposition = (t, tp) => err('Judgment Error', `This proves`, t, `but a proof of`, tp, `is expected.`), err_cant_specialize = (t) => err(`Judgment Error`, `Can't specialize`, t), err_duplicate_proposition_name = (i) => err(`Name Error`, `Duplicate proposition name \`${i}\`.`), err_duplicate_proof_name = (i) => err(`Name Error`, `Duplicate proof name \`${i}\`.`), err_unknown_proof_name = (i) => err(`Name Error`, `Unknown proof name \`${i}\`.`), err_query = (d) => err('Query', d);
    run(({ proc, call, cc, ret }) => {
        const check = proc((e, g, t) => {
            f.push([e, t ? { ...g, found: t } : g]);
            if (t && !beta_equivalent(g.tau, t, rho(g), pi(g), g.hi)) {
                err_wrong_proposition(t, g.tau)(e.w);
            }
            return ret();
        }), main = proc(visit_proof({
            uni: (e, g) => {
                const { w, i, b } = e, tpp = aka(g.tau, rho(g)), tp = tpp.k === 'uni' ? rename(tpp.b, tpp.i, i) : mvar(w, []);
                return call(main(b, set_tau(push_pi(g, i), tp)), () => {
                    if (proposition_bound(i, g)) {
                        err_duplicate_proposition_name(i)(w);
                    }
                    return cc(check(e, g, uni(w, i, tp)));
                });
            },
            cdp: (e, g) => {
                g = specialize(g);
                const { w, wi, i, t, b } = e, tn = t ? reduce(t) : null, tpp = aka(g.tau, rho(g)), tp = tpp.k === 'var' ? (tpp.d[0] = imp(w, mvar(w, []), mvar(w, []))) : tpp, l = tn || (tp.k === 'imp' ? tp.l : mvar(w, [])), r = tp.k === 'imp' ? tp.r : mvar(w, []);
                return call(main(b, set_tau(push_sigma(g, { wi, i, t: l }), r)), () => {
                    if (proof_bound(i, g)) {
                        err_duplicate_proof_name(i)(w);
                    }
                    if (t) {
                        m.push(...closed(t, pi(g)));
                    }
                    return cc(check(e, g, imp(w, l, r)));
                });
            },
            def: (e, g) => {
                const { w, wi, i, d, b } = e;
                return call(main(b, push_rho(g, { wi, i, d: reduce(d) })), () => {
                    if (proposition_bound(i, g)) {
                        err_duplicate_proposition_name(i)(w);
                    }
                    m.push(...closed(d, pi(g)));
                    return cc(check(e, g, null));
                });
            },
            lem: (e, g) => {
                const { w, wi, i, t, d, b } = e, tp = t ? reduce(t) : mvar(w, []);
                return call(main(d, set_tau(g, tp)), () => call(main(b, push_sigma(g, { wi, i, t: tp })), () => {
                    if (proof_bound(i, g)) {
                        err_duplicate_proof_name(i)(w);
                    }
                    if (t) {
                        m.push(...closed(t, pi(g)));
                    }
                    return cc(check(e, g, null));
                }));
            },
            spe: (e, g) => {
                g = specialize(g);
                const { w, l, r } = e, tl = mvar(w, []);
                return call(main(l, set_tau(g, tl)), () => {
                    const tp = aka(tl, rho(g)), lp = tp.k === 'uni' ? substitute(tp.b, tp.i, reduce(r)) : null;
                    if (!lp) {
                        err_cant_specialize(tp)(l.w);
                    }
                    m.push(...closed(r, pi(g)));
                    return cc(check(e, g, lp));
                });
            },
            mop: (e, g) => {
                g = specialize(g);
                const { w, l, r } = e, tp = mvar(w, []);
                return call(main(l, set_tau(g, imp(w, tp, g.tau))), () => call(main(r, set_tau(g, tp)), () => cc(check(e, g, null))));
            },
            ref: (e, g) => {
                g = specialize(g);
                const { w, i } = e, u = look_up_proof(i, g);
                if (!u) {
                    err_unknown_proof_name(i)(w);
                }
                return cc(check(e, g, u ? u.t : null));
            },
            prt: (e, g) => {
                const { w, d, b } = e;
                return call(main(b, g), () => {
                    err_query(aka(reduce(d), rho(g)))(w);
                    return cc(check(e, g, null));
                });
            },
            err: (e, g) => cc(check(e, g, null))
        }));
        return main;
    })(eps, goal);
};
export const collect_article_exports = (a, get_import, ge) => {
    run(({ proc, cc, ret }) => {
        const inner = proc(visit_statement({
            imp: ({ a, i }, g) => {
                const gi = get_import(i);
                return cc(main(a, gi ? push_module(g, gi) : g));
            },
            exf: ({ a, i }, g) => {
                const u = look_up_proof(i, g);
                if (u) {
                    ge.sigma.push(u);
                }
                return cc(main(a, g));
            },
            prt: ({ a }, g) => cc(main(a, g)),
            def: ({ a, wi, i, d }, g) => cc(main(a, push_rho(g, { wi, i, d }))),
            thm: ({ a, wi, i, t }, g) => cc(main(a, push_sigma(g, { wi, i, t })))
        })), main = proc((e, g) => e ? cc(inner(e, g)) : ret());
        return main;
    })(a, empty_prefix());
    ge.pi.push(...uniques(ge.sigma.map(({ t }) => free_references(t)).flat(1)));
}, check_article = (a, g, get_import, sf, f, m) => {
    const err = (title, ...c) => (w) => {
        m.push(msg(w, title, ...c));
    }, err_no_such_file = (i) => err(`Import Error`, `No such file \`${i}\`.`), err_duplicate_proposition_name = (i) => err(`Name Error`, `Duplicate proposition name \`${i}\`.`), err_duplicate_proof_name = (i) => err(`Name Error`, `Duplicate proof name \`${i}\`.`), err_unknown_proof_name = (i) => err(`Name Error`, `Unknown proof name \`${i}\`.`), err_query = (d) => err('Query', d);
    run(({ proc, cc, ret }) => {
        const inner = proc(visit_statement({
            imp: ({ a, w, i }, g) => {
                const gi = get_import(i);
                if (!gi) {
                    err_no_such_file(i)(w);
                }
                return cc(main(a, gi ? push_module(g, gi) : g));
            },
            exf: ({ a, w, i }, g) => {
                if (!proof_bound(i, g)) {
                    err_unknown_proof_name(i)(w);
                }
                return cc(main(a, g));
            },
            prt: ({ a, w, d }, g) => {
                err_query(aka(reduce(d), g.rho))(w);
                return cc(main(a, g));
            },
            def: ({ a, w, wi, i, d }, g) => {
                if (proposition_bound(i, g)) {
                    err_duplicate_proposition_name(i)(w);
                }
                m.push(...closed(d, g.pi));
                return cc(main(a, push_rho(g, { i, wi, d })));
            },
            thm: ({ a, w, wi, i, t, d }, g) => {
                const tp = reduce(t);
                if (proof_bound(i, g)) {
                    err_duplicate_proof_name(i)(w);
                }
                m.push(...closed(t, g.pi));
                check_proof(d, empty_goal(g, tp), f, m);
                return cc(main(a, push_sigma(g, { i, wi, t: tp })));
            }
        })), main = proc((e, g) => e ?
            (sf.push([e, g]), cc(inner(e, g))) :
            ret());
        return main;
    })(a, g);
};
//# sourceMappingURL=check.js.map