import { run } from './run.js';
import { di, uniques } from '../common/util/di.js';
import { msg } from './context.js';
import { visit_proof, visit_proposition, visit_statement } from './abstract.js';
const cascade = (f, a, b) => f(a) || f(b), proposition_bound0 = (i, pfx) => pfx.includes(i), proposition_bound = (i, ctx, pfx) => cascade(pi => pi.includes(i), ctx, pfx), proof_bound0 = (i, pfx) => pfx.some(({ i: ip }) => ip === i), proof_bound = (i, ctx, pfx) => cascade(ctx => ctx.some(({ i: ip }) => ip === i), ctx, pfx), look_up_proposition = (i, ctx) => ctx.findLast(({ i: ip }) => ip === i), look_up_proof = (i, ctx, pfx) => cascade(ctx => ctx.findLast(({ i: ip }) => ip === i), ctx, pfx), undefine = (i, rho) => rho.filter(({ i: ip }) => ip !== i), safe = (i, bound) => {
    while (bound.some(ipp => ipp === i)) {
        i = `${i}'`;
    }
    return i;
}, reference_occurs_free = run(({ proc, call, cc, ret }) => {
    const save = (iota) => {
        const quantifier = ({ i, b }) => i === iota ? ret(false) : cc(main(b)), binary = ({ l, r }) => call(main(l), dl => dl ? ret(true) : cc(main(r))), main = proc(visit_proposition({
            uni: quantifier, lam: quantifier,
            imp: binary, app: binary,
            ref: ({ i }) => ret(i === iota),
            var: ({}) => ret(false),
            err: ({}) => ret(false)
        }));
        return main;
    };
    return (tau, iota) => save(iota)(tau);
}), variable_occurs = run(({ proc, call, cc, ret }) => {
    const save = (v) => {
        const quantifier = ({ b }) => cc(main(b)), binary = ({ l, r }) => call(main(l), dl => dl ? ret(true) : cc(main(r))), def = () => ret(false), main = proc(visit_proposition({
            uni: quantifier, lam: quantifier,
            imp: binary, app: binary,
            ref: def, err: def,
            var: ({ d }) => ret(d === v)
        }));
        return main;
    };
    return (tau, iota) => save(iota)(tau);
}), free_references = run(({ proc, call, cc, ret }) => {
    const save = (pi) => {
        const quantifier = ({ i, b }) => cc(save([...pi, i])(b)), binary = ({ l, r }) => call(main(l), l => call(main(r), r => ret([...l, ...r]))), def = () => ret([]), main = proc(visit_proposition({
            uni: quantifier, lam: quantifier,
            imp: binary, app: binary,
            var: def, err: def,
            ref: ({ i }) => ret(pi.includes(i) ? [] : [i])
        }));
        return main;
    };
    return (tau) => save([])(tau);
}), closed = run(({ proc, call, cc, ret }) => {
    const save = (ctx) => {
        const quantifier = ({ i, b }) => cc(save([...ctx, i])(b)), binary = ({ l, r }) => call(main(l), dx => !dx ? ret(false) : cc(main(r))), def = () => ret(true), main = proc(visit_proposition({
            uni: quantifier, lam: quantifier,
            imp: binary, app: binary,
            var: def, err: def,
            ref: ({ i }) => ret(proposition_bound0(i, ctx))
        }));
        return main;
    };
    return (tau, ctx) => save(ctx)(tau);
}), rename = run(({ proc, call, ret }) => {
    const save = (iq, ip) => {
        const quantifier = ({ i, b, ...z }) => i === iq ? ret({ i, b, ...z }) :
            i !== ip ?
                call(main(b), b => ret({ i, b, ...z })) :
                di(safe(i, uniques([...free_references({ i, b, ...z }), ip])), ip => call(save(i, ip)(b), b => call(main(b), b => ret({ i: ip, b, ...z })))), binary = ({ l, r, ...z }) => call(main(l), l => call(main(r), r => ret({ l, r, ...z }))), main = proc(visit_proposition({
            ref: ({ i, ...z }) => ret({ i: i === iq ? ip : i, ...z }),
            uni: quantifier, lam: quantifier,
            imp: binary, app: binary,
            var: ret, err: ret
        }));
        return main;
    };
    return (t, iq, ip) => save(iq, ip)(t);
}), substitute = run(({ proc, call, cc, ret }) => {
    const save = (iota, tau) => {
        const quantifier = ({ i, b, ...z }) => i === iota ? ret({ i, b, ...z }) :
            !reference_occurs_free(tau, i) ?
                call(main(b), b => ret({ i, b, ...z })) :
                di(safe(i, uniques([...free_references(b), ...free_references(tau)])), ip => di(rename(b, i, ip), b => call(main(b), b => ret({ i: ip, b, ...z })))), main = proc(visit_proposition({
            imp: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => ret({ l, r, ...z }))),
            app: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => l.k === 'lam' ? cc(save(l.i, r)(l.b)) :
                ret({ l, r, ...z }))),
            ref: ({ i, ...z }) => ret(i === iota ? tau : { i, ...z }),
            uni: quantifier, lam: quantifier,
            var: ret, err: ret
        }));
        return main;
    };
    return (taup, iota, tau) => save(iota, tau)(taup);
}), aka = run(({ proc, call, cc, ret }) => {
    const save = (rho) => {
        const quantifier = (e) => call(save(undefine(e.i, rho))(e.b), b => ret({ ...e, b })), main = proc(visit_proposition({
            app: e => call(main(e.l), l => l.k === 'lam' ?
                call(main(substitute(l.b, l.i, e.r)), d => ret({ ...d })) :
                ret(e)),
            ref: e => di(look_up_proposition(e.i, rho), u => !u ? ret(e) :
                call(main(u.d), d => ret({ ...d }))),
            var: e => e.d[0] ? cc(main(e.d[0])) :
                ret(e),
            uni: quantifier, lam: quantifier,
            imp: ret, err: ret
        }));
        return main;
    };
    return (tau, ctx) => save(ctx)(tau);
}), query = run(({ proc, call, cc, ret }) => {
    const save = (rho) => {
        const quantifier = (e) => call(save(undefine(e.i, rho))(e.b), b => ret({ ...e, b, o: e })), main = proc(visit_proposition({
            app: e => call(main(e.l), l => l.k === 'lam' ?
                call(main(substitute(l.b, l.i, e.r)), d => ret({ ...d, o: e })) :
                ret(e)),
            ref: e => di(look_up_proposition(e.i, rho), u => !u ? ret(e) :
                call(main(u.d), d => ret({ ...d, o: e }))),
            var: e => e.d[0] ? cc(main(e.d[0])) :
                ret(e),
            uni: quantifier, lam: quantifier,
            imp: ret, err: ret
        }));
        return main;
    };
    return (tau, ctx) => save(ctx)(tau);
}), reduce = run(({ proc, call, ret }) => {
    const quantifier = ({ i, b, ...z }) => call(main(b), b => ret({ i, b, ...z })), main = proc(visit_proposition({
        imp: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => ret({ l, r, ...z }))),
        app: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => di(l, lp => lp.k === 'lam' ? ret(substitute(lp.b, lp.i, r)) :
            ret({ l, r, ...z })))),
        uni: quantifier, lam: quantifier,
        ref: ret, var: ret, err: ret
    }));
    return main;
}), tidy = (t) => { while (t.o) {
    t = t.o;
} return t; }, beta_equivalent = run(({ proc, call, cc, ret }) => {
    const save = (rho, pi) => {
        const main = proc((xp, yp, spec) => {
            const x = query(xp, rho), y = query(yp, rho);
            return x.k === 'err' || y.k === 'err' ?
                ret(false) :
                x.k === 'var' ?
                    y.k === 'var' && x.d === y.d ? ret(true) :
                        variable_occurs(y, x.d) ? ret(false) : (x.d[0] = tidy(y),
                            ret(true)) :
                    y.k === 'var' ?
                        variable_occurs(x, y.d) ? ret(false) : (y.d[0] = tidy(x),
                            ret(true)) :
                        x.k === 'ref' && y.k === 'ref' ?
                            ret(x.i === y.i) :
                            y.k === 'uni' ?
                                spec ?
                                    x.k === 'uni' ?
                                        di(safe(x.i, pi), i => cc(save(rho, [...pi, i])(rename(x.b, x.i, i), y, spec))) :
                                        cc(main(x, substitute(y.b, y.i, { k: 'var', w: y.w, d: [] }), spec)) :
                                    x.k === 'uni' ?
                                        di(safe(y.i, pi), i => cc(save(rho, [...pi, i])(rename(x.b, x.i, i), rename(y.b, y.i, i), spec))) :
                                        ret(false) :
                                y.k === 'lam' ?
                                    x.k === 'lam' ?
                                        di(safe(y.i, pi), i => cc(save(rho, [...pi, i])(rename(x.b, x.i, i), rename(y.b, y.i, i), false))) :
                                        ret(false) :
                                    y.k === 'imp' ?
                                        x.k === 'imp' ?
                                            call(main(x.l, y.l, false), l => !l ? ret(false) :
                                                cc(main(x.r, y.r, false))) :
                                            ret(false) :
                                        y.k === 'app' ?
                                            x.k === 'app' ?
                                                call(main(x.l, y.l, false), l => !l ? ret(false) :
                                                    cc(main(x.r, y.r, false))) :
                                                ret(false) :
                                            ret(false);
        });
        return main;
    };
    return (x, y, rho, pi) => save(rho, pi)(x, y, true);
}), specialize = (pfx, g) => {
    for (;;) {
        const t = aka(g.tau, [...pfx.rho, ...g.rho]);
        if (t.k === 'uni') {
            const i = safe(t.i, [...pfx.pi, ...g.pi, ...g.hi]), tp = rename(t.b, t.i, i);
            g = { ...g, tau: tp, hi: [...g.hi, i] };
            continue;
        }
        break;
    }
    return g;
}, check_proof = run(({ proc, call, cc, ret }) => {
    const save = (pfx) => {
        const check = proc((e, g, tau, [s, m]) => ret(!tau || beta_equivalent(g.tau, tau, [...pfx.rho, ...g.rho], [...pfx.pi, ...g.pi]) ?
            [[...s, [e, g]], m] :
            [[...s, [e, { ...g, found: tau }]], [...m,
                    msg(e.w, 'Judgment Error', `The goal of this proof,`, g.tau, `is not its proposition,`, tau)]])), main = proc(visit_proof({
            uni: (e, g) => {
                const { w, i, b } = e, tpp = aka(g.tau, [...pfx.rho, ...g.rho]), tp = tpp.k === 'uni' ? rename(tpp.b, tpp.i, i) :
                    { k: 'var', w, d: [] };
                return call(main(b, { ...g,
                    tau: tp,
                    pi: [...g.pi, i] }), ([bf, bm]) => cc(check(e, g, { k: 'uni', w, i, b: tp }, [bf, [
                        ...tpp.k === 'uni' || tpp.k === 'var' ? [] : [
                            msg(w, `Judgment Error`, `The goal of this generalization is not quantified.`)
                        ],
                        ...!proposition_bound(i, g.pi, pfx.pi) ? [] : [
                            msg(w, `Name Error`, `This proposition name is already bound in the context.`)
                        ],
                        ...bm
                    ]])));
            },
            cdp: (e, g) => {
                g = specialize(pfx, g);
                const { w, i, t, b } = e, pb = !proof_bound(i, g.sigma, pfx.sigma), pc = !t || closed(t, [...pfx.pi, ...g.pi]), tn = t ? reduce(t) : null, tpp = aka(g.tau, [...pfx.rho, ...g.rho]), tp = tpp.k === 'var' ? (tpp.d[0] = { k: 'imp', w, l: { k: 'var', w, d: [] }, r: { k: 'var', w, d: [] } }, tpp.d[0]) : tpp, l = tn || (tp.k === 'imp' ? tp.l : { k: 'var', w, d: [] }), r = tpp.k === 'imp' ? tpp.r : { k: 'var', w, d: [] };
                return call(main(b, { ...g,
                    ...pb && pc ? {
                        tau: r,
                        sigma: [...g.sigma, { i, t: l }]
                    } : {} }), ([bf, bm]) => cc(check(e, g, { k: 'imp', w, l, r }, [bf, [
                        ...tpp.k === 'imp' ? [] : [
                            msg(w, `Judgment Error`, `The goal of this conditional proof is not an arrow.`)
                        ],
                        ...pb ? [] : [
                            msg(w, `Name Error`, `The proof name of this conditional proof is bound in the context.`)
                        ],
                        ...!t || pc ? [] : [
                            msg(t.w, `Name Error`, `This proposition is not closed.`)
                        ],
                        ...bm
                    ]])));
            },
            def: (e, g) => {
                const { w, i, d, b } = e, dn = reduce(d), pb = !proposition_bound(i, g.pi, pfx.pi), pc = closed(d, [...pfx.pi, ...g.pi]);
                return call(main(b, { ...g,
                    ...pb && pc ? { pi: [...g.pi, i], rho: [...g.rho, { i, d: dn }] } : {} }), ([bf, bm]) => cc(check(e, g, null, [bf, [...bm,
                        ...pb ? [] : [
                            msg(w, `Name Error`, `This proposition name is already bound in the context.`)
                        ],
                        ...pc ? [] : [
                            msg(d.w, `Name Error`, `This proposition is not closed.`)
                        ]]])));
            },
            lem: (e, g) => {
                const { w, i, t, d, b } = e, tn = t ? reduce(t) : { k: 'var', w, d: [] };
                return call(main(d, { ...g,
                    tau: tn }), ([df, dm]) => call(main(b, { ...g,
                    sigma: [...g.sigma, { i, t: tn }] }), ([bf, bm]) => cc(check(e, g, null, [[...df, ...bf], [...dm, ...bm,
                        ...!proof_bound(i, g.sigma, pfx.sigma) ? [] : [
                            msg(w, `Name Error`, `This proof name is already bound in the context.`)
                        ],
                        ...!t || closed(t, [...pfx.pi, ...g.pi]) ? [] : [
                            msg(t.w, `Name Error`, `This proposition is not closed.`)
                        ]]]))));
            },
            spe: (e, g) => {
                g = specialize(pfx, g);
                const { w, l, r } = e, pc = closed(r, [...pfx.pi, ...g.pi]), tl = { k: 'var', w, d: [] };
                return call(main(l, { ...g, tau: tl }), ([lf, lm]) => {
                    const lpp = aka(tl, [...pfx.rho, ...g.rho]), pu = lpp.k === 'uni', lp = pc && pu ? substitute(lpp.b, lpp.i, reduce(r)) : null;
                    return cc(check(e, g, lp, [lf, [...lm,
                            ...pu ? [] : [
                                msg(l.w, `Judgment Error`, `This proof is specialized, but its proposition is not quantified.`)
                            ],
                            ...pc ? [] : [
                                msg(r.w, `Name Error`, `This proposition is not closed.`)
                            ]]]));
                });
            },
            mop: (e, g) => {
                g = specialize(pfx, g);
                const { w, l, r } = e, v = { k: 'var', w, d: [] };
                return call(main(l, { ...g,
                    tau: { k: 'imp', w, l: v, r: g.tau } }), ([lf, lm]) => call(main(r, { ...g,
                    tau: v }), ([rf, rm]) => cc(check(e, g, null, [[...lf, ...rf], [...lm, ...rm]]))));
            },
            ref: (e, g) => {
                g = specialize(pfx, g);
                const { w, i } = e, u = look_up_proof(i, g.sigma, pfx.sigma);
                return cc(check(e, g, u ? u.t : null, [[], [
                        ...u ? [] : [
                            msg(w, `Name Error`, `This proof name is not bound in the context.`)
                        ]
                    ]]));
            },
            prt: (e, g) => {
                const { w, d, b } = e;
                return call(main(b, g), ([bf, bm]) => {
                    const dp = aka(reduce(d), [...pfx.rho, ...g.rho]);
                    return cc(check(e, g, null, [bf, [
                            msg(w, 'Query', dp), ...bm
                        ]]));
                });
            },
            err: (e, g) => {
                const { w } = e;
                return cc(check(e, g, null, [[], [
                        msg(w, 'Goal', g)
                    ]]));
            }
        }));
        return main;
    };
    return (eps, pfx, g) => save(pfx)(eps, g);
});
export const scan_article = (a, get_import) => {
    const exp = run(({ proc, cc, ret }) => {
        const inner = proc(visit_statement({
            imp: ({ a, i }, ctx, exp) => {
                const data = get_import(i);
                return cc(main(a, !data ? ctx : { ...ctx,
                    sigma: [...ctx.sigma, ...data.sigma],
                    pi: [...ctx.pi, ...data.pi] }, exp));
            },
            exf: ({ a, i }, ctx, exp) => {
                const u = ctx.sigma.find(({ i: ip }) => i === ip);
                return cc(main(a, ctx, !u ? exp :
                    { ...exp, sigma: [...exp.sigma, u] }));
            },
            prt: ({ a }, ctx, exp) => cc(main(a, ctx, exp)),
            def: ({ a, i, d }, ctx, exp) => cc(main(a, proposition_bound0(i, ctx.pi) || !closed(d, ctx.pi) ? ctx : { ...ctx,
                pi: [...ctx.pi, i],
                rho: [...ctx.rho, { i, d }] }, exp)),
            thm: ({ a, i, t }, ctx, exp) => cc(main(a, proof_bound(i, [], ctx.sigma) || t && !closed(t, ctx.pi) ? ctx : { ...ctx,
                sigma: [...ctx.sigma, { i, t }] }, exp))
        })), main = proc((e, pfx, exp) => e ? cc(inner(e, pfx, exp)) : ret(exp));
        return main;
    })(a, { sigma: [], rho: [], pi: [] }, { sigma: [], pi: [] });
    exp.pi.push(...uniques(exp.sigma.map(({ t }) => free_references(t)).flat(1)));
    return exp;
}, check_article = (a, get_import) => run(({ proc, cc, ret }) => {
    const inner = proc(visit_statement({
        imp: ({ a, w, i }, ctx, [f, m]) => {
            const data = get_import(i);
            return cc(main(a, !data ? ctx : { ...ctx,
                sigma: [...ctx.sigma, ...data.sigma],
                pi: [...ctx.pi, ...data.pi] }, [f, [...m,
                    ...data ? [] : [msg(w, 'Import Error', 'No such file.')]]]));
        },
        exf: ({ a, w, i }, ctx, [f, m]) => {
            return cc(main(a, ctx, [f, [...m,
                    ...ctx.sigma.some(({ i: ip }) => i === ip) ? [] : [
                        msg(w, 'Name Error', `This proof name is not bound in the context.`)
                    ]]]));
        },
        prt: ({ a, w, d }, ctx, [f, m]) => {
            const dp = aka(reduce(d), ctx.rho);
            return cc(main(a, ctx, [f, [...m, msg(w, 'Query', dp)]]));
        },
        def: ({ a, w, i, d }, ctx, [f, m]) => {
            const c = [];
            if (proposition_bound0(i, ctx.pi)) {
                c.push(msg(w, `Name Error`, `The proposition name of this definition is bound in the context.`));
            }
            if (!closed(d, ctx.pi)) {
                c.push(msg(d.w, `Name Error`, `This proposition is not closed.`));
            }
            return cc(main(a, c.length !== 0 ? ctx : { ...ctx,
                pi: [...ctx.pi, i],
                rho: [...ctx.rho, { i, d }] }, [f, [...m, ...c]]));
        },
        thm: ({ a, w, i, t, d }, ctx, [f, m]) => {
            const c = [];
            if (proof_bound0(i, ctx.sigma)) {
                c.push(msg(w, `Name Error`, `The proof name of this theorem is bound in the context.`));
            }
            if (t && !closed(t, ctx.pi)) {
                c.push(msg(t.w, `Name Error`, `This proposition is not closed.`));
            }
            if (c.length !== 0) {
                return cc(main(a, ctx, [f, [...m, ...c]]));
            }
            t = reduce(t);
            let [_tp, mp] = check_proof(d, ctx, { tau: t, sigma: [], rho: [], pi: [], hi: [] });
            return cc(main(a, { ...ctx, sigma: [...ctx.sigma, { i, t }] }, [f, [...m, ...c, ...mp]]));
        }
    })), main = proc((e, pfx, f) => e ? cc(inner(e, pfx, f)) : ret(f));
    return main;
})(a, { sigma: [], rho: [], pi: [] }, [[], []]);
//# sourceMappingURL=check.js.map