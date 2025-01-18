import { async_homproc } from "../run.js";
export const read = async (x) => (async_homproc((call, _cc, ret) => {
    let w = [window.location.href, 1, 1];
    const includes = {};
    const k = t => () => {
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
    }, ws = k(/^(\s|\/\/([^\n\\]|\\[\s\S])*?(\n|$)|\/\*([^\*\\]|\\[\s\S])*?(\*\/|$))*/), id = k(/^\w[\w0-9]*/), sc = k(/^"([^"\\]|\\.)*("|$)/), nc = k(/^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/), tc = k(/^true/), fc = k(/^false/), lm = k(/^(\\|λ)/), dt = k(/^\./), ds = k(/^\$/), as = k(/^\*/), lp = k(/^\(/), rp = k(/^\)/), hs = k(/^#/), fatal = m => { throw new Error(`(${w}): ${m}`); }, include = async () => {
        let ru = sc();
        if (!ru) {
            fatal("Expected a string.");
        }
        const url = new URL(w[0]);
        const dirname = url.href.substring(0, url.href.lastIndexOf('/'));
        const r = new URL(dirname + "/" + JSON.parse(ru)).href;
        const m = includes[r];
        if (m) {
            return ret({ kind: "shr", body: m });
        }
        let res = await fetch(`${r}`);
        if (!res.ok) {
            fatal(`HTTP status ${res.status} while requesting \`${res.url}\`.`);
        }
        x = `${await res.text()})${x}`;
        const wp = [...w];
        w[0] = r;
        w[1] = 1,
            w[2] = 1;
        return call(expression, async (e) => {
            rp();
            w[0] = wp[0];
            w[1] = wp[1];
            w[2] = wp[2];
            const m = { kind: "shr", body: e };
            includes[r] = m;
            return ret(m);
        });
    }, parameters = async () => (ws(), dt() ? call(expression, async (x) => ret(x)) : await (async (_o, param) => param ? call(parameters, async (body) => ret({ kind: "abs", param, body })) : fatal("Expected `.` or an identifier."))(as(), (ws(), id()))), primary = async () => (ws(),
        hs() ? include :
            lm() ? async () => call(parameters, async (x) => ret(x)) :
                lp() ? async () => await (async (wp) => call(expression, async (x) => rp() ? ret(x) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...w]) :
                    await (async (r) => r ? async () => ret({ kind: "lit", value: JSON.parse(r) }) :
                        await (async (r) => r ? async () => ret({ kind: "ref", id: r }) : null)(id()))(fc() || tc() || nc() || sc())), juxt_rhs = async (x) => await (async (up) => up ? call(up, y => juxt_rhs({ kind: "app", lhs: x, rhs: y })) : ret(x))(await primary()), juxt = async () => await (async (up) => up ? call(up, x => juxt_rhs(x)) : fatal("Expected a term."))(await primary()), dollar = async () => call(juxt, async (x) => ds() ? call(dollar, async (y) => ret({ kind: "app", lhs: x, rhs: y })) : ret(x)), expression = dollar;
    return async () => call(expression, async (e) => x.length !== 0 ? fatal(`Expected end of file.`) : ret(e));
}));
//# sourceMappingURL=read.js.map