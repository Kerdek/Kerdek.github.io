import { run } from './run.js';
import { di, uniques } from '../common/util/di.js';
import { msg } from './context.js';
import { visit_proof, visit_proposition, visit_statement } from './abstract.js';
const cascade = (f, a, b) => f(a) || f(b), proposition_bound0 = (i, pfx) => pfx.includes(i), proposition_bound = (i, ctx, pfx) => cascade(pi => pi.includes(i), ctx, pfx), proof_bound0 = (i, pfx) => pfx.some(({ i: ip }) => ip === i), proof_bound = (i, ctx, pfx) => cascade(ctx => ctx.some(({ i: ip }) => ip === i), ctx, pfx), undefine = (i, rho) => rho.filter(({ i: ip }) => ip !== i), safe = (i, bound) => {
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
            var: ({ d }) => d === v ? ret(true) :
                d[0] ? cc(main(d[0])) :
                    ret(false)
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
        const quantifier = ({ i, b }) => cc(save([...ctx, i])(b)), binary = ({ l, r }) => call(main(l), l => call(main(r), r => ret([...l, ...r]))), def = () => ret([]), main = proc(visit_proposition({
            uni: quantifier, lam: quantifier,
            imp: binary, app: binary,
            var: def, err: def,
            ref: ({ w, i }) => ret(proposition_bound0(i, ctx) ? [] : [msg(w, 'Name Error', 'This proposition name is not bound in the context.')])
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
}), query = run(({ proc, call, ret }) => {
    const save = (rho) => {
        const quantifier = (e) => call(save(undefine(e.i, rho))(e.b), b => ret({ ...e, b, o: e })), main = proc(visit_proposition({
            app: e => call(main(e.l), l => l.k === 'lam' ?
                call(main(substitute(l.b, l.i, e.r)), d => ret({ ...d, o: e })) :
                ret(e)),
            ref: e => di(look_up_proposition(e.i, rho), u => !u ? ret(e) :
                call(main(u.d), d => ret({ ...d, o: e }))),
            var: e => e.d[0] ?
                call(main(e.d[0]), d => ret({ ...d, o: e })) :
                ret(e),
            uni: quantifier, lam: quantifier,
            imp: ret, err: ret
        }));
        return main;
    };
    return (tau, ctx) => save(ctx)(tau);
}), tidy = (t) => { while (t.o) {
    t = t.o;
} return t; }, specialize = (pfx, g) => {
    for (;;) {
        const taup = aka(g.tau, [...pfx.rho, ...g.rho]);
        if (taup.k === 'uni') {
            const i = safe(taup.i, [...g.pi, ...g.hi]);
            g = { ...g, tau: rename(taup.b, taup.i, i), hi: [...g.hi, i] };
            continue;
        }
        break;
    }
    return g;
}, gamma = (rho) => run(({ proc, call, ret }) => {
    const main = proc((t) => di(query(t, rho), tp => tp.k === 'uni' ?
        ret(tp) :
        tp.k === 'imp' ?
            call(main(tp.r), dr => dr.k !== 'uni' ? ret(t) :
                reference_occurs_free(tp.l, dr.i) ?
                    di(safe(dr.i, uniques([...free_references(tp.l), ...free_references(dr.b)])), ip => di(rename(dr.b, dr.i, ip), r => ret({ k: 'uni', w: t.w, i: ip, b: { k: 'imp', w: dr.w, l: tp.l, r }, o: t }))) :
                    ret({ k: 'uni', w: t.w, i: dr.i, b: { k: 'imp', w: dr.w, l: tp.l, r: dr.b }, o: t })) :
            ret(t)));
    return main;
}), beta_equivalent = run(({ branch, proc, call, cc, ret }) => {
    const save = (rho, pi, hi) => {
        const main = proc((disj, xp, yp, spec) => {
            const x = disj ? reduce(xp) : query(xp, rho), y = disj ? reduce(yp) : query(yp, rho);
            return x.k === 'err' || y.k === 'err' ?
                ret(false) :
                x.k === 'var' ?
                    y.k === 'var' && x.d === y.d ? ret(true) :
                        disj && x.d[0] ? cc(main(true, x.d[0], y, spec)) :
                            variable_occurs(y, x.d) ? ret(false) : (x.d[0] = tidy(y),
                                ret(true)) :
                    y.k === 'var' ?
                        disj && y.d[0] ? cc(main(true, x, y.d[0], spec)) :
                            variable_occurs(x, y.d) ? ret(false) : (y.d[0] = tidy(x),
                                ret(true)) :
                        x.k === 'ref' && y.k === 'ref' ?
                            ret(x.i === y.i) :
                            x.k === 'uni' && spec ?
                                di(safe(x.i, [...pi, ...hi]), i => cc(save(rho, pi, [...hi, i])(disj, rename(x.b, x.i, i), y, true))) :
                                y.k === 'uni' ?
                                    spec ?
                                        cc(main(disj, x, substitute(y.b, y.i, { k: 'var', w: y.w, d: [] }), true)) :
                                        di(gamma(rho)(x), xg => xg.k === 'uni' ?
                                            di(safe(y.i, [...pi, ...hi]), i => cc(save(rho, pi, [...hi, i])(disj, rename(xg.b, xg.i, i), rename(y.b, y.i, i), spec))) :
                                            ret(false)) :
                                    y.k === 'lam' ?
                                        x.k === 'lam' ?
                                            di(safe(y.i, [...pi, ...hi]), i => cc(save(rho, pi, [...hi, i])(disj, rename(x.b, x.i, i), rename(y.b, y.i, i), false))) :
                                            ret(false) :
                                        y.k === 'imp' ?
                                            x.k === 'uni' ?
                                                di(gamma(rho)(y), yg => yg.k === 'uni' ?
                                                    cc(main(disj, x, yg, spec)) :
                                                    ret(false)) :
                                                x.k === 'imp' ?
                                                    call(main(disj, y.l, x.l, spec), l => !l ? ret(false) :
                                                        cc(main(disj, x.r, y.r, spec))) :
                                                    ret(false) :
                                            y.k === 'app' ?
                                                x.k === 'app' ?
                                                    call(main(disj, x.l, y.l, false), l => !l ?
                                                        !disj ? ret(false) :
                                                            cc(main(false, x, y, spec)) :
                                                        cc(main(disj, x.r, y.r, false))) :
                                                    !disj ? ret(false) :
                                                        cc(main(false, x, y, spec)) :
                                                x.k === 'app' ?
                                                    !disj ? ret(false) :
                                                        cc(main(false, x, y, spec)) :
                                                    ret(false);
        });
        return main;
    };
    return (x, y, rho, pi, hi) => {
        const m = save(rho, pi, hi);
        return branch(() => call(m(true, x, y, true), dr => dr ? ret(true) :
            cc(m(false, x, y, true))));
    };
}), check_proof = run(({ proc, call, cc, ret }) => {
    const save = (pfx) => {
        const check = proc((e, g, tau, [s, m]) => ret(!tau || beta_equivalent(g.tau, tau, [...pfx.rho, ...g.rho], [...pfx.pi, ...g.pi], g.hi) ?
            [[...s, [e, !tau ? g : { ...g, found: tau }]], m] :
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
                const { w, i, t, b } = e, pb = !proof_bound(i, g.sigma, pfx.sigma), pc = !t ? [] : closed(t, [...pfx.pi, ...g.pi]), tn = t ? reduce(t) : null, tpp = aka(g.tau, [...pfx.rho, ...g.rho]), tp = tpp.k === 'var' ? (tpp.d[0] = { k: 'imp', w, l: { k: 'var', w, d: [] }, r: { k: 'var', w, d: [] } }, tpp.d[0]) : tpp, l = tn || (tp.k === 'imp' ? tp.l : { k: 'var', w, d: [] }), r = tp.k === 'imp' ? tp.r : { k: 'var', w, d: [] };
                return call(main(b, { ...g,
                    ...pb && pc.length === 0 ? {
                        tau: r,
                        sigma: [...g.sigma, { i, t: l }]
                    } : {} }), ([bf, bm]) => cc(check(e, g, { k: 'imp', w, l, r }, [bf, [
                        ...tp.k === 'imp' ? [] : [
                            msg(w, `Judgment Error`, `The goal of this conditional proof is not an arrow.`)
                        ],
                        ...pb ? [] : [
                            msg(w, `Name Error`, `The proof name of this conditional proof is bound in the context.`)
                        ],
                        ...pc,
                        ...bm
                    ]])));
            },
            def: (e, g) => {
                const { w, i, d, b } = e, dn = reduce(d), pb = !proposition_bound(i, g.pi, pfx.pi), pc = closed(d, [...pfx.pi, ...g.pi]);
                return call(main(b, { ...g,
                    ...pb && pc.length === 0 ? { pi: [...g.pi, i], rho: [...g.rho, { i, d: dn }] } : {} }), ([bf, bm]) => cc(check(e, g, null, [bf, [...bm,
                        ...pb ? [] : [
                            msg(w, `Name Error`, `This proposition name is already bound in the context.`)
                        ],
                        ...pc]])));
            },
            lem: (e, g) => {
                const { w, i, t, d, b } = e, tn = t ? reduce(t) : { k: 'var', w, d: [] }, pc = !t ? [] : closed(t, [...pfx.pi, ...g.pi]);
                return call(main(d, { ...g,
                    tau: tn }), ([df, dm]) => {
                    return call(main(b, pc.length !== 0 ? g : { ...g,
                        sigma: [...g.sigma, { i, t: tn }] }), ([bf, bm]) => cc(check(e, g, null, [[...df, ...bf], [...dm, ...bm,
                            ...!proof_bound(i, g.sigma, pfx.sigma) ? [] : [
                                msg(w, `Name Error`, `This proof name is already bound in the context.`)
                            ],
                            ...pc]])));
                });
            },
            spe: (e, g) => {
                g = specialize(pfx, g);
                const { w, l, r } = e, pc = closed(r, [...pfx.pi, ...g.pi]), tl = { k: 'var', w, d: [] };
                return call(main(l, { ...g, tau: tl }), ([lf, lm]) => {
                    const lpp = aka(tl, [...pfx.rho, ...g.rho]), pu = lpp.k === 'uni', lp = pc.length === 0 && pu ? substitute(lpp.b, lpp.i, reduce(r)) : null;
                    return cc(check(e, g, lp, [lf, [...lm,
                            ...pu ? [] : [
                                msg(l.w, `Judgment Error`, `This proof is specialized, but its proposition is not quantified.`)
                            ],
                            ...pc]]));
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
                return cc(check(e, g, null, [[], []]));
            }
        }));
        return main;
    };
    return (eps, pfx, g) => save(pfx)(eps, g);
});
export const look_up_proposition = (i, ctx) => ctx.findLast(({ i: ip }) => ip === i), look_up_proof = (i, ctx, pfx) => cascade(ctx => ctx.findLast(({ i: ip }) => ip === i), ctx, pfx), reduce = run(({ proc, call, cc, ret }) => {
    const quantifier = ({ i, b, ...z }) => call(main(b), b => ret({ i, b, ...z })), main = proc(visit_proposition({
        imp: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => ret({ l, r, ...z }))),
        app: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => di(l, lp => lp.k === 'lam' ? ret(substitute(lp.b, lp.i, r)) :
            ret({ l, r, ...z })))),
        var: ({ d, ...z }) => d[0] ? cc(main(d[0])) :
            ret({ d, ...z }),
        uni: quantifier, lam: quantifier,
        ref: ret, err: ret
    }));
    return main;
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
    return (tau, rho) => save(rho)(tau);
}), scan_article = (a, get_import) => {
    const exp = run(({ proc, cc, ret }) => {
        const inner = proc(visit_statement({
            imp: ({ a, i }, pfx, exp) => {
                const data = get_import(i);
                return cc(main(a, !data ? pfx : { ...pfx,
                    sigma: [...pfx.sigma, ...data.sigma],
                    pi: [...pfx.pi, ...data.pi] }, exp));
            },
            exf: ({ a, i }, pfx, exp) => {
                const u = pfx.sigma.find(({ i: ip }) => i === ip);
                return cc(main(a, pfx, !u ? exp :
                    { ...exp, sigma: [...exp.sigma, u] }));
            },
            prt: ({ a }, pfx, exp) => cc(main(a, pfx, exp)),
            def: ({ a, i, d }, pfx, exp) => cc(main(a, { ...pfx,
                pi: [...pfx.pi, i],
                rho: [...pfx.rho, { i, d }] }, exp)),
            thm: ({ a, i, t }, pfx, exp) => cc(main(a, { ...pfx,
                sigma: [...pfx.sigma, { i, t }] }, exp))
        })), main = proc((e, pfx, exp) => e ? cc(inner(e, pfx, exp)) : ret(exp));
        return main;
    })(a, { sigma: [], rho: [], pi: [] }, { sigma: [], pi: [] });
    exp.pi.push(...uniques(exp.sigma.map(({ t }) => free_references(t)).flat(1)));
    return exp;
}, check_article = (a, get_import) => run(({ proc, cc, ret }) => {
    const inner = proc(visit_statement({
        imp: ({ a, w, i }, pfx, [sf, f, m]) => {
            const data = get_import(i);
            return cc(main(a, !data ? pfx : { ...pfx,
                sigma: [...pfx.sigma, ...data.sigma],
                pi: [...pfx.pi, ...data.pi] }, [sf, f, [...m,
                    ...data ? [] : [msg(w, 'Import Error', 'No such file.')]]]));
        },
        exf: ({ a, w, i }, pfx, [sf, f, m]) => {
            return cc(main(a, pfx, [sf, f, [...m,
                    ...pfx.sigma.some(({ i: ip }) => i === ip) ? [] : [
                        msg(w, 'Name Error', `This proof name is not bound in the context.`)
                    ]]]));
        },
        prt: ({ a, w, d }, pfx, [sf, f, m]) => {
            const dp = aka(reduce(d), pfx.rho);
            return cc(main(a, pfx, [sf, f, [...m, msg(w, 'Query', dp)]]));
        },
        def: (e, pfx, [sf, f, m]) => {
            const { a, w, i, d } = e, pb = proposition_bound0(i, pfx.pi), pc = closed(d, pfx.pi);
            return cc(main(a, pb || pc.length !== 0 ? pfx : { ...pfx,
                pi: [...pfx.pi, i],
                rho: [...pfx.rho, { i, d }] }, [[...sf, [e, pfx]], f, [...m,
                    ...!pb ? [] : [
                        msg(w, `Name Error`, `The proposition name of this definition is bound in the context.`)
                    ],
                    ...pc]]));
        },
        thm: (e, pfx, [sf, f, m]) => {
            const { a, w, i, t, d } = e, pb = !proof_bound0(i, pfx.sigma), pc = !t ? [] : closed(t, pfx.pi);
            const tp = reduce(t);
            let [pp, pm] = check_proof(d, pfx, { tau: tp, sigma: [], rho: [], pi: [], hi: [] });
            return cc(main(a, { ...pfx, sigma: [...pfx.sigma, { i, t: tp }] }, [[...sf, [e, pfx]], [...f, ...pp], [...m,
                    ...pb ? [] : [
                        msg(w, `Name Error`, `The proof name of this theorem is bound in the context.`)
                    ],
                    ...pc,
                    ...pm]]));
        }
    })), main = proc((e, pfx, f) => e ? cc(inner(e, pfx, f)) : ret(f));
    return main;
})(a, { sigma: [], rho: [], pi: [] }, [[], [], []]);
//# sourceMappingURL=check.js.map