export function homproc(s) {
    let d;
    const y = [];
    let ops = 0;
    const call = (u, v) => (e = u, y.unshift(v), true);
    const cc = u => (e = u, true);
    const ret = x => (d = x, false);
    let e = () => s(call, cc, ret);
    for (;;) {
        if (ops++ > 1e7) {
            throw new Error("Too many steps.");
        }
        if (e()) {
            continue;
        }
        for (;;) {
            if (ops++ > 1e7) {
                throw new Error("Too many steps.");
            }
            const f = y.shift();
            if (!f) {
                return d;
            }
            if (f(d)) {
                break;
            }
        }
    }
}
//# sourceMappingURL=run.js.map