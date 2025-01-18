export const estam = visit => root => {
    const y = [];
    let result;
    let f;
    const rec = (e, s, cont) => (y.push([s, cont]), f = e, true);
    const cc = e => (f = e, true);
    const ret = value => (result = value, false);
    root(rec, cc, ret);
    const v = visit(rec, cc, ret);
    for (;;) {
        v(f);
        for (;;) {
            const r = y.pop();
            if (!r) {
                return result;
            }
            if (r[1](result, r[0])) {
                break;
            }
        }
    }
};
//# sourceMappingURL=estam.js.map