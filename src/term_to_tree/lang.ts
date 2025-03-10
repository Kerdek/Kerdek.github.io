type App = ["app", Term, Term]
type Abs = ["abs", string, Term]
type Ref = ["ref", string]

export type Term = Abs | App | Ref
export type Kind = Term[0]

export type Fatal = (m: string) => never
export type Print = (e: Term) => string

type Sorts = { [i in Kind]: [i, ...Rest<i, Term>] }
type Rest<i, Term> = Term extends [i, ...infer R] ? R : never
type Make = <K extends Term>(...x: K) => K
type Visit = <K extends Kind, R>(o: { [i in K]: (e: Sorts[i]) => R }) => <I extends K>(e: Sorts[I]) => R

export const make: Make = (...x) => x
export const visit: Visit = o => e => o[e[0]](e)

export const read: (x: string) => Term = x => {
type Take = (re: RegExp) => () => string | null
type TextPosition = [string, number, number]
type Fatal = (msg: string) => never
let w: TextPosition = ["<user input>", 1, 1]
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
  ws = k(/^\s*/),
  id = k(/^[^\s\\λ\.\(\)]+/),
  lm = k(/^[\\λ]/), dt = k(/^\./),
  lp = k(/^\(/), rp = k(/^\)/),
  fatal: Fatal = m => { throw new Error(`(${w}): ${m}`) },
  parameters: () => Term = () => (ws(), dt() ? expression() : (i => i ? make("abs", i, parameters()) : fatal("Expected `.` or an identifier."))((ws(), id()))),
  primary: () => Term | null = () => (ws(),
    lm() ? parameters() :
    lp() ? (wp => (x => rp() ? x : fatal(`Expected \`)\` to match \`(\` at (${wp}).`))(expression()))([...w]) :
    (r => r ? make("ref", r) : null)(id())),
  juxt_rhs: (x: Term) => Term = x => (u => u ? juxt_rhs(make("app", x, u)) : x)(primary()),
  juxt: () => Term = () => (u => u ? juxt_rhs(u) : fatal("Expected a term."))(primary()),
  expression = juxt
return (e => x.length !== 0 ? fatal(`Expected end of file.`) : e)(expression()) }

export const print: Print = visit({
  abs: ([, i, x]) => `(λ${i}.${print(x)})`,
  app: ([, x, y]) => `(${print(x)} ${print(y)})`,
  ref: ([, r]) => r })

const include: (src: string) => Promise<Event> =
src => new Promise(cb => {
  const js = document.createElement('script')
  js.src = src
  js.type = 'text/javascript'
  js.addEventListener('load', cb)
  document.head.appendChild(js) })

await include("../viz.js")
await include("../lite.render.js")

export const to_digraph: (title: string, e: Term) => Promise<SVGSVGElement> =
async (t, e) => {
  const walk_term: (e: Term) => void = e => {
    let t = token.get(e)
    if (t !== undefined) return
    t = counter++
    token.set(e, t)
    e[0] === 'abs' ? walk_term(e[2]) :
    e[0] === 'app' ? (walk_term(e[1]), walk_term(e[2])) :
    0
    out.push(`${t}[${
      e[0] === 'app' ?
        'fixedsize=true,width=0.5,height=0.5,' : '' }shape=${
      e[0] === 'abs' ? 'invtriangle' :
      e[0] === 'app' ? 'circle' :
      'plaintext'
    },label="${
      e[0] === 'app' ? ' ' : e[1]
    }",tooltip=""]`);
    e[0] === 'app' ? out.push(`${t}->${token.get(e[1])};${t}->${token.get(e[2])}[dir=back]`):
    e[0] === 'abs' ? out.push(`${t}->${token.get(e[2])}`) :
    0 }
  let counter = 0
  let out: string[] = []
  const token = new Map<Term, number>()
  walk_term(e)
  out.push(`{rank=min;start[class="start",shape=diamond,label="",tooltip=""]}`)
  out.push(`start->${token.get(e)}`)
  const src = `digraph ${t}{nodesep=0.3;bgcolor="transparent";node[rankjustify=min];edge[arrowhead=none];${out.join(';')}}`
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
