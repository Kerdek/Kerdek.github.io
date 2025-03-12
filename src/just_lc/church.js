export const visit = o => e => o[e.kind](e);
export const assign = (e, x) => {
    if (x === e) {
        return e;
    }
    for (const i in e) {
        delete e[i];
    }
    for (const i in x) {
        e[i] = x[i];
    }
    return e;
};
//# sourceMappingURL=church.js.map