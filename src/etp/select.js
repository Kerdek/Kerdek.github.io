import { walk_proof_conditional, walk_proposition_conditional, walk_statement_conditional } from './abstract.js';
import { range_includes, range_includes_inclusive } from './scanner.js';
export const select_proposition = (wp, n, e) => walk_proposition_conditional(t => range_includes(t.w, wp), t => ({ k: 'proposition', n, e, t }), {
    uni: ({ b }) => b,
    lam: ({ b }) => b,
    app: ({ l, r }) => l || r,
    imp: ({ l, r }) => l || r,
    ref: () => null,
    var: () => null,
    err: () => null
}), select_proof = (wp, inclusive, n) => walk_proof_conditional(inclusive ? e => range_includes_inclusive(e.w, wp) : e => range_includes(e.w, wp), e => ({ k: 'proof', n, e }), {
    uni: ({ b }) => b,
    cdp: ({ b }, e) => {
        // if (range_includes(e.wi, wp)) {
        //   return { k: 'binding', w: e.wi, i: e.i, e: e.b } }
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
    lem: ({ b }, _e) => 
    // s.reduce<SelectResult | null>((p, [{ d: dp }, { w, i, t, d }]) =>
    //   p ||
    //   t && select_proposition(wp, e)(t) ||
    //   dp ||
    //   range_includes(w, wp) && { k: 'binding', w, i, e: d } ||
    //   null, null) ||
    b,
    def: ({ b }, e) => select_proposition(wp, n, e)(e.d) || b,
    prt: ({ b }, e) => select_proposition(wp, n, e)(e.d) || b,
    err: () => null
}), select_statement = (wp) => walk_statement_conditional(t => range_includes(t.w, wp), n => ({ k: 'statement', n }));
//# sourceMappingURL=select.js.map