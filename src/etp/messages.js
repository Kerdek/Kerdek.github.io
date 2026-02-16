import { walk_concrete_article } from "./concrete.js";
export const article_messages = walk_concrete_article({
    proposition: {
        par: ({ b }, { m }) => [...b, ...m],
        led: ({ b }, { m }) => [...b, ...m],
        trl: ({ l }, { m }) => [...l, ...m],
        uni: ({ b }, { m }) => [...b, ...m],
        lam: ({ b }, { m }) => [...b, ...m],
        dot: ({ b }, { m }) => [...b, ...m],
        ref: ({}, { m }) => m,
        imp: ({ l, r }, { m }) => [...l, ...r, ...m],
        app: ({ l, r }, { m }) => [...l, ...r, ...m],
        err: ({}, { m }) => [...m]
    },
    proof: {
        par: ({ b }, { m }) => [...b, ...m],
        led: ({ b }, { m }) => [...b, ...m],
        trl: ({ l }, { m }) => [...l, ...m],
        prt: ({ d, b }, { m }) => [...d, ...b, ...m],
        lam: ({ b }, { m }) => [...b, ...m],
        uni: ({ b }, { m }) => [...b, ...m],
        dot: ({ b }, { m }) => [...b, ...m],
        cdp: ({ b }, { m }) => [...b, ...m],
        cdt: ({ t, b }, { m }) => [...t, ...b, ...m],
        def: ({ d, b }, { m }) => [...d, ...b, ...m],
        lem: ({ d, b }, { m }) => [...d, ...b, ...m],
        let: ({ t, d, b }, { m }) => [...t, ...d, ...b, ...m],
        spe: ({ l, r }, { m }) => [...l, ...r, ...m],
        mop: ({ l, r }, { m }) => [...l, ...r, ...m],
        ref: ({}, { m }) => m,
        err: ({}, { m }) => m
    },
    statement: {
        imp: ({ a }, { m }) => [...a || [], ...m],
        exf: ({ a }, { m }) => [...a || [], ...m],
        trl: ({ a }, { m }) => [...a || [], ...m],
        def: ({ a, d }, { m }) => [...a || [], ...d, ...m],
        prt: ({ a, d }, { m }) => [...a || [], ...d, ...m],
        thm: ({ a, t, d }, { m }) => [...a || [], ...t, ...d, ...m]
    }
});
//# sourceMappingURL=messages.js.map