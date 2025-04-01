import { homproc } from "./run.js"
import { Proof, Prop, all, app, imp, ref } from "./lang.js"

export type TextPosition = [string, number, number]
export type Token = () => string | null

export type Scanner = {
  pos(): TextPosition
  take(re: RegExp): Token,
  eof(): boolean,
  msg(m: string): string,
  fatal(m: string): never }

export const scanner = (x: string, doc: string): Scanner => {
  let w: TextPosition = [doc, 1, 1]
  return {
    pos() {
      return w },
    take(t) {
      return () => {
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
          w[1]++ } } },
    eof() {
      return x.length === 0 },
    msg(m) {
      return `(${w}): ${m}` },
    fatal(m) {
      throw new Error(`(${w}): ${m}`) } } }

export const read_prop: (s: Scanner) => Prop = s => homproc((call, cc, ret) => {
type Branch = ReturnType<typeof ret>
const
  id = s.take(/^[^\s\\\.\(\)->\*]+/),
  ws = s.take(/^\s*/), ar = s.take(/^->/),
  as = s.take(/^\*/),
  lm = s.take(/^\\/), dt = s.take(/^\./),
  lp = s.take(/^\(/), rp = s.take(/^\)/),
  parameters: () => Branch = () => (ws(), dt() ? cc(arrow) : ((star, param) => param ? call(parameters, body => ret(all(param, star ? true : false, body))) : s.fatal("Expected `.` or an identifier."))(as(), (ws(), id()))),
  primary: () => (() => Branch) | null = () => (ws(),
    lm() ? () => cc(parameters) :
    lp() ? () => (wp => call(arrow, x => rp() ? ret(x) : s.fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...s.pos()]) :
    (r => r ? () => ret(ref(r)) : null)(id())),
  juxt_rhs: (e: Prop) => Branch = x => (u => u ? call(u, y => juxt_rhs(app(x, y))) : ret(x))(primary()),
  juxt: () => Branch = () => (u => u ? call(u, x => juxt_rhs(x)) : s.fatal("Expected a term."))(primary()),
  arrow: () => Branch = () => call(juxt, dx => (ws(), ar() ? call(arrow, dy => ret(imp(dx, dy))) : ret(dx)))
const u = primary()
if (!u) {
  return s.fatal("Expected expression.") }
return u() })

export const read_proof: (s: Scanner) => [Proof, string[]] = s => {
const
  id = s.take(/^[^\s\\\.\(\)->]+/),
  ws = s.take(/^([^\S\n]|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/),
  nl = s.take(/^(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/),
  gu = s.take(/^[^\n]*($|\n(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*)/)
const l: Proof = []
const m: string[] = []
nl()
for (;;) {
  ws()
  if (s.eof()) {
    m.push(s.msg("Unexpected end of file."))
    return [l, m] }
  const lhs = id()
  if (!lhs) {
    m.push(s.msg("Expected a directive."))
    gu()
    continue }
  switch (lhs) {
    case "qed":
      return [l, m]
    case "intro":
      const ids: string[] = []
      for (;;) {
        ws()
        if (nl() || s.eof()) break
        const i = id()
        if (!i) {
          m.push(s.msg("Expected an identifier."))
          break }
        ids.push(i) }
      l.push({ kind: "intro", ids })
      continue
    case "apply":
      ws()
      let hyp = id()
      if (!hyp) {
        m.push(s.msg("Expected an identifier."))
        gu()
        continue }
      const ops: Prop[] = []
      for (;;) {
        ws()
        if (nl() || s.eof()) break
        try {
          ops.push(read_prop(s)) }
        catch (e) {
          m.push(s.msg((e as Error).message))
          gu()
          break } }
      l.push({ kind: "apply", hyp, ops })
      continue
    case "sorry":
      if (!nl() && !s.eof()) {
        m.push(s.msg("Expected a newline.")) }
      l.push({ kind: "sorry" })
      continue
    default:
      m.push(s.msg("Unrecognized directive."))
      continue } } }

export const read_article: (s: Scanner) => [[string, Prop, Proof][], string[]] = s => {
const
  id = s.take(/^[^\s\\\.\(\)->]+/),
  ws = s.take(/^([^\S\n]|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/),
  nl = s.take(/^(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*/),
  gu = s.take(/^[^\n]*($|\n(\s|--[^\n]*|\(\*([^\*]|\*[^\)])*\*\))*)/)
const l: [string, Prop, Proof][] = []
const m: string[] = []
nl()
for (;;) {
  ws()
  if (s.eof()) {
    return [l, m] }
  const lhs = id()
  if (!lhs) {
    m.push(s.fatal("Expected a directive."))
    gu()
    continue }
  switch (lhs) {
    case "theorem": {
      ws()
      const n = id()
      if (!n) {
        m.push(s.fatal("Expected an identifier."))
        gu()
        continue }
      let prop!: Prop
      try {
        prop = read_prop(s)
        if (!nl() && !s.eof()) {
          m.push(s.msg("Expected a newline.")) } }
      catch (e) {
        m.push((e as Error).message)
        prop = ref("???")
        gu() }
      const [u, m2] = read_proof(s)
      m.push(...m2)
      l.push([n, prop, u])
      break }
    case "axiom": {
      ws()
      const n = id()
      if (!n) {
        m.push(s.fatal("Expected an identifier."))
        gu()
        continue }
      let prop!: Prop
      try {
        prop = read_prop(s) }
      catch (e) {
        m.push((e as Error).message)
        prop = ref("???")
        gu() }
      l.push([n, prop, [{ kind: "sorry" }]])
      break }
    default:
      m.push(s.msg("Unrecognized directive."))
      gu()
      continue }
  if (!nl() && !s.eof()) {
    m.push(s.msg("Expected a newline.")) } } }
