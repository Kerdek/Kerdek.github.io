import { Branch, homproc, jmp, Process, call, run, async_homproc, AsyncProcess, AsyncBranch, ret } from '../run.js'

// syntax node types
type App = ["app", Graph, Graph]
type Abs = ["abs", string, EvaluationOrder, Graph]
type Ref = ["ref", string]
type Lit = ["lit", any]

// runtime node types
type Ext = ["ext", string, Bar, Graph]
type Elm = ["elm", string, Graph]
type Ind = ["ind", Bar]

export type Bar = [Graph]

export type Normal = Abs | Ref | Lit
export type Tree = Normal | App | Ref | Ind | Elm
export type Graph = Tree | Ext
export type Kind = Graph[0]

export type PrettyOptions = {
  overcomeBarriers?: boolean,
  showExistentials?: boolean,
  showEliminators?: boolean,
  surroundTrailingQuantifiers?: boolean }

export type Fatal = (m: string) => never
export type AsyncRead = (src: string) => Promise<Tree>
export type Print = (e: Graph) => string
export type Pretty = (e: Graph, o?: PrettyOptions) => string
export type Delimit = (e: Tree) => [Tree, Uses]
export type Bubble = (e: Ext) => Graph
export type AlphaBeta = (e: Graph) => void
export type BuiltinFunction = (call: (u: Process, v: (x: Graph) => Branch) => Branch, ret: (x: Normal) => Branch, s: GraphProcess, fatal: Fatal, r: Graph) => Branch
export type Evaluate = (e: Graph) => Graph
export type EvaluateOne = (e: Graph) => Graph | null
export type EvaluationOrder = "lazy" | "applicative"
export type GraphProcess = (e: Graph) => Process

type Sorts = { [i in Kind]: [i, ...Rest<i, Graph>] }
type Rest<i, Term> = Term extends [i, ...infer R] ? R : never
type Make = <K extends any[]>(...x: K) => K
type Assign = <K extends Graph>(e: Graph, x: K) => K
type Visit = <K extends Kind>(o: { [i in K]: (e: Sorts[i]) => Branch }) => <I extends K>(e: Sorts[I]) => () => Branch
type Format = (x: string) => string
type OrderMark = (o: EvaluationOrder) => string
type Parens = (q: boolean) => Format
type Uses = string[]
type AsyncTreeBranch = (e: Tree) => Promise<AsyncBranch>
type AbsProcess = (e: Abs) => Process
type ExtProcess = (e: Ext) => Process
type PrintProcess = (precedence: 0 | 1, rightmost: boolean) => GraphProcess

export const assign: Assign = (e, x) => {
  let i = 0
  for (; i < x.length; i++) {
    e[i] = x[i] as any }
  for (; i < e.length; i++) {
    delete e[i] }
  return e as any }

export const make: Make = (...x) => x
export const visit: Visit = o => e => (f => () => f(e))(o[e[0]])

export const read: AsyncRead = async x => (async_homproc((call, ret) => {
type Take = (re: RegExp) => Token
type Token = () => string | null
type TextPosition = [string, number, number]
type Fatal = (msg: string) => never
let w: TextPosition = ["<user input>", 1, 1]
const includes: { [i: string]: Bar } = {}
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
  include: AsyncProcess = async () => {
    let ru = sc()
    if (ru == null) {
      fatal("Expected a string.") }
    const r = JSON.parse(ru) as string
    const m = includes[r]
    if (m) {
      return ret(make("ind", m)) }
    let res = await fetch(`../lc/${r}`);
    if (!res.ok) {
      fatal(`HTTP status ${res.status} while requesting \`${res.url}\``) }
    x = `${await res.text()})${x}`
    const wp: TextPosition = [...w]
    w[0] = ru
    w[1] = 1,
    w[2] = 1
    return call(expression, async e => {
      rp()
      w[0] = wp[0]
      w[1] = wp[1]
      w[2] = wp[2]
      const m: Bar = make(e)
      includes[r] = m
      return ret(make("ind", m)) }) },
  parameters: AsyncProcess = async () => (ws(), dt() ? jmp(expression) : ((o, i) => i ? call(parameters, async x => ret(make("abs", i, o ? "applicative" : "lazy", x))) : fatal("Expected `.` or an identifier."))(as(), (ws(), id()))),
  primary: () => AsyncProcess | null = () => (ws(),
    hs() ? include :
    lm() ? async () => jmp(parameters) :
    lp() ? async () => (wp => call(expression, async x => rp() ? ret(x) : fatal(`Expected \`)\` to match \`(\` at (${wp}).`)))([...w]) :
    (r => r ? async () => ret(make("lit", JSON.parse(r))) :
    (r => r ? async () => ret(make("ref", r)) : null)(id()))(fc() || tc() || nc() || sc())),
  juxt_rhs: AsyncTreeBranch = async x => (up => up ? call(up, y => juxt_rhs(make("app", x, y))) : ret(x))(primary()),
  juxt: AsyncProcess = async () => (up => up ? call(up, x => juxt_rhs(x)) : fatal("Expected a term."))(primary()),
  dollar: AsyncProcess = async () => call(juxt, async x => ds() ? call(dollar, async y => ret(make("app", x, y))) : ret(x)),
  expression = dollar
return async () => call(expression, async e => x.length !== 0 ? fatal(`Expected end of file.`) : ret(delimit(e)[0])) }))

