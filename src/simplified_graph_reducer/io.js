import { make } from './graph.js';
import { pretty } from './lang.js';
const car = make("uni", "x", make("uni", "y", make("ref", "x"))), cdr = make("uni", "x", make("uni", "y", make("ref", "y")));
export const exec = async (io, evaluate, get_in, put_out, unput_out) => {
    const s = [], fatal = r => { throw new Error(`Because ${r}, the io \`${io = evaluate(io), pretty(io)}\` is invalid.`); };
    let iops = 0;
    const get_lit = e => (e = evaluate(e), e.kind !== "lit" ? fatal(`a literal is required where \`${pretty(e)}\` was provided`) : e.val);
    for (;;) {
        if (iops++ > 1e3) {
            throw new Error("Too many IOs.");
        }
        const op = get_lit(make("app", io, car));
        let x;
        switch (op) {
            // sequencing
            case "bind": {
                const iol = [make("app", io, cdr)];
                s.push(make("app", make("mem", iol), cdr));
                io = make("app", make("mem", iol), car);
                continue;
            }
            case "return": {
                x = make("app", io, cdr);
                break;
            }
            case "yield": {
                await new Promise(c => window.setTimeout(c, 0));
                x = make("lit", true);
                break;
            }
            // playground console io
            case "print": {
                put_out(pretty(evaluate(make("app", io, cdr)))(0, true));
                put_out("\n");
                x = make("lit", true);
                break;
            }
            case "get": {
                x = make("lit", await get_in());
                break;
            }
            case "put": {
                put_out(get_lit(make("app", io, cdr)));
                x = make("lit", true);
                break;
            }
            case "unput": {
                unput_out();
                x = make("lit", true);
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
        io = make("app", f, x);
    }
};
//# sourceMappingURL=io.js.map