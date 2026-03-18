import { run } from './run.js';
import { di, uniques } from '../common/util/di.js';
import { msg, look_up_proposition_rho, proposition_bound_pi, safe, undefine } from './context.js';
import { visit_proposition } from './abstract.js';
export const uni = (w, i, b) => ({ k: 'uni', w, i, b }), imp = (w, l, r) => ({ k: 'imp', w, l, r }), mvar = (w, d) => ({ k: 'var', w, d }), reference_occurs_free = run(({ proc, call, cc, ret }) => {
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
            ref: ({ w, i }) => ret(proposition_bound_pi(i)(ctx) ? [] : [
                msg(w, `Name Error`, `This proposition name is not bound in the context.`)
            ])
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
            ref: e => di(look_up_proposition_rho(e.i)(rho), u => !u ? ret(e) :
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
} return t; }, reduce = run(({ proc, call, cc, ret }) => {
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
            ref: e => di(look_up_proposition_rho(e.i)(rho), u => !u ? ret(e) :
                call(main(u.d), d => ret({ ...d }))),
            var: e => e.d[0] ? cc(main(e.d[0])) :
                ret(e),
            uni: quantifier, lam: quantifier,
            imp: ret, err: ret
        }));
        return main;
    };
    return (tau, rho) => save(rho)(tau);
}), gamma = (rho) => run(({ proc, call, ret }) => {
    const main = proc((t) => di(query(t, rho), tp => tp.k === 'uni' ?
        ret(tp) :
        tp.k === 'imp' ?
            call(main(tp.r), dr => dr.k !== 'uni' ? ret(t) :
                reference_occurs_free(tp.l, dr.i) ?
                    di(safe(dr.i, uniques([...free_references(tp.l), ...free_references(dr.b)])), ip => di(rename(dr.b, dr.i, ip), r => ret({ ...uni(t.w, ip, imp(dr.w, tp.l, r)), o: t }))) :
                    ret({ ...uni(t.w, dr.i, imp(dr.w, tp.l, dr.b)), o: t })) :
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
});
//# sourceMappingURL=proposition.js.map