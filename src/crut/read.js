import { term_abs, term_acs, term_app, term_lit, term_mod, term_aka, term_ref, typ_any, typ_ref, typ_lit, typ_bol, typ_cnj, typ_dsj, typ_abs, typ_iov, typ_num, typ_rec, typ_str, typ_unk, rec, term_res, term_cst, typ_aka } from "./graph.js";
import { async_homproc, jmp } from "./run.js";
// import { assign } from "./assign.js"
import { di } from "./di.js";
import { assign } from "./assign.js";
export const read_type = (tk, h) => async_homproc((call, ret) => {
    const fatal = m => {
        const w = tk.pos();
        throw new Error(`(${w[0]}:${w[1]}:${w[2]}): type parser: ${m}`);
    }, rct_defs = o => async () => tk.take("dots") ?
        call(type, async (e) => e.kind !== rec ? fatal(`Expected a record type.`) :
            await di(() => ({ ...o, ...e.elements }), async (r) => tk.take("rbrace") ? ret(typ_rec(r())) :
                tk.take("comma") ? jmp(rct_defs(r())) :
                    fatal(`Expected \`,\` or \`}\`.`))) :
        await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected \`...\`, or an identifier.`) :
            !tk.take("colon") ? fatal(`Expected \`:\`.`) :
                call(type, async (y) => await di(() => ({ ...o, [i[1]]: y }), async (r) => tk.take("rbrace") ? ret(typ_rec(r())) :
                    tk.take("comma") ? jmp(rct_defs(r())) :
                        fatal(`Expected \`,\` or \`}\`.`)))), vars = v => async () => tk.take("dot") ?
        call(or, async (dx) => !tk.take("arrow") ? fatal(`Expected \`->\`.`) :
            call(arrow, async (dy) => ret(typ_abs(v, dx, dy)))) :
        await di(tk.take("hyphen") ? true : false, async (b) => await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected an identifier or \`.\`.`) :
            jmp(vars([...v, [i[1], b]])))), primary = async () => tk.take("rsolidus") ? jmp(vars([])) :
        tk.take("lbrace") ?
            tk.take("rbrace") ? ret(typ_rec({})) :
                jmp(rct_defs({})) :
            tk.take("lparen") ?
                call(type, async (x) => tk.take("rparen") ? ret(x) :
                    fatal(`Expected \`)\`.`)) :
                await di(tk.take("literal"), async (c) => c ? ret(typ_lit(c[1] === "undefined" ? undefined : JSON.parse(c[1]))) :
                    await di(tk.take("identifier"), async (c) => c ?
                        c[1] === "IO" ?
                            call(primary, async (x) => ret(typ_iov(x))) :
                            c[1] === "true" ? ret(typ_lit(true)) :
                                c[1] === "false" ? ret(typ_lit(false)) :
                                    c[1] === "Number" ? ret(typ_num()) :
                                        c[1] === "String" ? ret(typ_str()) :
                                            c[1] === "Boolean" ? ret(typ_bol()) :
                                                c[1] === "Unknown" ? ret(typ_unk()) :
                                                    c[1] === "Any" ? ret(typ_any()) :
                                                        await di(h[c[1]], async (l) => ret(l || typ_ref(c[1]))) :
                        fatal("Expected a type."))), and_lhs = async (x) => tk.take("amp") ? call(primary, y => and_lhs(typ_cnj(x, y))) : ret(x), and = async () => call(primary, and_lhs), or_lhs = async (x) => tk.take("bar") ? call(and, y => or_lhs(typ_dsj(x, y))) : ret(x), or = async () => call(and, or_lhs), arrow = async () => call(or, async (x) => tk.take("arrow") ?
        call(arrow, async (y) => ret(typ_abs([], x, y))) :
        ret(x)), type = arrow;
    return type;
});
const includes = {};
export const read_term = tk => async_homproc((call, ret) => {
    const fatal = m => {
        const w = tk.pos();
        throw new Error(`(${w[0]}:${w[1]}:${w[2]}): term parser: ${m}`);
    }, include = h => async () => {
        let ru = tk.take("literal");
        if (ru === undefined || typeof ru[1] !== "string") {
            fatal("Expected a string.");
        }
        const wp = tk.pos();
        const url = new URL(wp[0]);
        const dirname = url.href.substring(0, url.href.lastIndexOf('/'));
        const r = new URL(dirname + "/" + JSON.parse(ru[1])).href;
        const m = includes[r];
        if (m) {
            return ret(term_aka(m, `#"${r}"`));
        }
        let res = await fetch(`${r}`);
        if (!res.ok) {
            fatal(`HTTP status ${res.status} while requesting \`./${res.url}\`.`);
        }
        tk.unget(`${await res.text()})`);
        tk.unpos([r, 1, 1]);
        return call(expression(h), async (e) => {
            tk.take("rparen");
            tk.unpos(wp);
            const m = [e];
            includes[r] = m;
            return ret(term_aka(m, `#"${r}"`));
        });
    }, let_defs = (h, t, m) => async () => await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected an identifier.`) :
        tk.take("doublecolon") ?
            await di(await read_type(tk, h), async (te) => tk.take("in") ?
                call(dollar(h), async (x) => ret(term_mod(m, x))) :
                tk.take("comma") ?
                    di(te, dt => typeof dt === "string" ? (() => { throw new Error(); })() :
                        jmp(let_defs(h, { ...t, [i[1]]: dt }, m))) :
                    fatal(`Expected \`,\` or \`in\`.`)) :
            call(parameters(h, "equal"), async (y) => await di([...m, [i[1], y, t[i[1]] || null, tk.pos()]], async (mp) => tk.take("in") ?
                call(dollar(h), async (x) => ret(term_mod(mp, x))) :
                tk.take("comma") ? jmp(let_defs(h, t, mp)) :
                    fatal(`Expected \`,\` or \`in\`.`)))), rec_defs = (h, o) => async () => tk.take("dots") ?
        call(expression(h), async (e) => await di(() => [...o, [true, e]], async (r) => tk.take("rbrace") ? ret(term_res(r())) :
            tk.take("comma") ? jmp(rec_defs(h, r())) :
                fatal(`Expected \`,\` or \`}\`.`))) :
        await di(tk.pos(), async (w) => await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected \`...\`, or an identifier.`) :
            await di(() => [...o, [false, i[1], term_ref(w, i[1])]], async (r) => tk.take("rbrace") ? ret(term_res(r())) :
                tk.take("comma") ? jmp(rec_defs(h, r())) :
                    call(parameters(h, "colon"), async (y) => await di(() => [...o, [false, i[1], y]], async (r) => tk.take("rbrace") ? ret(term_res(r())) :
                        tk.take("comma") ? jmp(rec_defs(h, r())) :
                            fatal(`Expected \`,\` or \`}\`.`)))))), parameters = (h, k) => async () => tk.take(k) ? jmp(expression(h)) :
        await di(tk.pos(), async (w) => await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected an identifier or token kind \`${k}\`.`) :
            call(parameters(h, k), async (dx) => ret(term_abs(w, i[1], dx))))), try_primary = async (h) => await di(tk.pos(), async (w) => tk.take("hash") ? include(h) :
        tk.take("lbrace") ?
            async () => tk.take("rbrace") ? ret(term_res([])) :
                jmp(rec_defs(h, [])) :
            tk.take("rsolidus") ?
                parameters(h, "dot") :
                tk.take("lparen") ?
                    async () => call(expression(h), async (x) => tk.take("rparen") ? ret(x) :
                        fatal(`Expected \`)\`.`)) :
                    tk.take("let") ?
                        async () => tk.take("in") ? jmp(dollar(h)) :
                            jmp(let_defs(h, {}, [])) :
                        tk.take("type") ?
                            async () => await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected an identifier.`) :
                                !tk.take("equal") ? fatal(`Expected \`=\`.`) :
                                    await di(typ_unk(), async (tp) => await di({ ...h, [i[1]]: typ_aka(i[1], tp) }, async (g) => await di(await read_type(tk, g), async (t) => !tk.take("in") ? fatal(`Expected \`in\`.`) :
                                        (assign(tp, t),
                                            jmp(dollar(g))))))) :
                            await di(tk.take("literal"), async (c) => c ?
                                async () => ret(term_lit(c[1] === "undefined" ? undefined : JSON.parse(c[1]))) :
                                await di(tk.take("identifier"), async (r) => r ?
                                    async () => ret(term_ref(w, r[1])) :
                                    null))), access_rhs = h => async (x) => await di(tk.pos(), async (w) => tk.take("dot") ?
        tk.take("lbracket") ?
            call(expression(h), async (i) => !tk.take("rbracket") ? fatal(`Expected \`]\`.`) :
                access_rhs(h)(term_acs(w, x, i))) :
            await di(tk.take("identifier"), async (i) => i ? access_rhs(h)(term_acs(w, x, term_lit(i[1]))) :
                await di(tk.take("literal"), async (i) => i ? access_rhs(h)(term_acs(w, x, term_lit(JSON.parse(i[1])))) :
                    fatal("Expected a subscript."))) :
        ret(x)), try_access = async (h) => await di(await try_primary(h), async (up) => up === null ? null :
        async () => call(up, access_rhs(h))), access = h => async () => await di(await try_access(h), async (up) => up === null ? fatal("Expected a term.") :
        jmp(up)), juxt_rhs = h => async (x) => await di(await try_access(h), async (up) => await di(tk.pos(), async (w) => up === null ? ret(x) :
        call(up, async (y) => juxt_rhs(h)(term_app(w, x, y))))), juxt = h => async () => call(access(h), juxt_rhs(h)), as_rhs = h => async (x) => await di(tk.pos(), async (w) => tk.take("as") ?
        await di(await read_type(tk, h), async (t) => as_rhs(h)(term_cst(w, t, x))) :
        ret(x)), as = h => async () => call(juxt(h), as_rhs(h)), dollar = h => async () => call(as(h), async (x) => await di(tk.pos(), async (w) => tk.take("dollar") ?
        call(dollar(h), async (y) => ret(term_app(w, x, y))) :
        ret(x))), expression = dollar, all = h => async () => call(expression(h), async (e) => !tk.take("eof") ? fatal(`Expected end of file.`) :
        ret(e));
    return all({});
});
//# sourceMappingURL=read.js.map