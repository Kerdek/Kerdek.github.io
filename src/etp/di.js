export const di = (x, f) => f(x), dj = f => f(), tr = (t, f) => t ? f(t) : null, opt = (x) => x ? [x] : [], merge = (c) => (a, b) => {
    const r = [];
    let i = 0, j = 0;
    for (;;) {
        if (i === a.length) {
            r.push(...b.slice(j));
            break;
        }
        if (j === b.length) {
            r.push(...a.slice(i));
            break;
        }
        const [ai, bj] = [a[i], b[j]];
        r.push(c(ai, bj) ? (i++, ai) : (j++, bj));
    }
    return r;
}, mergev = (c) => (...a) => a.reduce(merge(c), []);
//# sourceMappingURL=di.js.map