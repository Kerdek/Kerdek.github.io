import { walk_proof_conditional, walk_proposition_conditional, walk_statement_conditional } from './abstract.js';
import { range_includes, range_includes_inclusive } from './scanner.js';
export const select_proposition = (wp, n, e) => walk_proposition_conditional(t => range_includes(t.w, wp), t => ({ k: 'proposition', w: t.w, n, ...e ? { e } : e, t }), {
    uni: ({ b }) => b,
    lam: ({ b }) => b,
    app: ({ l, r }) => l || r,
    imp: ({ l, r }) => l || r,
    ref: () => null,
    var: ({ d }) => d,
    err: () => null
}), select_proof = (wp, inclusive, n) => walk_proof_conditional(inclusive ? e => range_includes_inclusive(e.w, wp) : e => range_includes(e.w, wp), e => ({ k: 'proof', w: e.w, n, e }), {
    uni: ({ b }) => b,
    cdp: ({ b }, e) => {
        if (range_includes(e.wi, wp)) {
            return { k: 'binding', w: e.wi, i: e.i, e: e.b, n };
        }
        if (e.t) {
            const dt = select_proposition(wp, n, e)(e.t);
            if (dt) {
                return dt;
            }
        }
        return b;
    },
    mop: ({ l, r }) => l || r,
    spe: ({ l }, e) => l || select_proposition(wp, n, e)(e.r),
    ref: () => null,
    lem: ({ d, b }, e) => {
        if (range_includes(e.wi, wp)) {
            return { k: 'binding', w: e.wi, i: e.i, e: e.b, n };
        }
        return d || b;
    },
    def: ({ b }, e) => select_proposition(wp, n, e)(e.d) || b,
    prt: ({ b }, e) => select_proposition(wp, n, e)(e.d) || b,
    err: () => null
}), select_statement = (wp, inclusive) => walk_statement_conditional(inclusive ? n => range_includes_inclusive(n.w, wp) : n => range_includes(n.w, wp), n => n.k === 'def' && select_proposition(wp, n)(n.d) ||
    n.k === 'thm' && (select_proposition(wp, n)(n.t) ||
        select_proof(wp, inclusive, n)(n.d)) ||
    { k: 'statement', w: n.w, n });
//# sourceMappingURL=select.js.map