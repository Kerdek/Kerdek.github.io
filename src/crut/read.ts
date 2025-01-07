import { Module, Ptr, RecordSyntax, Term, term_abs, term_acs, term_app, term_lit, term_mod, term_aka, term_ref, TypeTree, typ_any, typ_ref, typ_lit, typ_bol, typ_cnj, typ_dsj, typ_abs, typ_iov, typ_num, typ_rec, typ_str, typ_unk, TypeMap, rec, term_res, term_cst, typ_aka } from "./graph.js"
import { async_homproc, AsyncBranch, AsyncProcess, jmp } from "./run.js"
// import { assign } from "./assign.js"
import { di } from "./di.js"
import { Tokenizer, TokenKind } from "./tokenizer.js"
import { Pos } from "./scanner.js"
import { assign } from "./assign.js"

export type Read = (src: Tokenizer) => Promise<Term>
export type ReadT = (src: Tokenizer, h: TypeMap) => Promise<TypeTree>
type Fatal = (msg: string) => never
type TypeMapAsyncProcess = (m: TypeMap) => AsyncProcess
type RecordSyntaxAsyncProcess = (h: TypeMap, e: RecordSyntax) => AsyncProcess
type AsyncTermAsyncBranch = (h: TypeMap) => (e: Term) => Promise<AsyncBranch>
type PunctuatorAsyncProcess = (h: TypeMap, k: TokenKind) => AsyncProcess
type AsyncTypAsyncBranch = (t: TypeTree) => Promise<AsyncBranch>
type ModuleAsyncProcess = (h: TypeMap, t: TypeMap, e: Module) => AsyncProcess

type ReadProcess = (h: TypeMap) => AsyncProcess

export const read_type: ReadT = (tk, h) => async_homproc((call, ret) => {
const
fatal: Fatal = m => {
  const w = tk.pos()
  throw new Error(`(${w[0]}:${w[1]}:${w[2]}): type parser: ${m}`) },
rct_defs: TypeMapAsyncProcess = o => async() =>
  tk.take("dots") ?
    call(type, async e =>
    e.kind !== rec ? fatal(`Expected a record type.`) :
    await di(() => ({ ...o, ...e.elements } as TypeMap), async r =>
    tk.take("rbrace") ? ret(typ_rec(r())) :
    tk.take("comma") ? jmp(rct_defs(r())) :
    fatal(`Expected \`,\` or \`}\`.`))) :
  await di(tk.take("identifier"), async i =>
  !i ? fatal(`Expected \`...\`, or an identifier.`) :
  !tk.take("colon") ? fatal(`Expected \`:\`.`) :
  call(type, async y =>
  await di(() => ({ ...o, [i[1]]: y }) as TypeMap, async r =>
  tk.take("rbrace") ? ret(typ_rec(r())) :
  tk.take("comma") ? jmp(rct_defs(r())) :
  fatal(`Expected \`,\` or \`}\`.`)))),
// vars: (v: string[]) => AsyncProcess = v => async () =>
//   tk.take("dot") ?
//     call(or, async dx =>
//     !tk.take("arrow") ? fatal(`Expected \`->\`.`) :
//     call(arrow, async dy =>
//     ret(typ_abs(v, dx, dy)))) :
//   await di(tk.take("identifier"), async i =>
//   !i ? fatal(`Expected an identifier or \`.\`.`) :
//   jmp(vars([...v, i[1]]))),
primary: AsyncProcess = async () =>
  // tk.take("rsolidus") ? jmp(vars([])):
  tk.take("lbrace") ?
    tk.take("rbrace") ? ret(typ_rec({})) :
    jmp(rct_defs({})) :
  tk.take("lparen") ?
    call(type, async x =>
    tk.take("rparen") ? ret(x) :
    fatal(`Expected \`)\`.`)) :
  await di(tk.take("literal"), async c =>
    c ? ret(typ_lit(c[1] === "undefined" ? undefined : JSON.parse(c[1]))) :
  await di(tk.take("identifier"), async c =>
  c ?
    c[1] === "IO" ?
      call(primary, async x =>
      ret(typ_iov(x))) :
    c[1] === "true" ? ret(typ_lit(true)) :
    c[1] === "false" ? ret(typ_lit(false)) :
    c[1] === "Number" ? ret(typ_num()) :
    c[1] === "String" ? ret(typ_str()) :
    c[1] === "Boolean" ? ret(typ_bol()) :
    c[1] === "Unknown" ? ret(typ_unk()) :
    c[1] === "Any" ? ret(typ_any()) :
    await di(h[c[1]], async l =>
    ret(l || typ_ref(c[1]))) :
  fatal("Expected a type."))),
and_lhs: AsyncTypAsyncBranch = async x => tk.take("amp") ? call(primary, y => and_lhs(typ_cnj(x, y))) : ret(x),
and: AsyncProcess = async () => call(primary, and_lhs),
or_lhs: AsyncTypAsyncBranch = async x => tk.take("bar") ? call(and, y => or_lhs(typ_dsj(x, y))) : ret(x),
or: AsyncProcess = async () => call(and, or_lhs),
arrow: AsyncProcess = async () =>
  call(or, async x =>
  tk.take("arrow") ?
    call(arrow, async y =>
    ret(typ_abs([], x, y))) :
  ret(x)),
type = arrow
return type })

