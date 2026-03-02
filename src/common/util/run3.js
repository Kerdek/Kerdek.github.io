export const run = (s) => (...a) => {
    let d;
    let f = (() => {
        const z = [];
        let e = s({
            branch: u => u,
            proc: u => (...a) => () => u(...a),
            call: (u, v) => (e = u, z.unshift(v), true),
            cc: u => (e = u, true),
            ret: x => (d = x, false)
        })(...a);
        let push = () => e() ? push : pop(z.shift());
        let pop = (y) => () => !y ? undefined : y(d) ? push : pop(z.shift());
        return push;
    })();
    for (;;) {
        if (!f) {
            return d;
        }
        else {
            f = f();
        }
    }
};
//# sourceMappingURL=run3.js.map