const order_mark: OrderMark = o => o === "applicative" ? "*" : ""

export const print: Print = e => homproc((call, ret) => {
const s: GraphProcess = visit({
  abs: ([, i, o, x]) => call(s(x), dx => ret(`(λ${order_mark(o)}${i}.${dx})`)),
  app: ([, x, y]) => call(s(x), dx => call(s(y), dy => ret(`(${dx} ${dy})`))),
  ref: ([, r]) => ret(r),
  ext: ([, i, , y]) => call(s(y), dy => ret(`(∃${i}.${dy})`)),
  elm: ([, , x]) => jmp(s(x)),
  ind: e => jmp(s(e[1][0])),
  lit: ([, v]) => ret(JSON.stringify(v)) })
return s(e) })

export const pretty: Pretty = (e, o) => homproc((call, ret) => {
const
  op = o || {},
  p: Parens = q => q ? t => `(${t})` : t => t,
  l: AbsProcess = ([, i, o, x]) => () => x[0] === "abs" ? call(l(x), dx => ret(`${order_mark(o)}${i} ${dx}`)) : call(s(0, true)(x), dx => ret(`${order_mark(o)}${i}.${dx}`)),
  m: ExtProcess = ([, i, , y]) => () => y[0] === "ext" ? call(m(y), dy => ret(`${i} ${dy}`)) : call(s(0, true)(y), dy => ret(`${i}.${dy}`)),
  s: PrintProcess = (pr, rm) => visit({
    app: ([, x, y]) => call(s(0, false)(x), dx => call(s(1, rm || pr > 0)(y), dy => ret(p(pr > 0)(`${dx} ${dy}`)))),
    abs: e => call(l(e), dy => ret(p(op.surroundTrailingQuantifiers || !rm)(`λ${dy}`))),
    ref: ([, i]) => ret(`${i}`),
    ext: e => op.showExistentials ? call(m(e), dy => ret(p(op.surroundTrailingQuantifiers || !rm)(`∃${dy}`))) : jmp(s(pr, rm)(e[3])),
    elm: ([, i, x]) => op.showEliminators ? call(s(0, true)(x), dx => ret(p(op.surroundTrailingQuantifiers || !rm)(`∄${i}.${dx}`))) : jmp(s(pr, rm)(x)),
    ind: e => op.overcomeBarriers ? jmp(s(pr, rm)(e[1][0])) : ret("*"),
    lit: ([, v]) => ret(JSON.stringify(v)) })
return s(0, true)(e) })

const delimit: Delimit = e => homproc((call, ret) => {
type Merge = (x: [Tree, Uses], y: [Tree, Uses]) => [Tree, Tree, Uses]
type Discard = (i: string, x: [Tree, Uses]) => [Tree, Uses]
const merge: Merge = ([dx, dxuses], [dy, dyuses]) => {
  const uses = new Set<string>()
  for (const u of dxuses) {
    uses.add(u)
    if (!dyuses.includes(u)) {
      dy = make("elm", u, dy) } }
  for (const u of dyuses) {
    uses.add(u)
    if (!dxuses.includes(u)) {
      dx = make("elm", u, dx) } }
  return [dx, dy, [...uses]] }

const discard: Discard = (i, [dx, dxuses]) => {
  const uses = [...dxuses]
  const j = uses.indexOf(i)
  if (j === -1) {
    dx = make("elm", i, dx) }
  else {
    uses.splice(j, 1) }
  return [dx, uses] }

const s: GraphProcess = visit({
  app: ([, x, y]) => call(s(x), dx => call(s(y), dy => (([dx, dy, uses]) => ret([make("app", dx, dy), uses]))(merge(dx, dy)))),
  abs: ([, i, o, x]) => call(s(x), dx => (([dx, uses]) => ret([make("abs", i, o, dx), uses]))(discard(i, dx))),
  ref: e => ret([e, [e[1]]]),
  elm: e => call(s(e[2]), dx => ret(discard(e[1], dx))),
  ind: e => jmp(s(e[1][0])),
  lit: e => ret([e, []]) })
return s(e) })

