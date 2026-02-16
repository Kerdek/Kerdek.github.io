import { run } from './run.js';
import { tr } from '../common/util/di.js';
import { msg } from './context.js';
export const read_comments = (s) => {
    const { wl, nl, ch, cl, cb } = s, r = [];
    for (;;) {
        if (nl()) {
            continue;
        }
        const wlu = wl();
        if (wlu) {
            continue;
        }
        const chu = ch();
        if (chu) {
            r.push(chu);
            continue;
        }
        const clu = cl();
        if (clu) {
            r.push(clu);
            for (;;) {
                if (nl()) {
                    continue;
                }
                const cbu = cb();
                if (cbu && cbu.text.length !== 0) {
                    r.push(cbu);
                    if (cbu.text.endsWith('*)')) {
                        break;
                    }
                    continue;
                }
                break;
            }
            continue;
        }
        break;
    }
    return r;
}, read_proposition = run(({ proc, branch, call, cc, ret }) => (s) => {
    const { pos, pp, al, lm, dt, lp, rp, op } = s, universal = proc((l) => {
        const w = pos(), wli = read_comments(s), dtu = dt('proposition');
        if (dtu) {
            return call(main, b => {
                return ret({ k: 'dot', m: [],
                    ...l ? { l } : {},
                    wli, dtu, b });
            });
        }
        const i = pp();
        return call(i ? universal(null) : main, b => {
            return ret({ k: 'uni', m: [
                    ...i ? [] : [
                        msg(w, `Syntax Error`, `A proposition name or \`.\` is expected here.`)
                    ]
                ],
                ...l ? { l } : {}, wli, ...i ? { i } : {}, b });
        });
    }), lambda = proc((l) => {
        const w = pos(), wli = read_comments(s), dtu = dt('proposition');
        if (dtu) {
            return call(main, b => {
                return ret({ k: 'dot', m: [],
                    ...l ? { l } : {},
                    wli, dtu, b });
            });
        }
        const i = pp();
        return call(i ? lambda(null) : main, b => {
            return ret({ k: 'lam', m: [
                    ...i ? [] : [
                        msg(w, `Syntax Error`, `A proposition name or \`.\` is expected here.`)
                    ]
                ],
                ...l ? { l } : {}, wli, ...i ? { i } : {}, b });
        });
    }), parens = proc((lpu) => {
        return call(main, b => {
            const wrp = pos(), rpu = rp();
            return ret({ k: 'par', m: [
                    ...rpu ? [] : [
                        msg({ begin: lpu.w.begin, end: wrp }, `Syntax Error`, `\`(\` here is not matched.`)
                    ]
                ],
                lpu, b, ...rpu ? { rpu } : {} });
        });
    }), reference = proc((i) => ret({ k: 'ref', m: [], i })), primary = () => tr(al('proposition'), universal) ||
        tr(lm('proposition'), lambda) ||
        tr(lp(), parens) ||
        tr(pp(), reference), rhs = proc((l) => {
        const wlr = read_comments(s);
        const u = primary();
        if (!u) {
            return ret({ k: 'trl', m: [], l, wlr });
        }
        return call(u, r => cc(rhs({ k: 'app', m: [], l, wlr, r })));
    }), lhs = branch(() => {
        const wa = pos(), wab = read_comments(s);
        return call(branch(() => {
            const w = { begin: wa, end: pos() }, u = primary();
            if (!u) {
                return cc(rhs({ k: 'err', m: [
                        msg(w, `Syntax Error`, 'A proposition is expected here.')
                    ],
                    w }));
            }
            return call(u, x => {
                return cc(rhs(x));
            });
        }), b => {
            return ret({ k: 'led', m: [], wab, b });
        });
    }), arrow = branch(() => {
        return call(lhs, l => {
            const o = op();
            if (!o) {
                return ret(l);
            }
            return call(main, r => {
                return ret({ k: 'imp', m: [], l, aru: o, r });
            });
        });
    }), main = arrow;
    return main;
}), read_proof = run(({ proc, branch, call, cc, ret }) => (s) => {
    const { pos, pp, pf, dt, lp, rp, lb, rb, cn, ce, ui, cp, ll, le, lm, pt } = s, universal = proc((l) => {
        const w = pos(), wli = read_comments(s), dtu = dt('proof');
        if (dtu) {
            return call(lead, b => {
                return ret({ k: 'dot', m: [], ...l ? { l } : {}, wldt: wli, dtu, b });
            });
        }
        const i = pp();
        return call(i ? universal(null) : lead, b => {
            return ret({ k: 'uni', m: [
                    ...i ? [] : [
                        msg(w, `Syntax Error`, `A proposition name or \`.\` is expected here.`)
                    ]
                ],
                ...l ? { l } : {}, wli, ...i ? { i } : {}, b });
        });
    }), premise = proc((l) => {
        const wi = pos(), wli = read_comments(s), i = pf(), wicn = read_comments(s), cnu = cn('proof'), t = cnu && read_proposition(s), wdt = pos(), dtu = dt('proof');
        return call(lead, b => {
            const m = [
                ...i ? [] : [
                    msg(wi, `Syntax Error`, `An identifier is expected here.`)
                ],
                ...dtu ? [] : [
                    msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                ]
            ];
            return ret(t ? { k: 'cdt', m,
                l, wli, i, wicn, cnu, t, ...dtu ? { dtu } : {}, b } :
                { k: 'cdp', m,
                    l, wli, i, wicn, ...dtu ? { dtu } : {}, b });
        });
    }), definition = proc((l) => {
        const wli = read_comments(s), wi = pos(), i = pp(), wce = pos(), wice = read_comments(s), ceu = ce('proof'), d = read_proposition(s), wdt = pos(), dtu = dt('proof');
        return call(lead, b => {
            return ret({ k: 'def', m: [
                    ...i ? [] : [
                        msg(wi, `Syntax Error`, `A proposition name is expected here.`)
                    ],
                    ...ceu ? [] : [
                        msg(wce, `Syntax Error`, `\`:=\` is expected here.`)
                    ],
                    ...dtu ? [] : [
                        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                    ]
                ],
                l, wli, ...i ? { i } : i, wice, ...ceu ? { ceu } : {}, ...dtu ? { dtu } : {}, d, b });
        });
    }), lemma = proc((l) => {
        const wi = pos(), wli = read_comments(s), i = pf(), wicn = read_comments(s), wcn = pos(), ceup = ce('proof'), cnu = !ceup && cn('proof'), t = cnu && read_proposition(s), ceu = ceup || ce('proof');
        return call(lead, d => {
            const wdt = pos(), dtu = dt('proof');
            return call(lead, b => {
                const m = [
                    ...i ? [] : [
                        msg(wi, `Syntax Error`, `An identifier is expected here.`)
                    ],
                    ...ceu ? [] : [
                        msg(wcn, `Syntax Error`, `\`:\` or \`:=\` is expected here.`)
                    ],
                    ...dtu ? [] : [
                        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                    ]
                ];
                return ret(t ?
                    { k: 'let', m, l, wli, i, wicn, cnu, t, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {}, b } :
                    { k: 'lem', m, l, wli, i, wicn, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {}, b });
            });
        });
    }), print = proc((l) => {
        const d = read_proposition(s), wdt = pos(), dtu = dt('proof');
        return call(lead, b => {
            return ret({ k: 'prt', m: [
                    ...dtu ? [] : [
                        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                    ]
                ],
                l, d, ...dtu ? { dtu } : {}, b });
        });
    }), brackets = proc((lbu) => {
        return call(main, b => {
            const wrp = pos(), rbu = rb('proof');
            return ret({ k: 'par', m: [
                    ...rbu ? [] : [
                        msg({ begin: lbu.w.begin, end: wrp }, `Syntax Error`, `\`[\` here is not matched.`)
                    ]
                ],
                lbu, b, ...rbu ? { rbu } : {} });
        });
    }), lambda = proc((l) => {
        const wdt = pos(), wldt = read_comments(s), dtu = dt('proof');
        return call(lead, b => {
            return ret({ k: 'lam', m: [
                    ...dtu ? [] : [
                        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                    ]
                ],
                l, wldt, ...dtu ? { dtu } : {}, b });
        });
    }), reference = proc((i) => ret({ k: 'ref', m: [], i })), primary = () => tr(ui(), universal) ||
        tr(cp(), premise) ||
        tr(ll(), definition) ||
        tr(le(), lemma) ||
        tr(pt('proof'), print) ||
        tr(lb('proof'), brackets) ||
        tr(lm('proof'), lambda) ||
        tr(pf(), reference), prop = () => {
        const lpu = lp();
        if (lpu) {
            const b = read_proposition(s), wrp = pos(), rpu = rp();
            return { k: 'par', m: [
                    ...rpu ? [] : [
                        msg({ begin: lpu.w.begin, end: wrp }, `Syntax Error`, `\`(\` here is not matched.`)
                    ]
                ],
                lpu, b, ...rpu ? { rpu } : {} };
        }
        return null;
    }, rhs = proc((l) => {
        const wlr = read_comments(s), r = prop();
        if (r) {
            return cc(rhs({ k: 'spe', m: [], l, wlr, r }));
        }
        const u = primary();
        if (!u) {
            return ret({ k: 'trl', m: [], l, wlr });
        }
        return call(u, r => {
            return cc(rhs({ k: 'mop', m: [], l, wlr, r }));
        });
    }), lhs = proc((wa) => {
        const w = { begin: wa, end: pos() }, b = prop();
        if (b) {
            return cc(rhs({ k: 'err', m: [
                    msg({ begin: wa, end: pos() }, 'Syntax Error', `A proposition is not allowed here.`)
                ], w, b }));
        }
        const u = primary();
        if (!u) {
            return ret({ k: 'err', m: [], w, b: { k: 'err', m: [], w } });
        }
        return call(u, l => {
            return cc(rhs(l));
        });
    }), lead = branch(() => {
        const wa = pos(), wab = read_comments(s);
        return call(lhs(wa), b => {
            return ret({ k: 'led', m: [], wab, b });
        });
    }), main = lead;
    return main;
}), read_article = run(({ proc, branch, call, cc, ret }) => (s) => {
    const { pos, pp, pf, dt, cn, ce, ip, ep, df, pt, th, nl, dv, li } = s, impor = (l) => proc((wal, m) => {
        const wi = pos(), wli = read_comments(s), i = li(), wdt = pos(), widt = read_comments(s), dtu = dt('top');
        return call(main, a => ret({ a, k: 'imp', m: [...m,
                ...i ? [] : [
                    msg(wi, `Syntax Error`, `A file name is expected here.`)
                ],
                ...dtu ? [] : [
                    msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                ]],
            wal, l, wli, ...i ? { i } : {}, widt, ...dtu ? { dtu } : {} }));
    }), expor = (l) => proc((wal, m) => {
        const wi = pos(), wli = read_comments(s), i = pf(), wdt = pos(), widt = read_comments(s), dtu = dt('top');
        return call(main, a => ret({ a, k: 'exf', m: [...m,
                ...i ? [] : [
                    msg(wi, `Syntax Error`, `An identifier is expected here.`)
                ],
                ...dtu ? [] : [
                    msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                ]],
            wal, l, wli, i, widt, ...dtu ? { dtu } : {} }));
    }), define = (l) => proc((wal, m) => {
        const wli = read_comments(s), i = pp(), wice = read_comments(s), ceu = ce('top'), d = read_proposition(s), wdt = pos(), dtu = dt('top');
        return call(main, a => ret({ a, k: 'def', m: [...m,
                ...i ?
                    ceu ? [] : [
                        msg(i.w.end, `Syntax Error`, `\`:=\` is expected here.`)
                    ] : [
                    msg(l.w.end, `Syntax Error`, `A proposition name is expected here.`)
                ],
                ...dtu ? [] : [
                    msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                ]],
            wal, l, wli, ...i ? { i } : {}, wice, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {} }));
    }), print = (l) => proc((wal, m) => {
        const wld = read_comments(s), d = read_proposition(s), wdt = pos(), dtu = dt('top');
        return call(main, a => ret({ a, k: 'prt', m: [...m,
                ...dtu ? [] : [
                    msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                ]],
            wal, l, wld, d, ...dtu ? { dtu } : {} }));
    }), theorem = (l) => proc((wal, m) => {
        const wi = pos(), wli = read_comments(s), i = pf(), wicn = read_comments(s), wcn = pos(), cnu = cn('top'), t = read_proposition(s), wce = pos(), ceu = ce('top'), d = read_proof(s), wdt = pos(), dtu = dt('top');
        return call(main, a => ret({ a, k: 'thm', m: [...m,
                ...i ? [] : [
                    msg(wi, `Syntax Error`, `An identifier is expected here.`)
                ],
                ...cnu ?
                    ceu ?
                        dtu ? [] : [
                            msg(wdt, `Syntax Error`, `\`.\` is expected here.`)
                        ] : [
                        msg(wce, `Syntax Error`, `\`:=\` is expected here.`)
                    ] : [
                    msg(wcn, `Syntax Error`, '\`:\` is expected here.')
                ]],
            wal, l, wli, i, wicn, ...cnu ? { cnu } : {}, t, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {} }));
    }), main = branch(() => {
        const wal = read_comments(s), w = pos(), dvu = dv(), m = [];
        if (dvu && dvu.text.length != 0) {
            m.push(msg(w, `Syntax Error`, `A directive is expected here.`));
            wal.push(dvu);
            for (;;) {
                if (nl()) {
                    continue;
                }
                const dvu = dv();
                if (dvu && dvu.text.length != 0) {
                    wal.push(dvu);
                    continue;
                }
                break;
            }
        }
        let l = tr(ip(), impor) ||
            tr(ep(), expor) ||
            tr(df(), define) ||
            tr(pt('top'), print) ||
            tr(th(), theorem);
        if (!l) {
            return ret({ a: null, k: 'trl', m, wal });
        }
        return cc(l(wal, m));
    });
    return main;
});
//# sourceMappingURL=read.js.map