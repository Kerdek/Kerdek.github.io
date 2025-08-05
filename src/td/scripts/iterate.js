const { Reflect } = self;
export const for_each = (l, f) => {
    for (const k of Reflect.ownKeys(l)) {
        f(k, l[k]);
    }
};
export const enumerate_list = (l, f) => {
    const r = [];
    for (const k of Reflect.ownKeys(l)) {
        r.push(f(k, l[k]));
    }
    return r;
};
export const enumerate = (l, f) => {
    const r = {};
    for (const k of Reflect.ownKeys(l)) {
        const [kp, vp] = f(k, l[k]);
        r[kp] = vp;
    }
    return r;
};
export const async_enumerate = async (l, f) => {
    const r = {};
    for (const k of Reflect.ownKeys(l)) {
        const [kp, vp] = await f(k, l[k]);
        r[kp] = vp;
    }
    return r;
};
export const async_map = async (l, f) => {
    const r = [];
    for (const x of l) {
        r.push(await f(x));
    }
    return r;
};
//# sourceMappingURL=iterate.js.map