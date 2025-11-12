export const scanner = (takers) => (x, w) => {
    const pos = () => ({ ...w }), take = (f) => {
        return (...a) => {
            const r = f(x, ...a);
            if (r === null) {
                return null;
            }
            x = x.slice(r[0].length);
            const re = /\n/g;
            const wa = { ...w };
            let colo = -w.col;
            for (;;) {
                const m = re.exec(r[0]);
                if (!m) {
                    w.col = r[0].length - colo;
                    return { w: { begin: wa, end: { ...w } }, text: r[0], type: r[1] };
                }
                colo = m.index;
                w.line++;
            }
        };
    };
    const token_types = {};
    for (const i in takers) {
        token_types[i] = take(takers[i]);
    }
    return {
        pos,
        eof: () => x.length === 0,
        ...token_types
    };
};
//# sourceMappingURL=scanner.js.map