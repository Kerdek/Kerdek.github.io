/*

run.ts
Theodoric Stier
All rights reserved 2024

This module assists in writing
non-recursive algorithms on recursive
data structures.

*/
const ret = [];
const jmp = x => [x];
const call = (x, y) => [x, y];
const run = s => {
    const y = [s];
    let ops = 0;
    for (;;) {
        if (ops++ > 1e7) {
            throw new Error("Too many steps.");
        }
        const f = y.shift();
        if (!f) {
            return;
        }
        y.unshift(...f());
    }
};
const async_run = async (s) => {
    const y = [s];
    let ops = 0;
    for (;;) {
        if (ops++ > 1e7) {
            throw new Error("Too many steps.");
        }
        const f = y.shift();
        if (!f) {
            return;
        }
        y.unshift(...await f());
    }
};
export const homproc = e => {
    let d;
    run(e((x, v) => call(x, () => v(d)), x => jmp(x), v => (d = v, ret)));
    return d;
};
export const async_homproc = async (e) => {
    let d;
    await async_run(e((x, v) => call(x, () => v(d)), x => jmp(x), v => (d = v, ret)));
    return d;
};
//# sourceMappingURL=run.js.map