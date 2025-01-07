import { di } from "./di.js";
import { scanner } from "./scanner.js";
import { tokenizer } from "./tokenizer.js";
// const visit_term: VisitTerm = o => e => (f => f(e))(o[e.kind as keyof typeof o])
const visit_simple_type = o => e => (f => f(e))(o[e.kind]);
const visit_typ = o => e => (f => f(e))(o[e.kind]);
const read_term = tk => {
    const fatal = m => {
        const w = tk.pos();
        throw new Error(`(${w[0]}:${w[1]}:${w[2]}): term parser: ${m}`);
    }, rec_defs = o => di(tk.take("identifier"), i => !i ? fatal(`Expected an identifier.`) :
        !tk.take("colon") ? fatal(`Expected \`:\`.`) :
            di(expression(), y => di([...o, [i[1], y]], r => tk.take("rbrace") ? { kind: "rcd", fields: r } :
                tk.take("comma") ? rec_defs(r) :
                    fatal(`Expected \`,\` or \`}\`.`)))), parameters = () => tk.take("dot") ? expression() :
        di(tk.take("identifier"), i => !i ? fatal(`Expected an identifier or \`.\`.`) :
            di(parameters(), dx => ({ kind: "lam", name: i[1], body: dx }))), try_primary = () => tk.take("lbrace") ?
        () => tk.take("rbrace") ? { kind: "rcd", fields: [] } :
            rec_defs([]) :
        tk.take("rsolidus") ?
            parameters :
            tk.take("lparen") ?
                () => di(expression(), x => tk.take("rparen") ? x :
                    fatal(`Expected \`)\`.`)) :
                tk.take("let") ?
                    () => di(tk.take("identifier"), i => !i ? fatal(`Expected an identifier.`) :
                        !tk.take("equal") ? fatal(`Expected \`=\`.`) :
                            di(expression(), rhs => !tk.take("in") ? fatal(`Expected \`in\`.`) :
                                di(expression(), body => ({ kind: "let", isRec: true, name: i[1], rhs, body })))) :
                    di(tk.take("literal"), c => c ?
                        () => ({ kind: "lit", value: JSON.parse(c[1]) }) :
                        di(tk.take("identifier"), r => r ?
                            () => ({ kind: "var", name: r[1] }) :
                            null)), access_rhs = x => tk.take("dot") ?
        di(tk.take("identifier"), i => i ? access_rhs({ kind: "sel", receiver: x, fieldName: i[1] }) :
            fatal("Expected a subscript.")) :
        x, try_access = () => di(try_primary(), up => !up ? up :
        () => di(up(), access_rhs)), access = () => di(try_access(), up => up === null ? fatal("Expected a term.") :
        up()), juxt_rhs = x => di(try_access(), up => !up ? x :
        di(up(), y => juxt_rhs({ kind: "app", lhs: x, rhs: y }))), juxt = () => di(access(), juxt_rhs), expression = juxt, all = () => di(expression(), e => !tk.take("eof") ? fatal(`Expected end of file.`) :
        e);
    return all();
};
const parens = (x, c) => x ? `(${c})` : c;
// const print_term: (e: Term) => string = e => {
// const qq: (a: [string, Term][], r: string[]) => string = (a, r) =>
//   !a[0] ? `{ ${r.join(', ')} }` :
//   qq(a.slice(1), [...r, `${a[0][0]}: ${s(a[0][1], 0, true)}`])
// const s: (e: Term, pr: number, rm: boolean) => string = (e, pr, rm) => visit_term({
//   lit: ({ value }) => `${value}`,
//   var: ({ name }) => name,
//   lam: ({ name, body }) =>
//     parens(!rm, `λ${name}.${s(body, 0, true)}`),
//   app: ({ lhs, rhs }) =>
//     parens(pr > 1, `${s(lhs, 0, false)} ${s(rhs, 1, pr > 1 || rm)}`),
//   rcd: ({ fields }) => qq(fields, []),
//   sel: ({ receiver, fieldName }) => `${s(receiver, 1, false)}.${fieldName}`,
//   let: ({ name, rhs, body }) => `let ${name} = ${s(rhs, 0, true)} in ${s(body, 0, true)}` })(e)
// return s(e, 0, true) }
const print_simple_type = e => {
    const qq = (a, r) => !a[0] ? `{ ${r.join(', ')} }` :
        qq(a.slice(1), [...r, `${a[0][0]}: ${s(a[0][1], 0)}`]);
    const s = (e, pr) => visit_simple_type({
        variable: ({}) => "<variable state>",
        primitive: ({ name }) => name,
        function: ({ lhs, rhs }) => parens(pr > 0, `${s(lhs, 1)} -> ${s(rhs, 0)}`),
        record: ({ fields }) => qq(fields, [])
    })(e);
    return s(e, 0);
};
const print_typ = e => {
    const qq = (a, r) => !a[0] ? `{ ${r.join(', ')} }` :
        qq(a.slice(1), [...r, `${a[0][0]}: ${s(a[0][1], 0)}`]);
    const s = (e, pr) => visit_typ({
        top: () => '⊤',
        bot: () => '⊥',
        union: ({ lhs, rhs }) => parens(pr > 2, `${s(lhs, 2)} ⊓ ${s(rhs, 3)}`),
        inter: ({ lhs, rhs }) => parens(pr > 1, `${s(lhs, 1)} ⊔ ${s(rhs, 2)}`),
        function: ({ lhs, rhs }) => parens(pr > 0, `${s(lhs, 1)} -> ${s(rhs, 0)}`),
        record: ({ fields }) => qq(fields, []),
        recursive: ({ name }) => name,
        variable: ({ name }) => name,
        primitive: ({ name }) => name
    })(e);
    return s(e, 0);
};
function typeTerm(term, ctx) {
    if (term.kind === "lit") {
        return { kind: "primitive", name: "int" };
    }
    else if (term.kind === "var") {
        const u = ctx[term.name];
        if (!u) {
            err(`not found: ${term.name}`);
        }
        return u;
    }
    else if (term.kind === "rcd") {
        return { kind: "record", fields: term.fields.map(([n, t]) => [n, typeTerm(t, ctx)]) };
    }
    else if (term.kind === "lam") {
        const param = freshVar();
        return { kind: "function", lhs: param, rhs: typeTerm(term.body, { ...ctx, [term.name]: param }) };
    }
    else if (term.kind === "app") {
        const res = freshVar();
        constrain(typeTerm(term.lhs, ctx), { kind: "function", lhs: typeTerm(term.rhs, ctx), rhs: res });
        return res;
    }
    else if (term.kind === "sel") {
        const res = freshVar();
        constrain(typeTerm(term.receiver, ctx), { kind: "record", fields: [[term.fieldName, res]] });
        return res;
    }
    else {
        const res = freshVar();
        constrain(typeTerm(term.rhs, ctx), res);
        return typeTerm(term.rhs, { ...ctx, [term.name]: res });
    }
}
// const cache: Map<SimpleType, Set<SimpleType>> = new Map()
// function cache_contains(lhs: SimpleType, rhs: SimpleType): boolean {
// return cache.has(lhs) && (cache.get(lhs) as Set<SimpleType>).has(rhs) }
function constrain(lhs, rhs) {
    // if (cache_contains(lhs, rhs)) { }
    if (lhs.kind === "primitive" && rhs.kind === "primitive" && lhs.name === rhs.name) { }
    else if (lhs.kind === "function" && rhs.kind === "function") {
        constrain(rhs.lhs, lhs.lhs);
        constrain(lhs.rhs, rhs.rhs);
    }
    else if (lhs.kind === "record" && rhs.kind === "record") {
        for (const [n1, t1] of rhs.fields) {
            const u = lhs.fields.find(x => x[0] === n1);
            if (!u) {
                err(`missing field: ${n1} in ${lhs}`);
            }
            else {
                constrain(u[1], t1);
            }
        }
    }
    else if (lhs.kind === "variable") {
        lhs.st.upperBounds = [...lhs.st.upperBounds, rhs];
        for (const z of lhs.st.lowerBounds) {
            constrain(z, rhs);
        }
    }
    else if (rhs.kind === "variable") {
        rhs.st.upperBounds = [...rhs.st.upperBounds, rhs];
        for (const z of rhs.st.lowerBounds) {
            constrain(z, rhs);
        }
    }
    else {
        err(`cannot constrain: ${print_simple_type(lhs)} <: ${print_simple_type(rhs)}`);
    }
}
const freshName = (() => {
    let n = 0;
    return () => `__${n++}`;
})();
function freshVar() {
    return { kind: "variable", st: { lowerBounds: [], upperBounds: [] } };
}
function err(msg) {
    throw new Error(`type error: ${msg}`);
}
function coalesceType(ty) {
    const recursive = { polar_true: new Map(), polar_false: new Map() };
    function go(ty, polar, inProcess) {
        if (ty.kind === "primitive") {
            return { kind: "primitive", name: ty.name };
        }
        else if (ty.kind === "function") {
            return { kind: "function", lhs: go(ty.lhs, !polar, inProcess), rhs: go(ty.rhs, polar, inProcess) };
        }
        else if (ty.kind === "record") {
            return { kind: "record", fields: ty.fields.map(nt => [nt[0], go(nt[1], polar, inProcess)]) };
        }
        else {
            if (inProcess[polar ? "polar_true" : "polar_false"].has(ty.st)) {
                const u = recursive[polar ? "polar_true" : "polar_false"].get(ty.st);
                if (!u) {
                    const v = { kind: "variable", name: freshName() };
                    recursive[polar ? "polar_true" : "polar_false"].set(ty.st, v);
                    return v;
                }
                else {
                    return u;
                }
            }
            else {
                const bounds = polar ? ty.st.lowerBounds : ty.st.upperBounds;
                const boundTypes = bounds.map(x => go(x, polar, polar ?
                    { polar_true: new Set([...inProcess.polar_true, ty.st]), polar_false: inProcess.polar_false } :
                    { polar_true: inProcess.polar_true, polar_false: new Set([...inProcess.polar_false, ty.st]) }));
                const mrg = polar ? "union" : "inter";
                let res = { kind: "variable", name: freshName() };
                for (const e of boundTypes) {
                    res = { kind: mrg, lhs: res, rhs: e };
                }
                const u = recursive[polar ? "polar_true" : "polar_false"].get(ty.st);
                if (u) {
                    return { kind: "recursive", name: freshName(), body: res };
                }
                else {
                    return res;
                }
            }
        }
    }
    return go(ty, true, { polar_true: new Set(), polar_false: new Set() });
}
console.log(print_typ(coalesceType(typeTerm(read_term(tokenizer(scanner('\\x.x.a', ''))), {}))));
//# sourceMappingURL=se.js.map