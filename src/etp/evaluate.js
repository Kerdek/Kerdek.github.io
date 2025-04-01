import { homproc } from "./run.js";
import { all, app, imp, ref, visit } from "./lang.js";
const fatal = (m) => { throw new Error(m); };
const occurs_free = (i, e) => homproc((call, cc, ret) => {
    const t = visit({
        all: e => e.id === i ? ret(false) : cc(s(e.body)),
        imp: e => call(s(e.lhs), dx => dx ? ret(true) : cc(s(e.rhs))),
        app: e => cc(s(e.rhs)),
        ref: e => ret(e.id === i)
    });
    const s = (e) => () => t(e);
    return s(e)();
});
const fresh = (() => {
    let n = 0;
    return (i) => `†${i}${n++}`;
})();
const beta = (i, x, e, g) => homproc((call, _cc, ret) => {
    const t = visit({
        all: e => l => l ? ret(e) : e.id === i ? ret(e) : occurs_free(e.id, x) ? (j => call(s(beta(e.id, ref(j), e.body), false), dx => ret(all(j, e.schema, dx))))(fresh(e.id)) : call(s(e.body, false), dx => ret(all(e.id, e.schema, dx))),
        imp: e => l => l ? ret(e) : call(s(e.lhs, false), dx => call(s(e.rhs, false), dy => ret(imp(dx, dy)))),
        app: e => () => call(s(e.lhs, true), dx => call(s(e.rhs, false), dy => dx.kind === "all" ? ret(beta(dx.id, dy, dx.body)) : ret(app(dx, dy)))),
        ref: e => l => ret(!l && e.id === i ? x : e.id === "?" ? g || e : e)
    });
    const s = (e, l) => () => t(e)(l);
    return s(e, false)();
});
const betap = (i, x, e, g) => homproc((call, _cc, ret) => {
    const t = visit({
        all: e => e.id === i ? ret(e) : occurs_free(e.id, x) ? (j => call(s(beta(e.id, ref(j), e.body)), dx => ret(all(j, e.schema, dx))))(fresh(e.id)) : call(s(e.body), dx => ret(all(e.id, e.schema, dx))),
        imp: e => call(s(e.lhs), dx => call(s(e.rhs), dy => ret(imp(dx, dy)))),
        app: e => call(s(e.lhs), dx => call(s(e.rhs), dy => dx.kind === "all" ? ret(beta(dx.id, dy, dx.body)) : ret(app(dx, dy)))),
        ref: e => ret(e.id === i ? x : e.id === "?" ? g || e : e)
    });
    const s = (e) => () => t(e);
    return s(e)();
});
const compare = (x, y) => {
    const s = [];
    for (;;) {
        if (x === y) { }
        else {
            if (x.kind === "all" && y.kind === "all") {
                if (x.id === y.id) {
                    x = x.body;
                    y = y.body;
                    continue;
                }
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
            else if (x.kind === "app" && y.kind === "app") {
                s.push([x.rhs, y.rhs]);
                x = x.lhs;
                y = y.lhs;
                continue;
            }
            else if (x.kind === "ref" && y.kind === "ref" && x.id === y.id) { }
            else
                return false;
        }
        const f = s.pop();
        if (!f) {
            return true;
        }
        x = f[0];
        y = f[1];
    }
};
export const evaluate = (l, e, o) => {
    const g = [{ scope: { props: new Set, proofs: {} }, prop: e }];
    try {
        for (;;) {
            const s = l.shift();
            if (!s) {
                return [g, ""];
            }
            const gp = g.shift();
            if (!gp) {
                return fatal("No goals.");
            }
            switch (s.kind) {
                case "intro":
                    for (const id of s.ids) {
                        switch (gp.prop.kind) {
                            case "all":
                                gp.scope.props.add(id);
                                gp.prop = beta(gp.prop.id, ref(id), gp.prop.body);
                                continue;
                            case "imp":
                                gp.scope.proofs[id] = gp.prop.lhs;
                                gp.prop = gp.prop.rhs;
                                continue;
                            default:
                                fatal("Not enough binders.");
                        }
                    }
                    g.unshift(gp);
                    continue;
                case "apply":
                    let h = gp.scope.proofs[s.hyp];
                    if (!h) {
                        const hp = o[s.hyp];
                        if (!hp)
                            return fatal("Unknown hypothesis or theorem.");
                        h = hp[0];
                    }
                    for (const op of s.ops) {
                        if (h.kind != "all") {
                            return fatal("Bad specialization.");
                        }
                        h = h.schema ? betap(h.id, op, h.body, gp.prop) : beta(h.id, op, h.body, gp.prop);
                    }
                    const gn = [];
                    for (;;) {
                        if (compare(h, gp.prop)) {
                            break;
                        }
                        else if (h.kind === "imp") {
                            gn.push({ scope: { props: new Set([...gp.scope.props]), proofs: { ...gp.scope.proofs } }, prop: h.lhs });
                            h = h.rhs;
                        }
                        else {
                            gn.push({ scope: { props: new Set([...gp.scope.props]), proofs: { ...gp.scope.proofs } }, prop: imp(h, gp.prop) });
                            break;
                        }
                    }
                    g.unshift(...gn);
                    continue;
                case "sorry":
                    continue;
            }
        }
    }
    catch (e) {
        return [g, e.message];
    }
};
//# sourceMappingURL=evaluate.js.map