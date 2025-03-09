// /*

// tinychurch.ts
// Theodoric Stier
// All rights reserved 2024

// This module exports a number of functions
// relating to the untyped lambda calculus of Alonzo Church.

// A variation on continuation passing style is used
// to avoid recursion so that these functions can
// handle very difficult inputs.

// Challenge yourself to fully understand how this works.

// `make` constructs nodes.

// `visit` constructs visitor functions from
// handler tables.

// `assign` changes the contents of a node.

// `read` accepts a string containing a lambda term
// and returns the ast

// `print` converts an ast to a string
// using parentheses everywhere.

// `pretty` is a sophisticated printing algorithm which
// can minimize parentheses by considering the
// precedence and rightmostness of the context.

// `substitute` searches a term for occurrences of
// references to a given identifier and replaces
// those with a given term.

// `beta_evaluate` uses `substitute` to reduce
// a term to a normal form in lazy or applicative order.

// `bubble` pushes existentials down one layer
// at a time.

// `fizz` removes all existentials from a term
// by calling `bubble`.

// `alpha_evaluate` uses `bubble` to do the
// same thing as `beta_evaluate`, but it
// can handle arbitrarily large programs without
// slowdown because it only acts locally on
// the graph.

// */

// import { Branch, homproc, jmp, Process, call, run } from './run.js'

// type App = ["app", Graph, Graph]
// type Abs = ["abs", string, Graph]
// type Ref = ["ref", string]
// type Ext = ["ext", string, Bar, Graph]
// type Elm = ["elm", string, Graph]
// type Bar = ["bar", string, Graph]

// export type Normal = Abs
// export type Binary = App
// export type Tree = Normal | Binary | Ref | Elm | Bar
// export type Graph = Tree | Ext
// export type Kind = Graph[0]

// export type PrettyOptions = {
//   overcomeBarriers?: boolean,
//   showExistentials?: boolean,
//   showEliminators?: boolean,
//   surroundTrailingQuantifiers?: boolean }

// export type Read = (src: string) => Tree
// export type Print = (e: Graph) => string
// export type Pretty = (e: Graph, o?: PrettyOptions) => string
// export type Delimit = (e: Graph) => [Graph, Uses]
// export type Bubble = (e: Ext) => Tree
// export type Fizz = (e: Graph) => void
// export type Evaluate = (e: Graph) => Normal

// type Sorts = { [i in Kind]: [i, ...Rest<i, Graph>] }
// type Rest<i, Term> = Term extends [i, ...infer R] ? R : never
// type Make = <K extends Graph>(...x: K) => K
// type Assign = <K extends Graph>(e: Graph, x: K) => K
// type Visit = <K extends Kind>(o: { [i in K]: (e: Sorts[i]) => Branch }) => <I extends K>(e: Sorts[I]) => () => Branch
// type Format = (x: string) => string
// type Parens = (q: boolean) => Format
// type Uses = string[]
// type Merge = (x: [Graph, Uses], y: [Graph, Uses]) => [Graph, Graph, Uses]
// type Discard = (i: string, x: [Graph, Uses]) => [Graph, Uses]
// type GraphProcess = (e: Graph) => Process
// type TreeBranch = (e: Tree) => Branch
// type AbsProcess = (e: Abs) => Process
// type ExtProcess = (e: Ext) => Process
// type Precedence = -1e1000 | 0 | 1
// type PrintProcess = (precedence: Precedence, rightmost: boolean) => GraphProcess

// export const assign: Assign = (e, x) => {
//   let i = 0
//   for (; i < x.length; i++) {
//     e[i] = x[i] as any }
//   for (; i < e.length; i++) {
//     delete e[i] }
//   return e as any }

// export const make: Make = (...x) => x
// export const visit: Visit = o => e => (f => () => f(e))(o[e[0]])

// export const read: Read = x => (homproc((call, ret) => {
// type Take = (re: RegExp) => Token
// type Token = () => string | null
// type TextPosition = [number, number]
// type Fatal = (msg: string) => never
// const
//   k: Take = t => () => {
//     const r = x.match(t)
//     if (!r) {
//       return null }
//     for (let re = /\n/g, colo = 0;;) {
//       const m = re.exec(r[0])
//       if (!m) {
//         w[1] += r[0].length - colo
//         x = x.slice(r[0].length)
//         return r[0] }
//       colo = m.index + w[1]
//       w[0]++ } },
//   ws = k(/^(\s|\/\/([^\n\\]|\\[\s\S])*?(\n|$)|\/\*([^\*\\]|\\[\s\S])*?(\*\/|$))*/),
//   id = k(/^\w[\w0-9]*/),
//   lm = k(/^(\\|∀|λ)/), dt = k(/^\./),
//   lp = k(/^\(/), rp = k(/^\)/),
//   fatal: Fatal = m => { throw new Error(`${w}: ${m}`) },
//   parameter_list: Process = () => (ws(), dt() ? jmp(expression) : (i => i ? call(parameter_list, x => ret(make("abs", i, x))) : fatal("Expected `.` or an identifier."))(id())),
//   primary: () => Process | null = () => (ws(),
//     lm() ? () => jmp(parameter_list) :
//     lp() ? () => ((l, c) => call(expression, x => rp() ? ret(x) : fatal(`Expected \`)\` to match \`(\` at (${l}, ${c}).`)))(w[0], w[1]) :
//     (r => r ? () => ret(make("ref", r)) : null)(id())),
//   application_lhs: TreeBranch = x => (up => up ? call(up, y => application_lhs(make("app", x, y))) : ret(x))(primary()),
//   application: Process = () => (up => up ? call(up, x => application_lhs(x)) : fatal("Expected a term."))(primary()),
//   expression = application
// let w: TextPosition = [1, 1]
// return () => call(expression, e => x.length !== 0 ? fatal(`Expected end of file.`) : ret(e)) }))

