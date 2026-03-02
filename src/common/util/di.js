export const edi = f => f(), di = (x, f) => f(x), dj = f => f(), tr = (t, f) => t ? f(t) : null, cnn = (f) => f && f(), opt = (x) => x ? [x] : [], optl = (x) => x ? [...x] : [], optf = (i, x) => x ? { [i]: x } : {}, uniques = (a) => [...new Set(a)], lookup = (a, i) => a.reduce((p, [k, v]) => k === i ? v : p, null), visit = o => (e, ...r) => (o[e.k])(e, ...r), visit_default = () => (d, o) => (e, ...r) => (o[e.k] || d)(e, ...r), mod = (e, f) => { f(e); return e; }, moda = async (e, f) => { await f(e); return e; }, assign = (e, a) => Object.assign(e, a), partition = (arr, fn) => arr.reduce((p, e, i, a) => {
    p[fn(e, i, a) ? 0 : 1].push(e);
    return p;
}, [[], []]);
//# sourceMappingURL=di.js.map