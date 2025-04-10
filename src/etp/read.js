import { homproc } from "./run.js";
import { all, app, exs, imp, ref } from "./lang.js";
export const scanner = (x, doc) => {
    let w = [doc, 1, 1];
    return {
        pos() {
            return w;
        },
        take(t) {
            return () => {
                const r = x.match(t);
                if (!r) {
                    return null;
                }
                for (let re = /\n/g, colo = 0;;) {
                    const m = re.exec(r[0]);
                    if (!m) {
                        w[2] += r[0].length - colo;
                        x = x.slice(r[0].length);
                        return r[0];
                    }
                    colo = m.index + w[2];
                    w[1]++;
                }
            };
        },
        eof() {
            return x.length === 0;
        },
        msg(m) {
            return `(${w}): ${m}`;
        },
        fatal(m) {
            throw new Error(`(${w}): ${m}`);
        }
    };
};
const idreg = /^[^\s\\\/∀∃\.\(\)\->→]+/;
export const read_prop = s => homproc((call, cc, ret) => {
    const id = s.take(idreg), ws = s.take(/^\s*/), ar = s.take(/^(->|→)/), lm = s.take(/^[\\∀]/), ex = s.take(/^[\/∃]/), dt = s.take(/^\./), lp = s.take(/^\(/), rp = s.take(/^\)/), uparameters = () => (ws(), dt() ? cc(arrow) : (param => param ? call(uparameters, body => ret(all(param, body))) : s.fatal("Expected `.` or an identifier."))(id())), eparameters = () => (ws(), dt() ? cc(arrow) : (param => param ? call(uparameters, body => ret(exs(param, body))) : s.fatal("Expected `.` or an identifier."))(id())), primary = () => (ws(),
        lm() ? () => cc(uparameters) :
            ex() ? () => cc(eparameters) :
                lp() ? () => (wp => call(arrow, x => rp() ? ret(x) : s.fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...s.pos()]) :
                    (r => r ? () => ret(ref(r)) : null)(id())), juxt_rhs = x => (u => u ? call(u, y => juxt_rhs(app(x, y))) : ret(x))(primary()), juxt = () => (u => u ? call(u, x => juxt_rhs(x)) : s.fatal("Expected a term."))(primary()), arrow = () => call(juxt, dx => (ws(), ar() ? call(arrow, dy => ret(imp(dx, dy))) : ret(dx)));
    const u = primary();
    if (!u) {
        return s.fatal("Expected expression.");
    }
    return u();
});
export const read_proof = s => {
    const id = s.take(idreg), ws = s.take(/^([^\S\n]|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/), nl = s.take(/^(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/), gu = s.take(/^[^\n]*($|\n(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*)/);
    const l = [];
    const m = [];
    nl();
    for (;;) {
        ws();
        if (s.eof()) {
            m.push(s.msg("Unexpected end of file."));
            return [l, m, s.pos()[1]];
        }
        const lhs = id();
        if (!lhs) {
            m.push(s.msg("Expected a directive."));
            gu();
            continue;
        }
        switch (lhs) {
            case "qed": {
                return [l, m, s.pos()[1]];
            }
            case "intro": {
                const ids = [];
                for (;;) {
                    ws();
                    if (nl() || s.eof())
                        break;
                    const i = read_prop(s);
                    if (!i) {
                        m.push(s.msg("Expected a binding."));
                        break;
                    }
                    ids.push(i);
                }
                l.push({ kind: "intro", ids, where: [...s.pos()] });
                continue;
            }
            case "use": {
                ws();
                let prop = read_prop(s);
                if (!prop) {
                    m.push(s.msg("Expected a proposition."));
                    gu();
                    continue;
                }
                if (!nl()) {
                    m.push(s.msg("Expected a newline."));
                }
                l.push({ kind: "use", prop, where: [...s.pos()] });
                continue;
            }
            case "push": {
                ws();
                let hyp = read_prop(s);
                if (!hyp) {
                    m.push(s.msg("Expected a binder."));
                    gu();
                    continue;
                }
                const ops = [];
                for (;;) {
                    ws();
                    if (nl() || s.eof())
                        break;
                    try {
                        ops.push(read_prop(s));
                    }
                    catch (e) {
                        m.push(s.msg(e.message));
                        gu();
                        break;
                    }
                }
                l.push({ kind: "push", hyp, ops, where: [...s.pos()] });
                continue;
            }
            case "with": {
                ws();
                let hyp = read_prop(s);
                if (!hyp || hyp.kind !== "ref") {
                    m.push(s.msg("Expected an identifier."));
                    gu();
                    continue;
                }
                if (!nl() && !s.eof()) {
                    m.push(s.msg("Expected a newline."));
                }
                l.push({ kind: "with", hyp, where: [...s.pos()] });
                continue;
            }
            case "apply": {
                ws();
                let hyp = read_prop(s);
                if (!hyp) {
                    m.push(s.msg("Expected a binder."));
                    gu();
                    continue;
                }
                const ops = [];
                for (;;) {
                    ws();
                    if (nl() || s.eof())
                        break;
                    try {
                        ops.push(read_prop(s));
                    }
                    catch (e) {
                        m.push(s.msg(e.message));
                        gu();
                        break;
                    }
                }
                l.push({ kind: "apply", hyp, ops, where: [...s.pos()] });
                continue;
            }
            case "sorry": {
                if (!nl() && !s.eof()) {
                    m.push(s.msg("Expected a newline."));
                }
                l.push({ kind: "sorry", where: [...s.pos()] });
                continue;
            }
            default: {
                m.push(s.msg("Unrecognized directive."));
                continue;
            }
        }
    }
};
export const read_article = s => {
    const id = s.take(idreg), ws = s.take(/^([^\S\n]|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/), nl = s.take(/^(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/), gu = s.take(/^[^\n]*($|\n(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*)/);
    const article = [];
    const messages = [];
    let scheme = [];
    nl();
    for (;;) {
        ws();
        if (s.eof()) {
            return [article, messages];
        }
        const where = [...s.pos()];
        const lhs = id();
        const last_scheme = scheme;
        scheme = [];
        if (!lhs) {
            messages.push(s.fatal("Expected a directive."));
            gu();
            continue;
        }
        switch (lhs) {
            case "declare": {
                const ids = [];
                for (;;) {
                    ws();
                    if (nl() || s.eof())
                        break;
                    const i = id();
                    if (!i) {
                        messages.push(s.msg("Expected an identifier."));
                        gu();
                        break;
                    }
                    ids.push(i);
                }
                article.push({ kind: "declare", ids, where });
                continue;
            }
            case "schema": {
                for (;;) {
                    ws();
                    if (nl() || s.eof())
                        break;
                    const i = id();
                    if (!i) {
                        messages.push(s.msg("Expected an identifier."));
                        gu();
                        break;
                    }
                    scheme.push(i);
                }
                continue;
            }
            case "theorem": {
                ws();
                let name;
                try {
                    name = read_prop(s);
                }
                catch (e) {
                    messages.push(s.msg(e.message));
                    gu();
                    break;
                }
                let prop;
                try {
                    prop = read_prop(s);
                    if (!nl() && !s.eof()) {
                        messages.push(s.msg("Expected a newline."));
                    }
                }
                catch (e) {
                    messages.push(e.message);
                    prop = ref("???");
                    gu();
                }
                const [proof, proof_messages] = read_proof(s);
                messages.push(...proof_messages);
                article.push({ kind: "theorem", name, scheme: last_scheme, prop, proof, where });
                break;
            }
            case "axiom": {
                ws();
                let name;
                try {
                    name = read_prop(s);
                }
                catch (e) {
                    messages.push(s.msg(e.message));
                    gu();
                    break;
                }
                let prop;
                try {
                    prop = read_prop(s);
                }
                catch (e) {
                    messages.push(e.message);
                    prop = ref("???");
                    gu();
                }
                article.push({ kind: "axiom", name, scheme: last_scheme, prop, where });
                break;
            }
            default:
                messages.push(s.msg("Unrecognized directive."));
                gu();
                continue;
        }
        if (!nl() && !s.eof()) {
            messages.push(s.msg("Expected a newline."));
        }
    }
};
//# sourceMappingURL=read.js.map