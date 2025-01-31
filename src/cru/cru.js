export const make = (...x) => x;
export const visit = o => (e, ...a) => (f => f(e, ...a))(o[e[0]]);
export const assign = (e, x) => {
    let i = 0;
    for (; i < x.length; i++) {
        e[i] = x[i];
    }
    for (; i < e.length; i++) {
        delete e[i];
    }
    return e;
};
//# sourceMappingURL=cru.js.map