export const alpha_beta: AlphaBeta = e => {
const s: GraphProcess = visit({
  app: ([, x, y]) => call(s(x), s(y)),
  abs: ([, , , x]) => jmp(s(x)),
  ref: () => ret, lit: () => ret,
  ext: x => jmp(s(reduce_one(x))),
  elm: ([, , x]) => jmp(s(x)),
  ind: e => jmp(s(e[1][0])) })
return run(s(e)) }


export const to_digraph: (title: string, e: Graph) => Promise<SVGSVGElement> =
async (title, e) => {
  const walk_bar: (e: Bar) => void = e => {
    let t = nodes_token.get(e)
    if (t !== undefined) return
    t = counter++
    nodes_token.set(e, t)
    walk_graph(e[0])
    out.push(`${t}[shape=diamond,fixedsize=true,width=0.15,height=0.15,label="",tooltip=""]`)
    out.push(`${t}->${nodes_token.get(e[0])}`) }
  const walk_graph: (e: Graph) => void = e => {
    let t = nodes_token.get(e)
    if (t !== undefined) return
    t = counter++
    nodes_token.set(e, t)
    e[0] === 'app' ? (walk_graph(e[1]), walk_graph(e[2])) :
    e[0] === 'abs' ? walk_graph(e[3]) :
    e[0] === 'ext' ? (walk_bar(e[2]), walk_graph(e[3])) :
    e[0] === 'elm' ? walk_graph(e[2]) :
    e[0] === 'ind' ? walk_bar(e[1]) :
    void 0
    out.push(`${t}[${
      e[0] === 'ind' ? 'fixedsize=true,width=0.15,height=0.15,style=filled,' :
      e[0] === 'app' ? 'fixedsize=true,width=0.5,height=0.5,' :
      ''}shape=${
      e[0] === 'ext' ? 'box' :
      e[0] === 'elm' ? 'triangle' :
      e[0] === 'abs' ? 'invtriangle' :
      e[0] === 'app' ? 'circle' :
      'plaintext'
    },label="${
      e[0] === 'ext' ? e[1] :
      e[0] === 'app' ? '' :
      e[0] === 'ind' ? '' :
      e[0] === 'abs' ? e[1] :
      e[0] === 'ref' ? e[1] :
      e[0] === 'elm' ? e[1] :
      e[0] === 'lit' ? JSON.stringify(JSON.stringify(e[1])).slice(1, -1) :
      '{builtin}'
    }",tooltip=""]`);
    e[0] === 'ext' ? out.push(`${t}->${nodes_token.get(e[3])};${nodes_token.get(e[2])}->${t}[style=dotted,penwidth=4]`):
    e[0] === 'app' ? out.push(`${t}->${nodes_token.get(e[1])};${t}->${nodes_token.get(e[2])}[dir=back]`):
    e[0] === 'abs' ? out.push(`${t}->${nodes_token.get(e[3])}`) :
    e[0] === 'ind' ? out.push(`${t}->${nodes_token.get(e[1])}`) :
    e[0] === 'elm' ? out.push(`${t}->${nodes_token.get(e[2])}`) :
    void 0 }
  let counter = 0
  let out: string[] = []
  const nodes_token = new Map<Graph | Bar, number>()
  walk_graph(e)
  const t = counter++
  out.push(`{rank=min;${t}[class="start",shape=diamond,label="",tooltip=""]}`)
  out.push(`${t}->${nodes_token.get(e)}`)
  const src = `digraph ${title}{nodesep=0.3;bgcolor="transparent";node[rankjustify=min];edge[arrowhead=none];${out.join(';')}}`
  const viz = new Viz()
  const img = await viz.renderSVGElement(src)
  img.style.verticalAlign = "top"
  const rect = img.viewBox.baseVal
  const strip_queue: Element[] = [img]
  for (;;) {
    const e = strip_queue.shift()
    if (!e) break
    e.removeAttribute('id')
    e.removeAttribute('fill')
    e.removeAttribute('stroke')
    e.removeAttribute('font-family')
    e.removeAttribute('font-size')
    e.removeAttribute('text-anchor')
    for (let i = 0; i < e.childNodes.length; i++) {
      const remove = () => e.removeChild(c)
      const c = e.childNodes[i] as ChildNode
      if (c.nodeType === 1) {
        if (c.nodeName === 'title') {
          remove() }
        else {
          strip_queue.unshift(c as Element) } }
      else if (c.nodeType === 8) {
        remove() } } }
  img.setAttribute('width', `${rect.width * 0.7}px`)
  img.setAttribute('height', `${rect.height * 0.7}px`)
  return img }

