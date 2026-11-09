// sync and promise trampolines
export const run_v = (s) => {
    const z = [];
    let f = s({
        branch: u => u,
        proc: u => (...a) => () => u(...a),
        call: (u, v) => (z.push(v), f = u, true),
        cc: u => (f = u, true),
        ret: () => !!(f = z.pop())
    });
    while (f())
        ;
}, run = (s) => {
    const z = [];
    let f = s({
        branch: u => u,
        proc: u => (...a) => () => u(...a),
        call: (u, v) => (z.push(v), f = u, true),
        cc: u => (f = u, true),
        ret: x => {
            const t = z.pop();
            f = t ? () => t(x) : x;
            return !!t;
        }
    });
    while (f())
        ;
    return f;
}, run_va = async (s) => {
    const z = [];
    let f = s({
        branch: u => u,
        proc: u => (...a) => () => u(...a),
        call: (u, v) => (z.push(v), f = u, true),
        cc: u => (f = u, true),
        ret: () => !!(f = z.pop())
    });
    while (await f())
        ;
}, run_a = async (s) => {
    const z = [];
    let f = s({
        branch: u => u,
        proc: u => (...a) => () => u(...a),
        call: (u, v) => (z.push(v), f = u, true),
        cc: u => (f = u, true),
        ret: x => {
            const t = z.pop();
            f = t ? () => t(x) : x;
            return !!t;
        }
    });
    while (await f())
        ;
    return f;
};
//# sourceMappingURL=run.js.map