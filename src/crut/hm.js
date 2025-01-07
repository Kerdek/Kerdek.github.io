const di = (x, f) => f(x);
Set.prototype.union = function (otherSet) {
    const result = new Set(this); // Start with all elements from the calling set
    otherSet.forEach(value => {
        result.add(value); // Add elements from the other set
    });
    return result;
};
Set.prototype.difference = function (otherSet) {
    const result = new Set();
    this.forEach(value => {
        if (!otherSet.has(value)) {
            result.add(value);
        }
    });
    return result;
};
export const ty_repr = x => x[0] === "TyVar" ? di(x, ([, v]) => v) :
    x[0] === "TyLit" ? di(x, ([, l]) => l[0] === "TyInt" ? "int" :
        l[0] === "TyBool" ? "bool" :
            "string") :
        di(x, ([, f, c]) => `(${ty_repr(f)} -> ${ty_repr(c)})`);
export const expr_repr = x => x[0] === "Lit" ? di(x, ([, l]) => JSON.stringify(l)) :
    x[0] === "Var" ? di(x, ([, v]) => v) :
        x[0] === "Let" ? di(x, ([, v, e1, e2]) => `let ${v} = ${expr_repr(e1)} in ${expr_repr(e2)}`) :
            x[0] === "Lambda" ? di(x, ([, v, e]) => `\\${v}.${expr_repr(e)}`) :
                di(x, ([, f, e]) => `(${expr_repr(f)} ${expr_repr(e)})`);
export function tokenizer(s) {
    let t;
    function fatal(msg) {
        const w = s.pos();
        throw new Error(`(${w[0]}:${w[1]}:${w[2]}): tokenizer: ${msg}`);
    }
    function k(t) {
        const matches = s.get().match(t);
        if (matches === null) {
            return null;
        }
        return matches[0];
    }
    function pos() {
        return s.pos();
    }
    function take(k) {
        if (t[0] === k) {
            const r = t;
            skip();
            return r;
        }
        return undefined;
    }
    function ws() {
        const ws = k(/^(\s|\/\/([^\n\\]|\\.)*?(\n|$)|\/\*([^\*\\]|\\.|\*[^\/])*?(\*\/|$))*/);
        if (ws) {
            s.skip(ws.length);
        }
    }
    function skip() {
        if (t[0] === "eof") {
            return;
        }
        s.skip(t[1].length);
        ws();
        classify();
    }
    function classify() {
        if (s.get().length === 0) {
            t = ["eof"];
            return;
        }
        if (k(/^\(/)) {
            t = ["lparen", "("];
            return;
        }
        if (k(/^\)/)) {
            t = ["rparen", ")"];
            return;
        }
        if (k(/^\\/)) {
            t = ["rsolidus", "\\"];
            return;
        }
        if (k(/^\./)) {
            t = ["dot", "."];
            return;
        }
        if (k(/^=/)) {
            t = ["equal", "="];
            return;
        }
        if (k(/^\$/)) {
            t = ["dollar", "$"];
            return;
        }
        let r = k(/^[+-]?(?:\d+(?:\.\d+)?)(?:[eE][+-]?\d+)?/);
        if (r) {
            t = ["number", r];
            return;
        }
        r = k(/^"([^"\\]|\\.)*($|")/);
        if (r) {
            t = ["string", r];
            return;
        }
        r = k(/^[A-Za-z_][A-Za-z0-9_]*/);
        if (r === "let") {
            t = ["let", "let"];
            return;
        }
        if (r === "in") {
            t = ["in", "in"];
            return;
        }
        if (r === "true") {
            t = ["boolean", "true"];
            return;
        }
        if (r === "false") {
            t = ["boolean", "false"];
            return;
        }
        if (r) {
            t = ["identifier", r];
            return;
        }
        fatal(`Unrecognized character sequence.`);
    }
    function get() {
        return s.get();
    }
    ws();
    classify();
    return { get, pos, take };
}
export const read_expr = tk => {
    const fatal = m => {
        const w = tk.pos();
        throw new Error(`(${w[0]}:${w[1]}:${w[2]}): term parser: ${m}`);
    }, try_primary = () => tk.take("rsolidus") ?
        () => di(tk.take("identifier"), i => !i ? fatal(`Expected an identifier.`) :
            !tk.take("dot") ? fatal(`Expected \`.\`.`) :
                di(expression(), e => ["Lambda", i[1], e])) :
        tk.take("lparen") ?
            () => di(expression(), x => tk.take("rparen") ? x :
                fatal(`Expected \`)\`.`)) :
            tk.take("let") ?
                () => di(tk.take("identifier"), i => !i ? fatal(`Expected an identifier.`) :
                    !tk.take("equal") ? fatal(`Expected \`=\`.`) :
                        di(expression(), e1 => !tk.take("in") ? fatal(`Expected \`in\`.`) :
                            di(expression(), e2 => ["Let", i[1], e1, e2]))) :
                di(tk.take("string"), c => c ?
                    () => ["Lit", ["String", JSON.parse(c[1])]] :
                    di(tk.take("number"), c => c ?
                        () => ["Lit", ["Int", JSON.parse(c[1])]] :
                        di(tk.take("boolean"), c => c ?
                            () => ["Lit", ["Bool", JSON.parse(c[1])]] :
                            di(tk.take("identifier"), r => r ?
                                () => ["Var", r[1]] :
                                null)))), primary = () => di(try_primary(), up => up === null ? fatal("Expected a term.") :
        up()), juxt_rhs = x => di(try_primary(), up => up === null ? x :
        di(up(), y => juxt_rhs(["App", x, y]))), juxt = () => juxt_rhs(primary()), dollar = () => di(juxt(), x => !tk.take("dollar") ? x :
        di(dollar(), y => ["App", x, y])), expression = dollar, all = () => di(expression(), e => tk.take("eof") ? e :
        fatal(`Expected end of file.`));
    return all();
};
const make_constraint = (i, t, s) => {
    const sp = new Map(s);
    sp.set(i, t);
    return sp;
};
const refine_type = (s, t) => t[0] === "TyVar" ? di(t, ([, v]) => di(s.get(v), r => r ? refine_type(s, r) :
    ["TyVar", v])) :
    t[0] === "TyLambda" ? di(t, ([, a, b]) => ["TyLambda", refine_type(s, a), refine_type(s, b)]) :
        di(t, ([, l]) => ["TyLit", l]);
