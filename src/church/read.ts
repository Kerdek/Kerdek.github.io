import { async_homproc } from "../run.js"
import { Graph, Shr } from "./church.js"

export const read: (x: string) => Promise<Graph> = async (x) => (async_homproc((call, _cc, ret) => {
type Branch = ReturnType<typeof ret>
type Take = (re: RegExp) => Token
type Token = () => string | null
type TextPosition = [string, number, number]
type Fatal = (msg: string) => never
let w: TextPosition = [window.location.href, 1, 1]
const includes: { [i: string]: Shr } = {}
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
  ws = k(/^(\s|\/\/([^\n\\]|\\[\s\S])*?(\n|$)|\/\*([^\*\\]|\\[\s\S])*?(\*\/|$))*/),
  id = k(/^\w[\w0-9]*/), sc = k(/^"([^"\\]|\\.)*("|$)/),
  nc = k(/^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/),
  tc = k(/^true/), fc = k(/^false/),
  lm = k(/^(\\|λ)/), dt = k(/^\./), ds = k(/^\$/), as = k(/^\*/),
  lp = k(/^\(/), rp = k(/^\)/), hs = k(/^#/),
  fatal: Fatal = m => { throw new Error(`(${w}): ${m}`) },
  include: () => Promise<Branch> = async () => {
    let ru = sc()
    if (!ru) {
      fatal("Expected a string.") }
    const url = new URL(w[0])
    const dirname = url.href.substring(0, url.href.lastIndexOf('/'))
    const r = new URL(dirname + "/" + JSON.parse(ru)).href
    const m = includes[r]
    if (m) {
      return ret({ kind: "shr", body: m }) }
      let res = await fetch(`${r}`);
    if (!res.ok) {
      fatal(`HTTP status ${res.status} while requesting \`${res.url}\`.`) }
      x = `${await res.text()})${x}`
      const wp: TextPosition = [...w]
      w[0] = r
      w[1] = 1,
      w[2] = 1
      return call(expression, async e => {
        rp()
        w[0] = wp[0]
        w[1] = wp[1]
        w[2] = wp[2]
        const m: Shr = { kind: "shr", body: e}
        includes[r] = m
        return ret(m) }) },
  parameters: () => Promise<Branch> = async () => (ws(), dt() ? call(expression, async x => ret(x)) : await (async (_o, param) => param ? call(parameters, async body => ret({ kind: "abs", param, body })) : fatal("Expected `.` or an identifier."))(as(), (ws(), id()))),
  primary: () => Promise<(() => Promise<Branch>) | null> = async () => (ws(),
    hs() ? include :
    lm() ? async () => call(parameters, async x => ret(x)) :
    lp() ? async () => await (async wp => call(expression, async x => rp() ? ret(x) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...w]) :
    await (async r => r ? async () => ret({ kind: "lit", value: JSON.parse(r) }) :
    await (async r => r ? async () => ret({ kind: "ref", id: r }) : null)(id()))(fc() || tc() || nc() || sc())),
  juxt_rhs: (e: Graph) => Promise<Branch> = async x => await (async up => up ? call(up, y => juxt_rhs({ kind: "app", lhs: x, rhs: y })) : ret(x))(await primary()),
  juxt: () => Promise<Branch> = async () => await (async up => up ? call(up, x => juxt_rhs(x)) : fatal("Expected a term."))(await primary()),
  dollar: () => Promise<Branch> = async () => call(juxt, async x => ds() ? call(dollar, async y => ret({ kind: "app", lhs: x, rhs: y })) : ret(x)),
  expression = dollar
return async () => call(expression, async e => x.length !== 0 ? fatal(`Expected end of file.`) : ret(e)) }))
