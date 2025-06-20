import { homproc } from "./run.js"
import { Term, app, abs, imp, ref } from "./church.js"

export const read: (x: string) => Term = x => homproc((call, cc, ret) => {
type Branch = ReturnType<typeof ret>
type Take = (re: RegExp) => Token
type Token = () => string | null
type TextPosition = [string, number, number]
type Fatal = (msg: string) => never
let w: TextPosition = [window.location.href, 1, 1]
const
  k: Take = t => () => {
    const r = x.match(t)
    if (!r) {
      return null }
    for (let re = /\n/g, colo = 0;;) {
      const m = re.exec(r[0])
      if (!m) {
        w[2] += r[0].length - colo
        x = x.slice(r[0].length)
        return r[0] }
      colo = m.index + w[2]
      w[1]++ } },
  id = k(/^[^\s\\λ\.\(\)\->]+/),
  ws = k(/^(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/), ar = k(/^->/),
  lm = k(/^[\\λ]/), dt = k(/^\./),
  lp = k(/^\(/), rp = k(/^\)/),
  fatal: Fatal = m => { throw new Error(`(${w}): ${m}`) },
  parameters: () => Branch = () => (ws(), dt() ? cc(expression) : (param => param ? call(parameters, body => ret(abs(param, body))) : fatal("Expected `.` or an identifier."))(id())),
  primary: () => (() => Branch) | null = () => (ws(),
    lm() ? () => cc(parameters) :
    lp() ? () => (wp => call(expression, x => rp() ? ret(x) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...w]) :
    (r => r ? () => ret(ref(r)) : null)(id())),
  juxt_rhs: (e: Term) => Branch = x => (u => u ? call(u, y => juxt_rhs(app(x, y))) : ret(x))(primary()),
  juxt: () => Branch = () => (u => u ? call(u, x => juxt_rhs(x)) : fatal("Expected a term."))(primary()),
  arrow: () => Branch = () => call(juxt, dx => ar() ? call(arrow, dy => ret(imp(dx, dy))) : ret(dx)),
  expression = arrow
return call(expression, e => x.length !== 0 ? fatal(`Expected end of file.`) : ret(e)) })