export const reduce_one: Bubble = e => homproc((call, ret) => {
const s: ExtProcess = e => () => call(visit({
  app: y => ret(make("app", make<Ext>("ext", e[1], e[2], y[1]), make<Ext>("ext", e[1], e[2], y[2]))),
  abs: y => y[1] === e[1] ? ret(y) : ret(make("abs", y[1], y[2], make<Ext>("ext", e[1], e[2], y[3]))),
  ref: () => ret(make("ind", e[2])), // no lookup because bookkept
  ext: y => call(s(y), () => ret(e)),
  elm: y => y[1] === e[1] ? ret(y) : ret(make("elm", y[1], make<Graph>("ext", e[1], e[2], y[2]))) })(e[3]), de => ret(assign(e, de)))
return s(e) })

export const evaluate_one: EvaluateOne = e => homproc((call, ret) => {
const fatal: Fatal = m => { throw new Error(m) }
const s: GraphProcess = visit({
  app: e => call(s(e[1]), dx => dx ? (e[1] = dx, ret(e)) : jmp(visit({
    abs: ([, i, o, x]) => o === "lazy" ? ret(make<Graph>("ext", i, make<Bar>(e[2]), x)) : call(s(e[2]), dy => dy ? (e[2] = dy, ret(e)) : ret(make<Graph>("ext", i, make<Bar>(e[2]), x))),
    lit: ([, r]) => fatal(`Cannot apply literal \`${JSON.stringify(r)}\` to \`${pretty(e[2])}\`.`) })(e[1]))),
  ext: e => ret(reduce_one(e)),
  elm: e => ret(e[2]),
  ind: e => call(s(e[1][0]), dx => dx ? (e[1][0] = dx, ret(e)) : ret(e[1][0])),
  ref: ([, i]) => fatal(`Undefined reference to \`${i}\`.`),
  abs: () => ret(null),
  lit: () => ret(null) })
return s(e) })

export const reduce: Bubble = e => homproc((call, ret) => {
const s: ExtProcess = e => () => call(visit({
  app: y => ret(make("app", make<Ext>("ext", e[1], e[2], y[1]), make<Ext>("ext", e[1], e[2], y[2]))),
  abs: y => y[1] === e[1] ? ret(y) : ret(make("abs", y[1], y[2], make<Ext>("ext", e[1], e[2], y[3]))),
  ref: () => ret(make("ind", e[2])), // no lookup because bookkept
  ext: y => call(s(y), () => jmp(s(e))),
  elm: y => y[1] === e[1] ? ret(y) : ret(make("elm", y[1], make<Ext>("ext", e[1], e[2], y[2]))),
  ind: ret, lit: ret })(e[3]), de => ret(assign(e, de)))
return s(e) })


export const evaluate: Evaluate = e => homproc((call, ret) => {
const fatal: Fatal = m => { throw new Error(m) }
const s: GraphProcess = visit({
  app: e => call(s(e[1]), dx => jmp(visit({
    abs: ([, i, o, x]) => o === "lazy" ? jmp(s(make("ext", i, make(e[2]), x))) : call(s(e[2]), dy => jmp(s(make("ext", i, make(dy), x)))),
    lit: ([, r]) => fatal(`Cannot apply literal \`${JSON.stringify(r)}\` to \`${pretty(e[2])}\`.`) })(dx))),
  ext: e => jmp(s(reduce(e))),
  elm: e => jmp(s(e[2])),
  ind: e => call(s(e[1][0]), dx => (e[1][0] = dx, ret(dx))),
  ref: ([, i]) => fatal(`Undefined reference to \`${i}\`.`),
  abs: ret, lit: ret })
return s(e) })
