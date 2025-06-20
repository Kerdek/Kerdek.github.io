import { homproc } from "./run.js";
import { app, abs, imp, ref } from "./church.js";
export const read = x => homproc((call, cc, ret) => {
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
    }, id = k(/^[^\s\\λ\.\(\)\->]+/), ws = k(/^(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/), ar = k(/^->/), lm = k(/^[\\λ]/), dt = k(/^\./), lp = k(/^\(/), rp = k(/^\)/), fatal = m => { throw new Error(`(${w}): ${m}`); }, parameters = () => (ws(), dt() ? cc(expression) : (param => param ? call(parameters, body => ret(abs(param, body))) : fatal("Expected `.` or an identifier."))(id())), primary = () => (ws(),
        lm() ? () => cc(parameters) :
            lp() ? () => (wp => call(expression, x => rp() ? ret(x) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...w]) :
                (r => r ? () => ret(ref(r)) : null)(id())), juxt_rhs = x => (u => u ? call(u, y => juxt_rhs(app(x, y))) : ret(x))(primary()), juxt = () => (u => u ? call(u, x => juxt_rhs(x)) : fatal("Expected a term."))(primary()), arrow = () => call(juxt, dx => ar() ? call(arrow, dy => ret(imp(dx, dy))) : ret(dx)), expression = arrow;
    return call(expression, e => x.length !== 0 ? fatal(`Expected end of file.`) : ret(e));
});
//# sourceMappingURL=read.js.map