const includes: { [i: string]: Ptr } = {}

export const read_term: Read = tk => async_homproc((call, ret) => {
const
fatal: Fatal = m => {
  const w = tk.pos()
  throw new Error(`(${w[0]}:${w[1]}:${w[2]}): term parser: ${m}`) },
include: ReadProcess = h => async () => {
  let ru = tk.take("literal")
  if (ru === undefined || typeof ru[1] !== "string") {
    fatal("Expected a string.") }
  const wp: Pos = tk.pos()
  const url = new URL(wp[0])
  const dirname = url.href.substring(0, url.href.lastIndexOf('/'))
  const r = new URL(dirname + "/" + JSON.parse(ru[1])).href
  const m = includes[r]
  if (m) {
    return ret(term_aka(m, `#"${r}"`)) }
    let res = await fetch(`${r}`);
  if (!res.ok) {
    fatal(`HTTP status ${res.status} while requesting \`./${res.url}\`.`) }
  tk.unget(`${await res.text()})`)
  tk.unpos([r, 1, 1])
  return call(expression(h), async e => {
    tk.take("rparen")
    tk.unpos(wp)
    const m: Ptr = [e]
    includes[r] = m
    return ret(term_aka(m, `#"${r}"`)) }) },
let_defs: ModuleAsyncProcess = (h, t, m) => async () =>
  await di(tk.take("identifier"), async i =>
  !i ? fatal(`Expected an identifier.`) :
  tk.take("doublecolon") ?
    await di(await read_type(tk, h), async te =>
    tk.take("in") ?
      call(dollar(h), async x =>
      ret(term_mod(m, x))) :
    tk.take("comma") ?
      di(te, dt =>
      typeof dt === "string" ? (() => {throw new Error()})() :
      jmp(let_defs(h, { ...t, [i[1]]: dt }, m))) :
    fatal(`Expected \`,\` or \`in\`.`)) :
  call(parameters(h, "equal"), async y =>
  await di([...m, [i[1], y, t[i[1]] || null, tk.pos()]] as Module, async mp =>
  tk.take("in") ?
    call(dollar(h), async x =>
    ret(term_mod(mp, x))) :
  tk.take("comma") ? jmp(let_defs(h, t, mp)) :
  fatal(`Expected \`,\` or \`in\`.`)))),
rec_defs: RecordSyntaxAsyncProcess = (h, o) => async() =>
  tk.take("dots") ?
    call(expression(h), async e =>
    await di(() => [...o, [true, e]] as RecordSyntax, async r =>
    tk.take("rbrace") ? ret(term_res(r())) :
    tk.take("comma") ? jmp(rec_defs(h, r())) :
    fatal(`Expected \`,\` or \`}\`.`))) :
  await di(tk.pos(), async w =>
  await di(tk.take("identifier"), async i =>
  !i ? fatal(`Expected \`...\`, or an identifier.`) :
  await di(() => [...o, [false, i[1], term_ref(w, i[1])]] as RecordSyntax, async r =>
  tk.take("rbrace") ? ret(term_res(r())) :
  tk.take("comma") ? jmp(rec_defs(h, r())) :
  call(parameters(h, "colon"), async y =>
  await di(() => [...o, [false, i[1], y]] as RecordSyntax, async r =>
  tk.take("rbrace") ? ret(term_res(r())) :
  tk.take("comma") ? jmp(rec_defs(h, r())) :
  fatal(`Expected \`,\` or \`}\`.`)))))),
parameters: PunctuatorAsyncProcess = (h, k) => async () =>
  tk.take(k) ? jmp(expression(h)) :
  await di(tk.pos(), async w =>
  await di(tk.take("identifier"), async i =>
  !i ? fatal(`Expected an identifier or token kind \`${k}\`.`) :
  call(parameters(h, k), async dx =>
  ret(term_abs(w, i[1], dx))))),
try_primary: (h: TypeMap) => Promise<AsyncProcess | null> = async h =>
  await di(tk.pos(), async w =>
  tk.take("hash") ? include(h) :
  tk.take("lbrace") ?
    async () =>
      tk.take("rbrace") ? ret(term_res([])) :
      jmp(rec_defs(h, [])) :
  tk.take("rsolidus") ?
    parameters(h, "dot") :
  tk.take("lparen") ?
    async () =>
      call(expression(h), async x =>
      tk.take("rparen") ? ret(x) :
      fatal(`Expected \`)\`.`)) :
  tk.take("let") ?
    async () =>
      tk.take("in") ? jmp(dollar(h)) :
      jmp(let_defs(h, {}, [])) :
  tk.take("type") ?
    async () =>
      await di(tk.take("identifier"), async i =>
      !i ? fatal(`Expected an identifier.`) :
      !tk.take("equal") ? fatal(`Expected \`=\`.`) :
      await di(typ_unk(), async tp =>
      await di({ ...h, [i[1]]: typ_aka(i[1], tp) }, async g =>
      await di(await read_type(tk, g), async t =>
      !tk.take("in") ? fatal(`Expected \`in\`.`) :
      (assign(tp, t),
      jmp(dollar(g))))))) :
  await di(tk.take("literal"), async c => c ?
    async () =>
      ret(term_lit(c[1] === "undefined" ? undefined : JSON.parse(c[1]))) :
  await di(tk.take("identifier"), async r => r ?
    async () =>
      ret(term_ref(w, r[1])) :
  null))),
access_rhs: AsyncTermAsyncBranch = h => async x =>
  await di(tk.pos(), async w =>
  tk.take("dot") ?
    tk.take("lbracket") ?
      call(expression(h), async i =>
      !tk.take("rbracket") ? fatal(`Expected \`]\`.`) :
      access_rhs(h)(term_acs(w, x, i))) :
    await di(tk.take("identifier"), async i =>
    i ? access_rhs(h)(term_acs(w, x, term_lit(i[1]))) :
    await di(tk.take("literal"), async i =>
    i ? access_rhs(h)(term_acs(w, x, term_lit(JSON.parse(i[1])))) :
    fatal("Expected a subscript."))) :
  ret(x)),
try_access: (h: TypeMap) => Promise<AsyncProcess | null> = async h =>
  await di(await try_primary(h), async up =>
  up === null ? null :
  async () => call(up, access_rhs(h))),
access: ReadProcess = h => async () =>
  await di(await try_access(h), async up =>
  up === null ? fatal("Expected a term.") :
  jmp(up)),
juxt_rhs: AsyncTermAsyncBranch = h => async x =>
  await di(await try_access(h), async up =>
  await di(tk.pos(), async w =>
  up === null ? ret(x) :
  call(up, async y =>
  juxt_rhs(h)(term_app(w, x, y))))),
juxt: ReadProcess = h => async () => call(access(h), juxt_rhs(h)),
as_rhs: AsyncTermAsyncBranch = h => async x =>
  await di(tk.pos(), async w =>
  tk.take("as") ?
    await di(await read_type(tk, h), async t =>
    as_rhs(h)(term_cst(w, t, x))) :
  ret(x)),
as: ReadProcess = h => async () => call(juxt(h), as_rhs(h)),
dollar: ReadProcess = h => async () =>
  call(as(h), async x =>
  await di(tk.pos(), async w =>
  tk.take("dollar") ?
    call(dollar(h), async y =>
    ret(term_app(w, x, y))) :
  ret(x))),
expression = dollar,
all: ReadProcess = h => async () =>
  call(expression(h), async e =>
  !tk.take("eof") ? fatal(`Expected end of file.`) :
  ret(e))
return all({}) })

