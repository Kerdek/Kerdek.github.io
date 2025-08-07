import { homproc } from "../run.js";
export const read = x => homproc((call, _cc, ret) => {
    let w = [window.location.href, 1, 1];
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
    }, id = k(/^[^\s\\λ\.\(\)]+/), ws = k(/^\s*/), lm = k(/^[\\λ]/), dt = k(/^\./), lp = k(/^\(/), rp = k(/^\)/), fatal = m => { throw new Error(`(${w}): ${m}`); }, parameters = () => (ws(), dt() ? call(expression, x => ret(x)) : (ws(), (param => param ? call(parameters, body => ret({ kind: "abs", param, body })) : fatal("Expected `.` or an identifier."))(id()))), primary = () => (ws(),
        lm() ? () => call(parameters, x => ret(x)) :
            lp() ? () => (wp => call(expression, x => rp() ? ret(x) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...w]) :
                (r => r ? () => ret({ kind: "ref", id: r }) : null)(id())), juxt_rhs = x => (up => up ? call(up, y => juxt_rhs({ kind: "app", lhs: x, rhs: y })) : ret(x))(primary()), juxt = () => (up => up ? call(up, x => juxt_rhs(x)) : fatal("Expected a term."))(primary()), expression = juxt;
    return () => call(expression, e => x.length !== 0 ? fatal(`Expected end of file.`) : ret(e));
});
//# sourceMappingURL=read.js.map