import { make, evaluate } from './cru.js';
export const exec = async (e, get, put, unput) => {
    const s = [], fatal = r => { throw new Error(`Because ${r}, the io is invalid.`); };
    let iops = 0;
    let io = (_rec, rc, _ret) => rc([e, {}]);
    for (;;) {
        if (iops++ > 1e3) {
            throw new Error("Too many IOs.");
        }
        const ior = evaluate(io);
        if (!Array.isArray(ior)) {
            fatal("a list was expected");
        }
        if (!(0 in ior)) {
            fatal("not enough elements");
        }
        const [opkind, ...args] = ior;
        const op = evaluate((_rec, rc, _ret) => rc([opkind, {}]));
        if (typeof op !== "string") {
            fatal("a string was expected");
        }
        let x;
        switch (op) {
            // sequencing
            case "bind": {
                if (!(0 in args) || !(1 in args)) {
                    fatal("not enough elements");
                }
                const [n, f] = args;
                s.push(f);
                io = (_rec, rc, _ret) => rc([n, {}]);
                continue;
            }
            case "return": {
                if (!(0 in args) || !(1 in args)) {
                    fatal("not enough elements");
                }
                const [r] = args;
                x = r;
                break;
            }
            case "yield": {
                await new Promise(c => window.setTimeout(c, 0));
                x = make("lit", true);
                break;
            }
            // console io
            case "puts": {
                if (!(0 in args)) {
                    fatal("not enough elements");
                }
                const [s] = args;
                const e = evaluate((_rec, rc, _ret) => rc([s, {}]));
                if (typeof e !== "string") {
                    fatal("a string was expected");
                }
                put(e);
                x = make("lit", undefined);
                break;
            }
            case "unputc": {
                unput();
                x = make("lit", true);
                break;
            }
            case "getc": {
                x = make("lit", await get());
                break;
            }
            // rng
            case "random": {
                const [] = args;
                x = make("lit", Math.random());
                break;
            }
            // references
            case "new": {
                if (!(0 in args)) {
                    fatal("not enough elements");
                }
                const [v] = args;
                x = make("lit", make("shr", v));
                break;
            }
            case "get": {
                if (!(0 in args)) {
                    fatal("not enough elements");
                }
                const [r] = args;
                const e = evaluate((_rec, rc, _ret) => rc([r, {}]));
                x = e;
                break;
            }
            case "set": {
                if (!(0 in args) || !(1 in args)) {
                    fatal("not enough elements");
                }
                const [r, v] = args;
                const e = evaluate((_rec, rc, _ret) => rc([r, {}]));
                e[1] = v;
                x = make("lit", undefined);
                break;
            }
            default: {
                fatal(`no io operation named \`${op}\` is defined`);
            }
        }
        const f = s.pop();
        if (!f) {
            return x;
        }
        io = (_rec, rc, _ret) => rc([make("app", f, x), {}]);
    }
};
//# sourceMappingURL=io.js.map