export const empty_range = (w) => ({
    begin: w,
    end: w
});
export const position_less = (a, b) => a.line < b.line ||
    a.line === b.line &&
        a.col < b.col;
export const position_less_equal = (a, b) => a.line < b.line ||
    a.line === b.line &&
        a.col <= b.col;
export const range_contains = (w, wp) => position_less_equal(w.begin, wp.begin) &&
    position_less_equal(wp.end, w.end);
export const range_includes = (w, wp) => position_less_equal(w.begin, wp) &&
    position_less(wp, w.end);
export const range_includes_inclusive = (w, wp) => position_less_equal(w.begin, wp) &&
    position_less_equal(wp, w.end);
export const fspan = (a, b) => ({ begin: a.w.begin, end: b.w.end });
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