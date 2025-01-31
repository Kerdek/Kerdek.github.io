import { di } from "../di.js";
import { async_homproc } from "../run.js";
import { make } from "./cru.js";
import { delimit } from "./evaluate.js";
const includes = {};
export const read = tk => async_homproc((call, cc, ret) => {
    const fatal = m => { throw new Error(`(${tk.pos()[0]}:${tk.pos()[1]}:${tk.pos()[2]}): parser: ${m}`); }, include = async () => {
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
            return ret(m);
        }
        let res = await fetch(`${r}`);
        if (!res.ok) {
            fatal(`HTTP status ${res.status} while requesting \`${res.url}\`.`);
        }
        tk.unget(`${await res.text()})`);
        tk.unpos([r, 1, 1]);
        return call(expression, async (e) => {
            tk.take("rparen");
            tk.unpos(wp);
            const m = make("shr", delimit(e)[0]);
            includes[r] = m;
            return ret(m);
        });
    }, lst_elems = l => async () => await di(tk.take("dots"), async (is_splat) => call(expression, async (e) => tk.take("rbracket") ? ret(make("lst", [...l, [is_splat ? true : false, e]])) :
        tk.take("comma") ? cc(lst_elems([...l, [is_splat ? true : false, e]])) :
            fatal(`Expected \`,\` or \`]\`.`))), rec_defs = o => async () => tk.take("dots") ?
        call(expression, async (e) => await di(() => [...o, [true, e]], async (r) => tk.take("rbrace") ? ret(make("rec", r())) :
            tk.take("comma") ? cc(rec_defs(r())) :
                fatal(`Expected \`,\` or \`}\`.`))) :
        tk.take("lbracket") ?
            call(expression, async (i) => !tk.take("rbracket") ? fatal(`Expected \`]\`.`) :
                call(parameters("colon"), async (y) => await di(() => [...o, [false, i, y]], async (r) => tk.take("rbrace") ? ret(make("rec", r())) :
                    tk.take("comma") ? cc(rec_defs(r())) :
                        fatal(`Expected \`,\` or \`}\`.`)))) :
            await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected \`...\`, \`[\`, or an identifier.`) :
                await di(() => [...o, [false, make("lit", i[1]), make("var", i[1])]], async (r) => tk.take("rbrace") ? ret(make("rec", r())) :
                    tk.take("comma") ? cc(rec_defs(r())) :
                        call(parameters("colon"), async (y) => await di(() => [...o, [false, make("lit", i[1]), y]], async (r) => tk.take("rbrace") ? ret(make("rec", r())) :
                            tk.take("comma") ? cc(rec_defs(r())) :
                                fatal(`Expected \`,\` or \`}\`.`))))), let_defs = m => async () => await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected an identifier.`) :
        call(parameters("equal"), async (y) => tk.take("in") ? call(dollar, async (x) => ret(make("mod", [...m, [i[1], y]], x))) :
            tk.take("comma") ? cc(let_defs([...m, [i[1], y]])) :
                fatal(`Expected \`,\` or \`in\`.`))), parameters = k => async () => tk.take(k) ? cc(expression) :
        await di(tk.take("identifier"), async (i) => i ? call(parameters(k), async (dx) => ret(make("abs", i[1], dx))) :
            fatal(`Expected token kind \`${k}\`.`)), try_primary = async () => tk.take("hash") ? include :
        tk.take("lbracket") ?
            async () => tk.take("rbracket") ? ret(make("lst", [])) :
                cc(lst_elems([])) :
            tk.take("lbrace") ?
                async () => tk.take("rbrace") ? ret(make("rec", [])) :
                    cc(rec_defs([])) :
                tk.take("rsolidus") ?
                    parameters("arrow") :
                    tk.take("lparen") ?
                        async () => call(expression, async (x) => tk.take("rparen") ? ret(x) :
                            fatal(`Expected \`)\`.`)) :
                        tk.take("let") ?
                            async () => tk.take("in") ? cc(dollar) :
                                cc(let_defs([])) :
                            await di(tk.take("literal"), async (c) => c ? async () => ret(make("lit", c[1] === "undefined" ? undefined :
                                JSON.parse(c[1]))) :
                                await di(tk.take("identifier"), async (r) => r ? async () => ret(make("var", r[1])) : null)), access_rhs = async (x) => tk.take("dot") ?
        await di(tk.take("identifier"), async (i) => i ? access_rhs(make("acs", x, make("lit", i[1]))) :
            await di(tk.take("literal"), async (i) => i ? access_rhs(make("acs", x, make("lit", i[1]))) :
                fatal("Expected a subscript."))) :
        tk.take("dotbracket") ?
            call(expression, async (i) => !tk.take("rbracket") ? fatal(`Expected \`]\`.`) :
                access_rhs(make("acs", x, i))) :
            ret(x), try_access = async () => await di(await try_primary(), async (up) => up === null ? null :
        async () => call(up, access_rhs)), access = async () => await di(await try_access(), async (up) => up === null ? fatal("Expected a term.") :
        cc(up)), juxt_rhs = async (x) => await di(await try_access(), async (up) => up === null ? ret(x) :
        call(up, async (y) => juxt_rhs(make("app", x, y)))), juxt = async () => call(access, juxt_rhs), dollar = async () => call(juxt, async (x) => tk.take("dollar") ?
        call(dollar, async (y) => ret(make("app", x, y))) :
        ret(x)), where_defs = ([, m, x]) => async () => await di(tk.take("identifier"), async (i) => !i ? fatal(`Expected an identifier.`) :
        call(parameters("equal"), async (y) => tk.take("rparen") ? ret(make("mod", [...m, [i[1], y]], x)) :
            tk.take("comma") ? cc(where_defs(make("mod", [...m, [i[1], y]], x))) :
                fatal(`Expected \`)\` or \`,\`.`))), where_clause = x => async () => di(make("mod", [], x), r => tk.take("rparen") ? ret(r) :
        cc(where_defs(r))), where_seq = async (x) => tk.take("where") ?
        !tk.take("lparen") ? fatal(`Expected \`(\`.`) :
            call(where_clause(x), where_seq) :
        ret(x), where = async () => call(dollar, where_seq), expression = where, all = async () => call(expression, async (e) => !tk.take("eof") ? fatal(`Expected end of file.`) :
        ret(delimit(e)[0]));
    return all;
});
//# sourceMappingURL=read.js.map