const tyvars_from_type = t => t[0] === "TyVar" ? di(t, ([, v]) => new Set(v)) :
    t[0] === "TyLambda" ? di(t, ([, a, b]) => tyvars_from_type(a).union(tyvars_from_type(b))) :
        new Set();
const tyvars_from_env = e => {
    let acc = new Set();
    for (const [_, [t, tvars]] of e) {
        acc = acc.union(tyvars_from_type(t).difference(tvars));
    }
    return acc;
};
const env_add = (v, sc, e) => {
    const ep = new Map(e);
    ep.set(v, [sc, new Set()]);
    return ep;
};
const instantiate_type = (nt, t, tvars) => {
    const subs = new Map();
    for (const v of tvars) {
        subs.set(v, nt());
    }
    return refine_type(subs, t);
};
const env_get = (nt, v, e) => di(e.get(v), r => !r ? (() => { throw new Error(`Undefined reference to \`${v}\`.`); })() :
    di(r, ([t, tvars]) => instantiate_type(nt, t, tvars)));
const refine_env = (s, env) => {
    const envp = new Map();
    for (const [k, [t, v]] of env) {
        const sp = new Map(s);
        for (const t of v) {
            sp.delete(t);
        }
        envp.set(k, [refine_type(sp, t), v]);
    }
    return envp;
};
const unify = (t1, t2, s) => di(refine_type(s, t1), t1p => di(refine_type(s, t2), t2p => di((v, t) => !tyvars_from_type(t).has(v), no_cycle => t1[0] === "TyVar" && t2[0] === "TyVar" && t1[1] == t2[1] ? s :
    t1[0] === "TyVar" && no_cycle(t1[1], t2) ? make_constraint(t1[1], t2p, s) :
        t2[0] === "TyVar" ? unify(t2p, t1p, s) :
            t1[0] === "TyLambda" && t2[0] === "TyLambda" ?
                unify(t1[1], t2[1], unify(t1[2], t2[2], s)) :
                t1[0] === "TyLit" && t2[0] === "TyLit" && t1[1] === t2[1] ? s :
                    (() => { throw new Error(`Cannot unify \`${ty_repr(t1p)}\` and \`${ty_repr(t2p)}\`.`); })())));
const make_new_type = () => {
    let t = 0;
    return () => ["TyVar", `t${t++}`];
};
const lit_to_type = x => x[0] === "Int" ? ["TyInt"] :
    x[0] === "Bool" ? ["TyBool"] :
        ["TyString"];
const generalize = (e, t) => di(tyvars_from_type(t), tvars => di(tyvars_from_env(e), etvars => di(tvars.difference(etvars), d => [t, d])));
const inspect_expr = (nt, env, expr, ty, subs) => expr[0] === "Lit" ? di(expr, ([, l]) => unify(ty, ["TyLit", lit_to_type(l)], subs)) :
    expr[0] === "Var" ? di(expr, ([, v]) => di(refine_type(subs, env_get(nt, v, env)), t => unify(ty, t, subs))) :
        expr[0] === "Let" ? di(expr, ([, v, e1, e2]) => di(nt(), e1_ty => di(inspect_expr(nt, env, e1, e1_ty, subs), subsp => di(refine_type(subsp, e1_ty), e1_typ => di(generalize(refine_env(subsp, env), e1_typ), scheme => di(env_add(v, scheme[0], env), envp => inspect_expr(nt, refine_env(subsp, envp), e2, ty, subsp))))))) :
            expr[0] === "Lambda" ? di(expr, ([, v, e]) => di(nt(), v_t => di(nt(), e_t => di(unify(ty, ["TyLambda", v_t, e_t], subs), new_subs => di(env_add(v, v_t, env), new_env => inspect_expr(nt, new_env, e, e_t, new_subs)))))) :
                di(expr, ([, f, e]) => di(nt(), e_t => di(["TyLambda", e_t, ty], f_t => di(inspect_expr(nt, env, e, e_t, subs), e_subs => di(refine_type(e_subs, f_t), f_tp => inspect_expr(nt, refine_env(e_subs, env), f, f_tp, e_subs))))));
const make_new_char = () => {
    let t = 0;
    return () => `v${t++}`;
};
const pretty_tyvars = ty => di(make_new_char(), nc => di(tyvars_from_type(ty), vars => di((va, subs) => {
    const subsp = new Map(subs);
    subsp.set(va, ["TyVar", nc()]);
    return subsp;
}, make_subs => {
    let subs = new Map();
    for (const v of vars) {
        subs = make_subs(v, subs);
    }
    return refine_type(subs, ty);
})));
export const type_of = e => di(new Map(), empty_subs => di(make_new_type(), new_type => di(new_type(), e_t => di(inspect_expr(new_type, new Map(), e, e_t, empty_subs), subs => pretty_tyvars(refine_type(subs, e_t))))));
//# sourceMappingURL=hm.js.map