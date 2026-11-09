export const last = a => a[a.length - 1], edi = f => f(), di = (x, f) => f(x), dj = f => f(), tr = (t, f) => t ? f(t) : null, flip = ([a, b]) => [b, a], flip_all = (l) => l.map(flip), cnn = (f) => f && f(), opt = (x) => x ? [x] : [], optf = (x, f) => x ? [f(x)] : [], cascade = (f, a, b) => f(a) || f(b), uniques = (a) => [...new Set(a)], lookup = (a, i) => a.reduce((p, e) => e[0] === i ? e : p, null), visit = o => (e, ...r) => (o[e.k])(e, ...r), visit_default = () => (d, o) => (e, ...r) => (o[e.k] || d)(e, ...r), bsearch = (c, a) => {
    let start = 0, end = a.length - 1;
    while (start <= end) {
        const i = Math.floor((start + end) / 2), e = a[i], p = c(e);
        if (p == 0) {
            return [i, e];
        }
        else if (p > 0) {
            start = i + 1;
        }
        else {
            end = i - 1;
        }
    }
    return null;
}, merge_once = (c, a, b) => {
    const r = [];
    for (;;) {
        if (a[0] && b[0]) {
            const p = c(a[0], b[0]);
            if (p == 0) {
                r.push(a[0]);
                a.shift();
                b.shift();
            }
            else if (p < 0) {
                r.push(a[0]);
                a.shift();
            }
            else {
                r.push(b[0]);
                b.shift();
            }
        }
        else if (a[0]) {
            r.push(a[0]);
            a.shift();
        }
        else if (b[0]) {
            r.push(b[0]);
            b.shift();
        }
        else
            break;
    }
    return r;
}, mod = (e, f) => { f(e); return e; }, moda = async (e, f) => { await f(e); return e; }, assign = (e, a) => Object.assign(e, a), partition = (arr, fn) => arr.reduce((p, e, i, a) => {
    p[fn(e, i, a) ? 0 : 1].push(e);
    return p;
}, [[], []]);
//# sourceMappingURL=di.js.map