// export const print: Print = e => homproc((call, ret) => {
// const s: GraphProcess = visit({
//   app: ([, x, y]) => call(s(x), dx => call(s(y), dy => ret(`(${dx} ${dy})`))),
//   abs: ([, i, x]) => call(s(x), dx => ret(`(λ${i}.${dx})`)),
//   ref: ([, r]) => ret(r),
//   ext: ([, , , y]) => jmp(s(y)),
//   elm: ([, i, ]) => ret(i),
//   bar: ([, i, ]) => ret(i) })
// return s(e) })

// export const pretty: Pretty = (e, o) => homproc((call, ret) => {
// const
//   op = o || {},
//   p: Parens = q => q ? t => `(${t})` : t => t,
//   l: AbsProcess = ([, i, x]) => () => x[0] === "abs" ? call(l(x), dx => ret(`${i} ${dx}`)) : call(s(-1e1000, true)(x), dx => ret(`${i}.${dx}`)),
//   m: ExtProcess = ([, i, , y]) => () => y[0] === "ext" ? call(m(y), dy => ret(`${i} ${dy}`)) : call(s(-1e1000, true)(y), dy => ret(`${i}.${dy}`)),
//   s: PrintProcess = (pr, rm) => visit({
//     app: ([, x, y]) => call(s(0, false)(x), dx => call(s(1, rm || pr > 0)(y), dy => ret(p(pr > 0)(`${dx} ${dy}`)))),
//     abs: e => call(l(e), dy => ret(p(op.surroundTrailingQuantifiers || !rm)(`λ${dy}`))),
//     ref: ([, i]) => ret(`${i}`),
//     ext: e => op.showExistentials ? call(m(e), dy => ret(p(op.surroundTrailingQuantifiers || !rm)(`∃${dy}`))) : jmp(s(pr, rm)(e[3])),
//     elm: ([, i, x]) => op.showEliminators ? call(s(-1e1000, true)(x), dx => ret(p(op.surroundTrailingQuantifiers || !rm)(`∄${i}.${dx}`))) : jmp(s(pr, rm)(x)),
//     bar: ([, i, x]) => op.overcomeBarriers ? jmp(s(pr, rm)(x)) : ret(i) })
// return s(-1e1000, true)(e) })

// export const delimit: Delimit = e => homproc((call, ret) => {
// const merge: Merge = ([dx, dxuses], [dy, dyuses]) => {
//   const uses = new Set<string>()
//   for (const u of dxuses) {
//     uses.add(u)
//     if (!dyuses.includes(u)) {
//       dy = make("elm", u, dy) } }
//   for (const u of dyuses) {
//     uses.add(u)
//     if (!dxuses.includes(u)) {
//       dx = make("elm", u, dx) } }
//   return [dx, dy, [...uses]] }
// const discard: Discard = (i, [dx, dxuses]) => {
//   const uses = [...dxuses]
//   const j = uses.indexOf(i)
//   if (j === -1) {
//     dx = make("elm", i, dx) }
//   else {
//     uses.splice(j, 1) }
//   return [dx, uses] }
// const s: GraphProcess = visit({
//   app: ([, x, y]) => call(s(x), dx => call(s(y), dy => (([dx, dy, uses]) => ret([make("app", dx, dy), uses]))(merge(dx, dy)))),
//   abs: ([, i, x]) => call(s(x), dx => (([dx, uses]) => ret([make("abs", i, dx), uses]))(discard(i, dx))),
//   ref: e => ret([e, [e[1]]]),
//   ext: ([, i, x, y]) => call(s(y), ([dy, dyu]) => ret([make("ext", i, x, dy), dyu])),
//   elm: ([, i, x]) => call(s(x), dx => ret(discard(i, dx))),
//   bar: e => ret([e, []]) })
// return s(e) })

// export const bubble: Bubble = e => homproc((call, ret) => {
// const s: ExtProcess = e => () => call(visit({
//   ext: x => call(s(x), () => jmp(s(e))),
//   app: ([, x, y]) => ret(make("app", make("ext", e[1], e[2], x), make("ext", e[1], e[2], y))),
//   abs: y => y[1] === e[1] ? ret(y) : ret(make("abs", y[1], make("ext", e[1], e[2], y[2]))),
//   ref: y => y[1] === e[1] ? ret(e[2]) : ret(y),
//   elm: y => y[1] === e[1] ? ret(y) : jmp(s(make("ext", e[1], e[2], y[2]))),
//   bar: ret })(e[3]), de => ret(assign(e, de)))
// return s(e) })

// export const fizz: Fizz = e => {
// const s: GraphProcess = visit({
//   ext: x => jmp(s(bubble(x))),
//   app: ([, x, y]) => call(s(x), s(y)),
//   abs: ([, , x]) => jmp(s(x)),
//   elm: ([, , x]) => jmp(s(x)),
//   bar: ([, , x]) => jmp(s(x)),
//   ref: () => [] })
// return run(s(e)) }

// export const evaluate: Evaluate = e => homproc((call, ret) => {
// type Fatal = (m: string) => never
// const fatal: Fatal = m => { throw new Error(m) }
// const s: GraphProcess = visit({
//   ext: e => jmp(s(bubble(e))),
//   app: e => call(s(e[1]), dx => jmp(visit({
//     abs: ([, i, x]) => jmp(s(make("ext", i, make("bar", i, e[2]), x))) })(dx))),
//   elm: ([, , x]) => jmp(s(x)),
//   bar: e => call(s(e[2]), dx => (e[2] = dx, ret(dx))),
//   ref: ([, x]) => fatal(`Undefined reference \`${x}\`.`),
//   abs: ret })
// return s(e) })
