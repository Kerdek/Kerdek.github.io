import { abs, app, imp, ref, visit } from "./church.js";
import { homproc } from "./run.js";
import { print } from "./print.js";
const fatal = (m) => { throw new Error(m); };
const occurs_free = (i, e) => homproc((call, cc, ret) => {
    const t = visit({
        app: e => call(s(e.lhs), dx => dx ? ret(true) : cc(s(e.rhs))),
        abs: e => e.id === i ? ret(false) : cc(s(e.body)),
        imp: e => call(s(e.lhs), dx => dx ? ret(true) : cc(s(e.rhs))),
        ref: e => ret(e.id === i)
    });
    const s = (e) => () => t(e);
    return s(e)();
});
const fresh = (() => {
    let n = 0;
    return (i) => `†${i}${n++}`;
})();
const beta = (i, x, e) => homproc((call, _cc, ret) => {
    const t = visit({
        app: e => call(s(e.lhs), dx => call(s(e.rhs), dy => ret(dx === e.lhs && dy === e.rhs ? e : app(dx, dy)))),
        abs: e => e.id === i ? ret(e) : occurs_free(e.id, x) ? (j => call(s(beta(e.id, ref(j), e.body)), dx => ret(abs(j, dx))))(fresh(e.id)) : call(s(e.body), dx => ret(abs(e.id, dx))),
        imp: e => call(s(e.lhs), dx => call(s(e.rhs), dy => ret(dx === e.lhs && dy === e.rhs ? e : imp(dx, dy)))),
        ref: e => ret(e.id === i ? x : e)
    });
    const s = (e) => () => t(e);
    return s(e)();
});
const compare = (x, y) => {
    const s = [];
    for (;;) {
        x = evaluate(x);
        y = evaluate(y);
        if (x.kind === "app" && y.kind === "app") {
            s.push([x.rhs, y.rhs]);
            x = x.lhs;
            y = y.lhs;
            continue;
        }
        else if (x.kind === "abs" && y.kind === "abs") {
            const f = ref(fresh(x.id));
            x = beta(x.id, f, x.body);
            y = beta(y.id, f, y.body);
            continue;
        }
        else if (x.kind === "imp" && y.kind === "imp") {
            s.push([x.rhs, y.rhs]);
            x = x.lhs;
            y = y.lhs;
            continue;
        }
        else if (x.kind === "ref" && y.kind === "ref" && x.id === y.id) { }
        else
            return [x, y];
        const f = s.pop();
        if (!f) {
            return null;
        }
        x = f[0];
        y = f[1];
    }
};
export const evaluate = (e) => homproc((call, cc, ret) => {
    const t = visit({
        app: e => call(s(e.lhs), dx => call(s(e.rhs), dy => visit({
            app: dx => ret(app(dx, dy)),
            abs: dx => cc(s(beta(dx.id, dy, dx.body))),
            imp: dx => (c => c ? fatal(`Assertion Failed:\n${print(c[0])}\n\nis not equivalent to\n\n${print(c[1])}`) : cc(s(dx.rhs)))(compare(dx.lhs, dy)),
            ref: dx => ret(app(dx, dy))
        })(dx))),
        abs: e => ret(e),
        imp: e => ret(e),
        ref: e => ret(e)
    });
    const s = (e) => () => t(e);
    return s(e)();
});
//# sourceMappingURL=evaluate.js.map