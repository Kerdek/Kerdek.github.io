import { run } from "./run.js";
import { di } from "./di.js";
import { visit_proposition, visit_proof, msg, empty_context } from "./lang.js";
const proposition_bound = (i, { rho, pi }) => rho.some(({ i: ip }) => ip === i) ||
    pi.some(ip => ip === i), 
// proposition_defined = (i: Identifier, rho: Rho) =>
//   rho.some(({ i: ip }) => ip === i),
proof_bound = (i, sigma) => sigma.some(({ i: ip }) => ip === i), lookup_definition = (i, rho) => rho.findLast(({ i: ip }) => ip === i), lookup_proof = (i, sigma) => sigma.findLast(({ i: ip }) => ip === i), free_from = run(({ proc, call, cc, ret }) => {
    const save = (iota) => {
        const main = proc(visit_proposition({
            lam: ({ i, b }) => i === iota ? ret(true) :
                cc(main(b)),
            imp: ({ l, r }) => call(main(l), dl => dl ? cc(main(r)) :
                ret(false)),
            app: ({ l, r }) => call(main(l), dl => dl ? cc(main(r)) :
                ret(false)),
            ref: ({ i }) => ret(i !== iota),
            var: ({ d }) => d[0] ? cc(main(d[0])) :
                ret(true),
            err: ({}) => ret(true)
        }));
        return main;
    };
    return (tau, iota) => save(iota)(tau);
}), occurs = run(({ proc, call, cc, ret }) => {
    const save = (v, s) => {
        const main = proc(visit_proposition({
            lam: ({ b }) => cc(main(b)),
            imp: ({ l, r }) => call(main(l), dl => dl ? ret(true) :
                cc(main(r))),
            app: ({ l, r }) => call(main(l), dl => dl ? ret(true) :
                cc(main(r))),
            ref: ({}) => ret(false),
            var: ({ d }) => d[0] ? cc(main(d[0])) :
                d === v ? ret(true) :
                    di(s.get(d), r => !r ? ret(false) :
                        cc(main(r))),
            err: ({}) => ret(false)
        }));
        return main;
    };
    return (tau, iota, s) => save(iota, s)(tau);
}), free_variables = run(({ proc, call, ret }) => {
    const main = proc(visit_proposition({
        lam: ({ i, b }) => call(main(b), b => ret(b.filter(ip => ip !== i))),
        imp: ({ l, r }) => call(main(l), l => call(main(r), r => ret([...new Set([...l, ...r])]))),
        app: ({ l, r }) => call(main(l), l => call(main(r), r => ret([...new Set([...l, ...r])]))),
        ref: ({ i }) => ret([i]),
        var: ({}) => ret([]),
        err: ({}) => ret([])
    }));
    return main;
}), 
// defined_variables = run(<P, R>({ proc, call, cc, ret }: Run<Pi, P, R>) => {
//   const save = (rho: Rho) => {
//   const main: (tau: Proposition) => P = proc(visit_proposition({
//     lam: ({ i, b }) =>
//       call(main(b), b =>
//       ret(b.filter(ip => ip !== i))),
//     imp: ({ l, r }) =>
//       call(main(l), l =>
//       call(main(r), r =>
//       ret([...new Set([...l, ...r])]))),
//     app: ({ l, r }) =>
//       call(main(l), l =>
//       call(main(r), r =>
//       ret([...new Set([...l, ...r])]))),
//     ref: ({ i }) =>
//       ret(proposition_defined(i, rho) ? [i] : []),
//     top: ({ d }) =>
//       d[0] ? cc(main(d[0])) :
//       ret([]),
//     bot: ({ d }) =>
//       d[0] ? cc(main(d[0])) :
//       ret([]),
//     err: ({ }) =>
//       ret([]) }))
//   return main }
//   return (tau: Proposition, rho: Rho) => save(rho)(tau) }),
closed = run(({ proc, call, cc, ret }) => {
    const main = proc(visit_proposition({
        lam: ({ i, b }, { rho, pi }) => cc(main(b, { rho, pi: [...pi, i] })),
        imp: ({ l, r }, delta) => call(main(l, delta), dx => !dx ? ret(false) :
            cc(main(r, delta))),
        app: ({ l, r }, delta) => call(main(l, delta), dx => !dx ? ret(false) :
            cc(main(r, delta))),
        ref: ({ i }, delta) => ret(proposition_bound(i, delta)),
        var: ({}, {}) => ret(true),
        err: ({}, {}) => ret(true)
    }));
    return main;
}), prime = (i) => `${i}'`, alpha_rename = run(({ proc, call, cc, ret }) => {
    const save = (iota, ip) => {
        const rename = proc(({ i, b, ...z }, ip, fv) => !fv.some(ipp => ipp === ip) ?
            call(save(i, ip)(b), b => call(main(b), b => ret({ i: ip, b, ...z }))) :
            cc(rename({ i, b, ...z }, prime(ip), fv)));
        const main = proc(visit_proposition({
            lam: ({ i, b, ...z }) => i === iota ? ret({ i, b, ...z }) :
                i !== ip ?
                    call(main(b), b => ret({ i, b, ...z })) :
                    cc(rename({ i, b, ...z }, prime(i), [...new Set([...free_variables({ i, b, ...z }), ip])])),
            imp: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => ret({ l, r, ...z }))),
            app: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => ret({ l, r, ...z }))),
            ref: ({ i, ...z }) => ret({ i: i === iota ? ip : i, ...z }),
            var: ret,
            err: ret
        }));
        return main;
    };
    return (tau, iota, ip) => save(iota, ip)(tau);
}), apply = run(({ proc, call, cc, ret }) => {
    const save0 = (s) => {
        const save1 = (rho) => {
            const rename = proc(({ i, b, ...z }, ip, fv, rho) => !fv.some(ipp => ipp === ip) ?
                di(alpha_rename(b, i, ip), b => call(save1(rho.filter(({ i: ip }) => ip !== i))(b), b => ret({ i: ip, b, ...z }))) :
                cc(rename({ i, b, ...z }, prime(ip), fv, rho)));
            const main = proc(visit_proposition({
                lam: ({ i, b, ...z }) => [...s].every(([, tau]) => free_from(tau, i)) ?
                    call(save1(rho.filter(({ i: ip }) => ip !== i))(b), b => ret({ i, b, ...z })) :
                    cc(rename({ i, b, ...z }, prime(i), [...new Set([...free_variables({ i, b, ...z }), ...[...s].map(([, tau]) => free_variables(tau)).flat(1)])], rho)),
                imp: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => ret({ l, r, ...z }))),
                app: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => di(plain(l), lp => lp.k === "lam" ? ret(substitute(lp.b, lp.i, r, rho)) :
                    ret({ l, r, ...z })))),
                ref: ret,
                var: ({ d, ...z }) => d[0] ?
                    call(main(d[0]), dr => (d[0] = dr,
                        ret(dr))) :
                    di(s.get(d), r => !r ? ret({ d, ...z }) :
                        call(main(r), dr => (d[0] = dr,
                            ret(dr)))),
                err: ret
            }));
            return main;
        };
        return save1;
    };
    return (tau, s, rho) => save0(s)(rho)(tau);
}), plain = run(({ proc, cc, ret }) => {
    const main = proc(visit_proposition({
        lam: ret,
        imp: ret,
        app: ret,
        ref: ret,
        var: ({ d, ...z }) => d[0] ? cc(main(d[0])) :
            ret({ d, ...z }),
        err: ret
    }));
    return main;
}), substitute = run(({ proc, call, cc, ret }) => {
    const save0 = (iota, tau) => {
        const save1 = (rho) => {
            const rename = proc(({ i, b, ...z }, ip, fv, rho) => !fv.some(ipp => ipp === ip) ?
                di(alpha_rename(b, i, ip), b => call(save1(rho.filter(({ i: ip }) => ip !== i))(b), b => ret({ i: ip, b, ...z }))) :
                cc(rename({ i, b, ...z }, prime(ip), fv, rho)));
            const main = proc(visit_proposition({
                lam: ({ i, b, ...z }) => i === iota ? ret({ i, b, ...z }) :
                    free_from(tau, i) ?
                        call(save1(rho.filter(({ i: ip }) => ip !== i))(b), b => ret({ i, b, ...z })) :
                        cc(rename({ i, b, ...z }, prime(i), [...new Set([...free_variables({ i, b, ...z }), ...free_variables(tau)])], rho)),
                imp: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => ret({ l, r, ...z }))),
                app: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => di(plain(l), lp => lp.k === "lam" ? cc(save0(lp.i, r)(rho)(lp.b)) :
                    ret({ l, r, ...z })))),
                ref: ({ i, ...z }) => ret(i === iota ? tau : { i, ...z }),
                var: ret,
                err: ret
            }));
            return main;
        };
        return save1;
    };
    return (taup, iota, tau, rho) => save0(iota, tau)(rho)(taup);
}), 
// eliminate = run(<P, R>({ proc, call, cc, ret }: Run<Proposition, P, R>) => {
//   const main: (tau: Proposition, rho: Rho) => P = proc(visit_proposition({
//     lam: ({ i, b, ...z }, rho) =>
//       call(main(b, rho.filter(({ i: ip }) => ip !== i)), b =>
//       ret({ i, b, ...z })),
//     imp: ({ l, r, ...z }, rho) =>
//       call(main(l, rho), l =>
//       call(main(r, rho), r =>
//       ret({ l, r, ...z }))),
//     app: ({ l, r, ...z }, rho) =>
//     call(main(l, rho), l =>
//     call(main(r, rho), r =>
//       ret(l.k === "lam" ? substitute(l.b, l.i, r, rho) : { l, r, ...z }))),
//     ref: (u, _rho) =>
//       ret(u),
//     top: ({ d, ...z }, rho) =>
//       d[0] ? cc(main(d[0], rho)) :
//       ret({ d, ...z }),
//     bot: ({ d, ...z }, rho) =>
//       d[0] ? cc(main(d[0], rho)) :
//       ret({ d, ...z }),
//     err: ret }))
//   return main }),
// expand = run(<P, R>({ proc, call, cc, ret }: Run<Proposition, P, R>) => {
//   const main: (tau: Proposition, rho: Rho) => P = proc(visit_proposition({
//     lam: ({ i, b, ...z }, rho) =>
//       call(main(b, rho.filter(({ i: ip }) => ip !== i)), b =>
//       ret({ i, b, ...z })),
//     imp: ({ l, r, ...z }, rho) =>
//       call(main(l, rho), l =>
//       call(main(r, rho), r =>
//       ret({ l, r, ...z }))),
//     app: ({ l, r, ...z }, rho) =>
//     call(main(l, rho), l =>
//     call(main(r, rho), r =>
//       ret(l.k === "lam" ? substitute(l.b, l.i, r, rho) : { l, r, ...z }))),
//     ref: ({ i, ...z }, rho) =>
//       di(lookup_definition(i, rho), u =>
//       !u ? ret({ i, ...z }) :
//       cc(main(u.d, rho))),
//     var: ({ d, ...z }, rho) =>
//       d[0] ? cc(main(d[0], rho)) :
//       ret({ d, ...z }),
//     err: ret }))
//   return main }),
beta_equivalent = run(({ proc, call, cc, ret }) => {
    const save = (rho) => {
        const conjoint = proc((x, y, s, spec) => x === y ? ret(s) :
            // x.k === "err" || y.k === "err" ||
            x.k === "lam" && y.k === "imp" ?
                ret(false) :
                x.k === "var" ?
                    y.k === 'var' && x.d === y.d ? ret(s) :
                        x.d[0] ? cc(main(x.d[0], y, s, spec)) :
                            di(s.get(x.d), d => d ?
                                cc(main(d, y, s, spec)) :
                                occurs(y, x.d, s) ? ret(null) :
                                    ret(new Map([...s, [x.d, y]]))) :
                    y.k === "var" ?
                        y.d[0] ? cc(main(x, y.d[0], s, spec)) :
                            di(s.get(y.d), d => d ?
                                cc(main(x, d, s, spec)) :
                                occurs(x, y.d, s) ? ret(null) :
                                    ret(new Map([...s, [y.d, x]]))) :
                        x.k === "ref" && y.k === "ref" ?
                            ret(x.i === y.i ? s : null) :
                            y.k === "lam" ?
                                spec ?
                                    di(query(x, rho), x => x.k === "lam" ?
                                        di({ k: 'var', w: y.w, d: [{ k: 'err', w: y.w }] }, (v) => di(substitute(x.b, x.i, v, rho), xp => di(substitute(y.b, y.i, v, rho), yp => call(main(xp, yp, s, false), r => r ? ret(r) :
                                            di(substitute(y.b, y.i, { k: 'var', w: y.w, d: [] }, rho), yp => cc(main(x, yp, s, true))))))) :
                                        di(substitute(y.b, y.i, { k: 'var', w: y.w, d: [] }, rho), yp => cc(main(x, yp, s, true)))) :
                                    di(query(x, rho), x => x.k === "lam" ?
                                        di({ k: 'var', w: y.w, d: [{ k: 'err', w: y.w }] }, (v) => di(substitute(x.b, x.i, v, rho), x => di(substitute(y.b, y.i, v, rho), y => cc(main(x, y, s, false))))) :
                                        ret(false)) :
                                y.k === "imp" ?
                                    di(query(x, rho), x => x.k === "imp" ?
                                        call(main(x.l, y.l, s, false), l => l ? cc(main(x.r, y.r, l, false)) :
                                            ret(l)) :
                                        ret(false)) :
                                    x.k === "app" && y.k === "app" ?
                                        call(main(x.l, y.l, s, false), l => l ? call(main(x.r, y.r, l, false), r => ret(r || null)) :
                                            ret(l || null)) :
                                        ret(null));
        const main = proc((x, y, s, spec) => call(conjoint(x, y, s, spec), r => r !== null ? ret(r) :
            di(query(x, rho), x => di(query(y, rho), y => cc(conjoint(x, y, s, spec))))));
        return main;
    };
    return (x, y, rho) => save(rho)(x, y, new Map(), true);
}), check_proof = run(({ proc, call, cc, ret }) => {
    const save = (pfx) => {
        const proposition_bound_pfx = (i, delta) => proposition_bound(i, delta) || proposition_bound(i, pfx);
        const proof_bound_pfx = (i, { sigma }) => proof_bound(i, sigma) || proof_bound(i, pfx.sigma);
        const closed_pfx = (tau, { rho, pi }) => closed(tau, { rho: [...pfx.rho, ...rho], pi: [...pfx.pi, ...pi] });
        const lookup_proof_pfx = (i, sigma) => lookup_proof(i, sigma) || lookup_proof(i, pfx.sigma);
        const reduce_pfx = (tau, rho) => reduce(tau, [...pfx.rho, ...rho]);
        const query_pfx = (tau, rho) => query(tau, [...pfx.rho, ...rho]);
        const check = proc((w, g, [tau, m], e, c) => e.length !== 0 ? ret([g.tau, [...m, msg(w, "Judgment Error", g, ...e, ...c)]]) :
            di(beta_equivalent(g.tau, tau, [...pfx.rho, ...g.rho]), r => r ?
                ret([apply(g.tau, r, [...pfx.rho, ...g.rho]), [...m, ...c.length === 0 ? [] : [msg(w, "Judgment Error", g, ...c)]]]) :
                ret([g.tau, [...m,
                        msg(w, "Judgment Error", g, "This proof does not show the goal.", tau, ...c)]])));
        const main = proc(visit_proof({
            uni: ({ w, i, b }, g) => di(query_pfx(g.tau, g.rho), tp => (tp.k === 'var' && (tp.d[0] = { k: 'lam', w, i, b: { k: 'var', w, d: [] } }, tp = tp.d[0]),
                call(main(b, { ...g,
                    tau: tp.k === 'lam' ? alpha_rename(tp.b, tp.i, i) :
                        { k: 'var', w, d: [] },
                    pi: [...g.pi, i] }), ([b, bm]) => cc(check(w, g, [{ k: 'lam', w, i, b }, bm], [
                    ...tp.k === 'lam' ? [] : [
                        `The goal of this introduction is not a lambda.`
                    ]
                ], [
                    ...!proposition_bound_pfx(i, g) ? [] : [
                        `The proposition name of this introduction is bound in the context.`
                    ]
                ]))))),
            cdp: ({ w, i, t, b }, g) => di(!proof_bound_pfx(i, g), pb => di(!t || closed_pfx(t, g), pc => di(t && reduce_pfx(t, g.rho), tn => di(query_pfx(g.tau, g.rho), tp => (tp.k === 'var' && (tp.d[0] = { k: 'imp', w, l: { k: 'var', w, d: [] }, r: { k: 'var', w, d: [] } }, tp = tp.d[0]),
                di(tn || (tp.k === 'imp' ? tp.l : { k: 'var', w, d: [] }), (l) => call(main(b, { ...g,
                    ...pb && pc ? {
                        tau: tp.k === 'imp' ? tp.r : { k: 'var', w, d: [] },
                        sigma: [...g.sigma, { i, t: l }]
                    } : {} }), ([r, rm]) => cc(check(w, g, [{ k: 'imp', w, l, r }, rm], [
                    ...tp.k === 'imp' ? [] : [
                        `The goal of this conditional proof is not an arrow.`
                    ]
                ], [
                    ...pb ? [] : [
                        `The proof name of this conditional proof is bound in the context.`
                    ],
                    ...pc ? [] : [
                        `The proposition of this conditional proof is not closed.`
                    ]
                ]))))))))),
            def: ({ w, i, d, b }, g) => di(reduce_pfx(d, g.rho), dn => di(!proposition_bound_pfx(i, g), pb => di(closed_pfx(d, g), pc => call(main(b, { ...g,
                ...pb && pc ? { rho: [...g.rho, { i, d: dn }] } : {} }), ([u, um]) => cc(check(w, g, [substitute(u, i, dn, g.rho), um], [], [
                ...pb ? [] : [
                    `The proposition name of this definition is bound in the context.`
                ],
                ...pc ? [] : [
                    `The proposition of this definition is not closed.`
                ]
            ])))))),
            lem: ({ w, i, t, d, b }, g) => di(t && reduce_pfx(t, g.rho), tn => call(main(d, { ...g,
                tau: tn || { k: 'var', w, d: [] } }), ([d, dm]) => call(main(b, { ...g,
                sigma: [...g.sigma, { i, t: tn || d }] }), ([b, bm]) => cc(check(w, g, [b, [...dm, ...bm]], [], [
                ...!proof_bound_pfx(i, g) ? [] : [
                    `The proof name of this lemma is bound in the context.`
                ],
                ...!t || closed_pfx(t, g) ? [] : [
                    `The proposition of this lemma is not closed.`
                ]
            ]))))),
            spe: ({ w, l, r }, g) => call(main(l, { ...g,
                tau: { k: 'var', w, d: [] } }), ([l, lm]) => cc(check(w, g, [reduce_pfx({ k: 'app', w, l, r }, g.rho), lm], [], [
                ...closed_pfx(r, g) ? [] : [
                    `The right side of this specialization is not closed.`
                ]
            ]))),
            mop: ({ w, l, r }, g) => di({ k: 'var', w, d: [] }, (v) => call(main(l, { ...g,
                tau: { k: 'imp', w, l: v, r: g.tau } }), ([_l, lm]) => call(main(r, { ...g,
                tau: v }), ([_r, rm]) => ret([g.tau, [...lm, ...rm]])))),
            coe: ({ w, l, r }, g) => di(closed_pfx(r, g), rc => call(main(l, { ...g,
                tau: reduce_pfx(r, g.rho) }), ([l, lm]) => cc(check(w, g, [l, lm], [], [
                ...rc ? [] : [
                    `The proposition of this coercion is not closed.`
                ]
            ])))),
            ref: ({ w, i }, g) => di(lookup_proof_pfx(i, g.sigma), u => cc(check(w, g, [u ? u.t : { k: 'err', w }, []], [
                ...u ? [] : [
                    `The proof name of this reference is not bound in the context.`
                ]
            ], []))),
            prt: ({ w, d, b }, g) => call(main(b, g), ([b, bm]) => di(query_pfx(reduce_pfx(d, g.rho), g.rho), dp => cc(check(w, g, [b, [
                    msg(w, "Query", dp), ...bm
                ]], [], [])))),
            err: ({ w }, g) => ret([g.tau, [
                    msg(w, "Goal", g)
                ]])
        }));
        return main;
    };
    return (eps, pfx, g) => save(pfx)(eps, g);
});
export const query = run(({ proc, call, cc, ret }) => {
    const save = (rho, semi) => {
        const main = proc(visit_proposition({
            lam: ret,
            imp: ret,
            app: ({ l, r, ...z }) => call(save(rho, false)(l), l => l.k === "lam" ? cc(main(substitute(l.b, l.i, r, rho))) :
                ret({ l, r, ...z })),
            ref: ({ i, ...z }) => semi ? ret({ i, ...z }) :
                di(lookup_definition(i, rho), u => !u ? ret({ i, ...z }) :
                    cc(main(u.d))),
            var: ({ d, ...z }) => d[0] ? cc(main(d[0])) :
                ret({ d, ...z }),
            err: ret
        }));
        return main;
    };
    return (tau, rho) => save(rho, false)(tau);
}), reduce = run(({ proc, call, ret }) => {
    const save = (rho) => {
        const main = proc(visit_proposition({
            lam: ({ i, b, ...z }) => call(save(rho.filter(({ i: ip }) => ip !== i))(b), b => ret({ i, b, ...z })),
            imp: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => ret({ l, r, ...z }))),
            app: ({ l, r, ...z }) => call(main(l), l => call(main(r), r => di(plain(l), lp => lp.k === "lam" ? ret(substitute(lp.b, lp.i, r, rho)) :
                ret({ l, r, ...z })))),
            ref: ret,
            var: ({ d, ...z }) => d[0] ?
                call(main(d[0]), dr => (d[0] = dr,
                    ret(dr))) :
                ret({ d, ...z }),
            err: ret
        }));
        return main;
    };
    return (tau, rho) => save(rho)(tau);
}), check_article = (a, pfx) => {
    const m = [];
    const ctx = empty_context();
    for (const e of a) {
        if (e.k === 'def') {
            const { w, i, d } = e;
            const c = [];
            if (proposition_bound(i, pfx)) {
                c.push(`The proposition name of this definition is bound in the context.`);
            }
            if (!closed(d, pfx)) {
                c.push(`The proposition of this definition is not closed.`);
            }
            if (c.length !== 0) {
                m.push(msg(w, "Judgment Error", ...c));
            }
            else {
                pfx.rho.unshift({ i, d });
                ctx.rho.unshift({ i, d });
            }
        }
        else if (e.k === 'prt') {
            const { w, d } = e;
            const dp = query(reduce(d, pfx.rho), pfx.rho);
            m.push(msg(w, "Query", dp));
        }
        else /*e.kind === 'thm'*/ {
            let { w, i, t, d } = e;
            const c = [];
            if (proof_bound(i, pfx.sigma)) {
                c.push(`The proof name of this theorem is bound in the context.`);
            }
            if (t && !closed(t, pfx)) {
                c.push(`The proposition of this theorem is not closed.`);
            }
            t = reduce(t, pfx.rho);
            let [_tp, g] = check_proof(d, pfx, { ...empty_context(),
                tau: t });
            if (c.length !== 0) {
                m.push(msg(w, "Judgment Error", ...c));
            }
            pfx.sigma.unshift({ i, t });
            ctx.sigma.unshift({ i, t });
            m.push(...g);
        }
    }
    return [ctx, m];
};
//# sourceMappingURL=check.js.map