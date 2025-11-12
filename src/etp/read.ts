import { Run, run } from "./run.js"
import { tr, opt, mergev } from "./di.js"
import { TextPosition, TextRange } from "./scanner.js"
import { Token, Tokenizer, Tokens } from "./tokenizer.js"
import {
  Article,
  Messages,
  msg,
  Proposition,
  Proof,
  Message } from "./lang.js"

type ConcreteProposition<T> = {
par: { lpu: Token, b: T, rpu?: Token }
led: { wab: Tokens, b: T }
trl: { l: T, wlr: Tokens }
lam: { l?: Token, wli: Tokens, i?: Token, b: T }
dot: { l?: Token, wli: Tokens, dtu: Token, b: T }
ref: { i: Token }
imp: { l: T, opu: Token, r: T }
app: { l: T, wlr: Tokens, r: T }
err: { w: TextRange } }

type ProofNameTokens = {
l?: Token, i?: Token, r?: Token }

type ProofReferenceTokens = {
l: Token, i?: Token, r?: Token }

type ConcreteProof<T, U> = {
par: { lbu: Token, b: T, rbu?: Token }
led: { wab: Tokens, b: T }
trl: { l: T, wlr: Tokens }
prt: { l: Token, d: U, dtu?: Token, b: T }
lam: { l: Token, wldt: Tokens, dtu?: Token, b: T }
uni: { l?: Token, wli: Tokens, i?: Token, b: T }
dot: { l?: Token, wldt: Tokens, dtu: Token, b: T }
cdp: { l: Token, wli: Tokens, i: ProofNameTokens, wicn: Tokens, cnu?: Token, t?: U, dtu?: Token, b: T }
def: { l: Token, wli: Tokens, i?: Token, wice: Tokens, ceu?: Token, t?: U, d: U, dtu?: Token, b: T }
lem: { l: Token, wli: Tokens, i: ProofNameTokens, wicn: Tokens, cnu?: Token, t?: U, ceu?: Token, d: T, dtu?: Token, b: T}
spe: { l: T, wlr: Tokens, r: U }
mop: { l: T, wlr: Tokens, r: T }
coe: { l: T, opu: Token, r: U }
ref: { i: ProofReferenceTokens }
err: { w: TextRange, b?: U } }

type ConcreteStatement<T, U, V> = {
led: { a: T, wal: Tokens }
def: { a: T, l: Token, wli: Tokens, i?: Token, wice: Tokens, ceu?: Token, d: V, dtu?: Token }
prt: { a: T, l: Token, wld: Tokens, d: V, dtu?: Token }
thm: { a: T, l: Token, wli: Tokens, i: ProofNameTokens, wicn: Tokens, cnu?: Token, t?: V, ceu?: Token, d: U, dtu?: Token } }

type Abstraction<P, T> = { [i in keyof P]: (e: P[i], m: () => Messages) => T }

type PropositionAbstraction<T> = Abstraction<ConcreteProposition<T>, T>
type ProofAbstraction<T, U> = Abstraction<ConcreteProof<T, U>, T>
type ArticleAbstraction<T, U, V> = Abstraction<ConcreteStatement<T, U, V>, T>

const
read_comments = (s: Tokenizer) => {
  const
  { wl, nl, ch, cl, cb } = s,
  r: Tokens = []
  for (;;) {
    if (nl()) {
      continue }
    const wlu = wl()
    if (wlu) {
      continue }
    const chu = ch()
    if (chu) {
      r.push(chu)
      continue }
    const clu = cl()
    if (clu) {
      r.push(clu)
      for (;;) {
        if (nl()) {
          continue }
        const cbu = cb()
        if (cbu && cbu.text.length !== 0) {
          r.push(cbu)
          if (cbu.text.endsWith("*)")) {
            break }
          continue }
        break }
      continue }
    break }

  return r },

read_proposition =
  <T>({ par, led, trl, lam, dot, ref, imp, app, err }: PropositionAbstraction<T>) =>
  run(<P, R>({ proc, branch, call, cc, ret }: Run<T, P, R>) =>
  (s: Tokenizer) => {
  const
  { pos, pp, lm, dt, lp, rp, op } = s,

  lambda = proc((l: Token | null): R => {
    const
      w = pos(),
      wli = read_comments(s),
      dtu = dt('proposition')
    if (dtu) {
      return call(main, b => {
      return ret(dot({
        ...l ? { l } : {},
        wli, dtu, b }, () => [])) }) }
    const i = pp()
    return call(i ? lambda(null) : main, b => {
    return ret(lam({ ...l ? { l } : {}, wli, ...i ? { i } : {}, b }, () => [
      ...i ? [] : [
        msg(w, `Syntax Error`, `A proposition name or \`.\` is expected here.`)]])) }) }),

  parens = proc((lpu: Token) => {
    return call(main, b => {
    const
      wrp = pos(),
      rpu = rp()
    return ret(par({ lpu, b, ...rpu ? { rpu } : {}}, () => [
      ...rpu ? [] : [
        msg({ begin: lpu.w.begin, end: wrp }, `Syntax Error`, `\`(\` here is not matched.`)]])) }) }),

  reference = proc((i: Token) =>
    ret(ref({ i }, () => []))),

  primary = () =>
    tr(lm('proposition'), lambda) ||
    tr(lp(), parens) ||
    tr(pp(), reference),

  rhs = proc((l: T): R => {
    const wlr = read_comments(s)
    const u = primary()
    if (!u) {
      return ret(trl({ l, wlr }, () => [])) }
    return call(u, r =>
    cc(rhs(app({ l, wlr, r }, () => [])))) }),

  lhs = branch(() => {
    const
      wa = pos(),
      wab = read_comments(s)
    return call(branch(() => {
      const
        w = { begin: wa, end: pos() },
        u = primary()
      if (!u) {
        return cc(rhs(err({ w }, () => [
          msg(w, `Syntax Error`, "A proposition is expected here.")]))) }
      return call(u, x => {
      return cc(rhs(x)) }) }), b => {
    return ret(led({ wab, b }, () => [])) }) }),

  arrow = branch(() => {
    return call(lhs, l => {
    const o = op()
    if (!o) {
      return ret(l) }
    return call(main, r => {
    return ret(imp({ l, opu: o, r }, () => [])) }) }) }),

  main = arrow

  return main }),

read_proof_name_rest = (l: Token, s: Tokenizer): [ProofReferenceTokens, () => Messages] => {
  const
  { pf, ra, pos } = s,
  wi = pos(),
  i = pf(),
  wra = pos(),
  r = ra('proof')
  return [{ l, ...i ? { i } : {}, ...r ? { r } : {} }, () => [
    ...i ?
      r ? [] : [
        msg(wra, `Syntax Error`, `\`>\` is expected here.`)] : [
      msg(wi, `Syntax Error`, `A proof name is expected here.`)]]] },

read_proof_name = (s: Tokenizer): [ProofNameTokens, () => Messages] => {
  const
    { la, pf, ra, pos } = s,
    wla = pos(),
    l = la('proof'),
    wi = pos(),
    i = pf(),
    wra = pos(),
    r = ra('proof')
  return [{ ...l ? { l } : {}, ...i ? { i } : {}, ...r ? { r } : {} }, () => [
    ...l ?
      i ?
        r ? [] : [
          msg(wra, `Syntax Error`, `\`>\` is expected here.`)] : [
        msg(wi, `Syntax Error`, `A proof name is expected here.`)] : [
      msg(wla, `Syntax Error`, `\`<\` is expected here.`)]]] },

read_proof =
  <T, U>({ par, led, trl, lam, uni, dot, cdp, def, lem, prt, spe, mop, coe, ref, err }: ProofAbstraction<T, U>,
  proposition_semantic: PropositionAbstraction<U>) =>
  run(<P, R>({ proc, branch, call, cc, ret }: Run<T, P, R>) =>
  (s: Tokenizer) => {
  const
  { pos, pp, dt, lp, rp, lb, rb, la, cn, ce, ui, cp, ll, le, lm, pt } = s,
  { ref: prop_ref, par: prop_par } = proposition_semantic,

  read_proposition_sem = read_proposition(proposition_semantic),

  universal = proc((l: Token | null): ReturnType<typeof ret> => {
  const
    w = pos(),
    wli = read_comments(s),
    dtu = dt('proof')
  if (dtu) {
    return call(lead, b => {
    return ret(dot({ ...l ? { l } : {}, wldt: wli, dtu, b }, () => [])) }) }
  const i = pp()
  return call(i ? universal(null) : lead, b => {
  return ret(uni({ ...l ? { l } : {}, wli, ...i ? { i } : {}, b }, () => [
    ...i ? [] : [
      msg(w, `Syntax Error`, `A proposition name or \`.\` is expected here.`)]])) }) }),

  premise = proc((l: Token) => {
  const
  wli = read_comments(s),
  [i, im] = read_proof_name(s),
  wicn = read_comments(s),
  cnu = cn('proof'),
  t = cnu && read_proposition_sem(s),
  wdt = pos(),
  dtu = dt('proof')
  return call(lead, b => {
  return ret(cdp({ l, wli, i, wicn, ...cnu ? { cnu } : {}, ...t ? { t } : {}, ...dtu ? { dtu } : {}, b }, () => [
    ...im(),
    ...dtu ? [] : [
      msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]])) }) }),

  definition = proc((l: Token) => {
  const
    wli = read_comments(s),
    wi = pos(),
    i = pp(),
    wce = pos(),
    wice = read_comments(s),
    ceu = ce('proof'),
    d = read_proposition_sem(s),
    wdt = pos(),
    dtu = dt('proof')
  return call(lead, b => {
  return ret(def({ l, wli, ...i ? { i } : i, wice, ...ceu ? { ceu } : {}, ...dtu ? { dtu } : {}, d, b }, () => [
    ...i ? [] : [
      msg(wi, `Syntax Error`, `A proposition name is expected here.`)],
    ...ceu ? [] : [
      msg(wce, `Syntax Error`, `\`:=\` is expected here.`)],
    ...dtu ? [] : [
      msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]])) }) }),

  lemma = proc((l: Token) => {
  const
    wli = read_comments(s),
    [i, im] = read_proof_name(s),
    wicn = read_comments(s),
    wcn = pos(),
    ceup = ce('proof'),
    cnu = !ceup && cn('proof'),
    t = cnu && read_proposition_sem(s),
    ceu = ceup || ce('proof')
  return call(lead, d => {
  const
    wdt = pos(),
    dtu = dt('proof')
  return call(lead, b => {
  return ret(lem({ l, wli, i, wicn, ...cnu ? { cnu } : {}, ...t ? { t } : {}, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {}, b }, () => [
    ...im(),
    ...ceu ? [] : [
      msg(wcn, `Syntax Error`, `\`:\` or \`:=\` is expected here.`)],
    ...dtu ? [] : [
      msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]])) }) }) }),

  print = proc((l: Token) => {
  const
    d = read_proposition_sem(s),
    wdt = pos(),
    dtu = dt('proof')
  return call(lead, b => {
  return ret(prt({ l, d, ...dtu ? { dtu } : {}, b }, () => [
    ...dtu ? [] : [
      msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]])) }) }),

  brackets = proc((lbu: Token) => {
  return call(main, b => {
  const
    wrp = pos(),
    rbu = rb('proof')
  return ret(par({ lbu, b, ...rbu ? { rbu } : {} }, () => [
    ...rbu ? [] : [
      msg({ begin: lbu.w.begin, end: wrp }, `Syntax Error`, `\`[\` here is not matched.`)]])) }) }),

  lambda = proc((l: Token) => {
  const
    wdt = pos(),
    wldt = read_comments(s),
    dtu = dt('proof')
  return call(lead, b => {
  return ret(lam({ l, wldt, ...dtu ? { dtu } : {}, b }, () => [
    ...dtu ? [] : [
      msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]])) }) }),

  reference = proc((l: Token) => {
  const [i, im] = read_proof_name_rest(l, s)
  return ret(ref({ i }, im)) }),

  primary = () =>
  tr(ui(), universal) ||
  tr(cp(), premise) ||
  tr(ll(), definition) ||
  tr(le(), lemma) ||
  tr(pt('proof'), print) ||
  tr(lb('proof'), brackets) ||
  tr(lm('proof'), lambda) ||
  tr(la('proof'), reference),

  prop = (): U | null => {
  const i = pp()
  if (i) {
    return prop_ref({ i }, () => []) }
  const lpu = lp()
  if (lpu) {
    const
      b = read_proposition_sem(s),
      wrp = pos(),
      rpu = rp()
    return prop_par({ lpu, b, ...rpu ? { rpu } : {} }, () => [
      ...rpu ? [] : [
        msg({ begin: lpu.w.begin, end: wrp }, `Syntax Error`, `\`(\` here is not matched.`)]]) }
  return null },

  rhs = proc((l: T): ReturnType<typeof ret> => {
  const
    wlr = read_comments(s),
    r = prop()
  if (r) {
    return cc(rhs(spe({ l, wlr, r }, () => []))) }
  const u = primary()
  if (!u) {
    return ret(trl({ l, wlr }, () => [])) }
  return call(u, r => {
  return cc(rhs(mop({ l, wlr, r }, () => []))) }) }),

  lhs = proc((wa: TextPosition) => {
  const
    w = { begin: wa, end: pos() },
    b = prop()
  if (b) {
    return cc(rhs(err({ w, b }, () => [
      msg({ begin: wa, end: pos() }, "Syntax Error", `A proposition is not allowed here.`)]))) }
  const u = primary()
  if (!u) {
    return ret(err({ w }, () => [])) }
  return call(u, l => {
  return cc(rhs(l)) }) }),

  lead = branch(() => {
  const
    wa = pos(),
    wab = read_comments(s)
  return call(lhs(wa), b => {
  return ret(led({ wab, b }, () => [])) }) }),

  coercion = branch(() => {
  return call(lead, l => {
  const opu = cn('proof')
  if (!opu) {
    return ret(l) }
  const r = read_proposition_sem(s)
  return ret(coe({ l, opu, r }, () => [])) }) }),

  main = coercion

  return main }),

read_article =
  <T, U, V>(ap: () => T, { led, def, prt, thm }: ArticleAbstraction<T, U, V>,
  proof_semantic: ProofAbstraction<U, V>,
  proposition_semantic: PropositionAbstraction<V>) =>
  (s: Tokenizer): T => {
  let a = ap()
  const
  { sfl, pos, eof, pp, dt, cn, ce, df, pt, th, dv, nl } = s,
  read_proof_sem = read_proof(proof_semantic, proposition_semantic),
  read_proposition_sem = read_proposition(proposition_semantic),

  define = (l: Token) => {
  const
    wli = read_comments(s),
    i = pp(),
    wice = read_comments(s),
    ceu = ce('top'),
    d = read_proposition_sem(s),
    dtu = dt('top')
  return def({ a, l, wli, ...i ? { i } : {}, wice, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {} }, () => [
    ...i ?
      ceu ? [] : [
        msg(i.w.end, `Syntax Error`, `\`:=\` is expected here.`)] : [
      msg(l.w.end, `Syntax Error`, `A proposition name is expected here.`)],
    ...dtu ? [] : [
      msg(pos(), `Syntax Error`, `\`.\` is expected here.`)]]) },

  print = (l: Token) => {
  const
    wld = read_comments(s),
    d = read_proposition_sem(s),
    dtu = dt('top')
  return prt({ a, l, wld, d, ...dtu ? { dtu } : {} }, () => [
    ...dtu ? [] : [
      msg(pos(), `Syntax Error`, `\`.\` is expected here.`)]]) },

  theorem = (l: Token) => {
  const
    wli = read_comments(s),
    [i, im] = read_proof_name(s),
    wicn = read_comments(s),
    wcn = pos(),
    cnu = cn('top'),
    t = cnu && read_proposition_sem(s),
    wce = pos(),
    ceu = ce('top'),
    d = read_proof_sem(s),
    wdt = pos(),
    dtu = dt('top')
  return thm({ a, l, wli, i, wicn, ...cnu ? { cnu } : {}, ...t ? { t } : {}, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {} }, () => [
      ...im(),
      ...cnu ?
        ceu ?
          dtu ? [] : [
            msg(wdt, `Syntax Error`, `\`.\` is expected here.`)] : [
          msg(wce, `Syntax Error`, `\`:=\` is expected here.`)] : [
        msg(wcn, `Syntax Error`, "\`:\` is expected here.")]]) }

  sfl()
  for (;;) {
    const wal = read_comments(s)
    a = led({ a, wal }, () => [])
    const w = pos()
    if (eof()) {
      return a }
    let l =
      tr(df(), define) ||
      tr(pt('top'), print) ||
      tr(th(), theorem)
    if (l) {
      a = l }
    else {
      const wal: Tokens = []
      for (;;) {
        const dvu = nl() || dv()
        if (!dvu || dvu.text.length === 0) {
          break }
        wal.push(dvu) }
      if (wal.length !== 0) {
        a = led({ a, wal }, () => [
          msg(w, `Syntax Error`, `\`define\`, \`print\`, or \`theorem\` is expected here.`) ]) }
      if(eof()) {
        return a } } } },

fspan = (a: { w: TextRange }, b: { w: TextRange }) => ({ begin: a.w.begin, end: b.w.end }),
mergem = mergev((a: Message, b: Message) => {
  const ab = 'begin' in a.w ? a.w.begin : a.w
  const bb = 'begin' in b.w ? b.w.begin : b.w
  return ab.line < bb.line || (ab.line <= bb.line && ab.col < bb.col) }),

condense_proof_name = (i: string) =>
  i.split(/\s+/).filter(ip => ip.length !== 0).join(' '),

proof_name_tokens = (i: ProofNameTokens) =>
  [...opt(i.l), ...opt(i.i), ...opt(i.r)]

export const read_article_abstract = read_article<
  [Article, Messages], [Proof, Messages], [Proposition, Messages]>(
  () => [[], []], {

  led: ({ a: [a, am], }, m) => [a, mergem(am, m())],
  def: ({ a: [a, am], l, i, d: [d, dm] }, m) => [[...a, { k: 'def', w: fspan(l, d), i: i ? i.text : '', d }], mergem(am, m(), dm)],
  prt: ({ a: [a, am], l, d: [d, dm] }, m) => [[...a, { k: 'prt', w: fspan(l, d), d }], mergem(am, m(), dm)],
  thm: ({ a: [a, am], l, i, t, d: [d, dm] }, m) => [[...a, { k: 'thm', w: fspan(l, d), i: i.i ? condense_proof_name(i.i.text) : '', t: t ? t[0] : { k: 'err', w: l.w }, d }], mergem(am, m(), ...t ? [t[1]] : [], dm)] }, {

  par: ({ lbu: lpu, b: [b, bm], rbu: rpu }, m) => [{ ...b, w: { begin: lpu.w.begin, end: (rpu || b).w.end} }, mergem(m(), bm)],
  led: ({ b: [b, bm] }, m) => [b, mergem(m(), bm)],
  trl: ({ l: [b, bm] }, m) => [b, mergem(m(), bm)],
  prt: ({ l, d: [d, dm], b: [b, bm] }, m) => [{ k: 'prt', w: fspan(l, b), d, b }, mergem(m(), dm, bm)],
  lam: ({ b: [b, bm] }, m) => [b, mergem(m(), bm)],
  uni: ({ l, i, b: [b, bm] }, m) => [!i ? b : ({ k: 'uni', w: fspan(l || i, b), i: i.text, b }), mergem(m(), bm)],
  dot: ({ b: [b, bm] }, m) => [b, mergem(m(), bm)],
  cdp: ({ l, i, t, b: [b, bm] }, m) => [{ k: 'cdp', w: fspan(l || i, b), i: i.i ? condense_proof_name(i.i.text) : '', ...t ? { t: t[0] } : {}, b }, mergem(m(), ...t ? [t[1]] : [], bm)],
  def: ({ l, i, d: [d, dm], b: [b, bm] }, m) => [{ k: 'def', w: fspan(l, b), i: i ? i.text : '', d, b, }, mergem(m(), dm, bm)],
  lem: ({ l, i, t, d: [d, dm], b: [b, bm] }, m) => [{ k: 'lem', w: fspan(l, b), i: i.i ? condense_proof_name(i.i.text) : '', ...t ? { t: t[0] } : {}, d, b }, mergem(m(), ...t ? [t[1]] : [], dm, bm)],
  spe: ({ l: [l, lm], r: [r, rm] }, m) => [{ k: 'spe', w: fspan(l, r), l, r }, mergem(m(), lm, rm)],
  mop: ({ l: [l, lm], r: [r, rm] }, m) => [{ k: 'mop', w: fspan(l, r), l, r }, mergem(m(), lm, rm)],
  coe: ({ l: [l, lm], r: [r, rm] }, m) => [{ k: 'coe', w: fspan(l, r), l, r }, mergem(m(), lm, rm)],
  ref: ({ i }, m) => [{ k: 'ref', w: fspan(i.l, i.r || i.i || i.l), i: i.i ? condense_proof_name(i.i.text) : '' }, m()],
  err: ({ w }, m) => [{ k: 'err', w }, m()] }, {

  par: ({ lpu, b: [b, bm], rpu }, m) => [{ ...b, w: { begin: lpu.w.begin, end: (rpu || b).w.end} }, mergem(m(), bm)],
  led: ({ b: [b, bm] }, m) => [b, mergem(m(), bm)],
  trl: ({ l: [b, bm] }, m) => [b, mergem(m(), bm)],
  lam: ({ l, i, b: [b, bm] }, m) => [i ? { k: 'lam', w: fspan(l || i, b), i: i.text, b } : b, mergem(m(), bm)],
  dot: ({ b: [b, bm] }, m) => [b, mergem(m(), bm)],
  ref: ({ i }, m) => [{ k: 'ref', w: i.w, i: i.text }, m()],
  imp: ({ l: [l, lm], r: [r, rm] }, m) => [{ k: 'imp', w: fspan(l, r), l, r }, mergem(m(), lm, rm)],
  app: ({ l: [l, lm], r: [r, rm] }, m) => [{ k: 'app', w: fspan(l, r), l, r }, mergem(m(), lm, rm)],
  err: ({ w }, m) => [{ k: 'err', w }, m()] })

export const read_article_tokens = read_article<
  Token[], Token[], Token[]>(
  () => [], {

  led: ({ a, wal }) => [...a, ...wal],
  def: ({ a, l, wli, i, wice, ceu, d, dtu }) => [...a, l, ...wli, ...opt(i), ...wice, ...opt(ceu), ...d, ...opt(dtu)],
  prt: ({ a, l, wld, d, dtu }) => [...a, l, ...wld, ...d, ...opt(dtu)],
  thm: ({ a, l, wli, i, wicn, cnu, t, ceu, d, dtu }) => [...a, l, ...wli, ...proof_name_tokens(i), ...wicn, ...opt(cnu), ...t || [], ... opt(ceu), ...d, ...opt(dtu) ] }, {

  par: ({ lbu: lpu, b, rbu: rpu }) => [lpu, ...b, ...opt(rpu)],
  led: ({ wab, b }) => [...wab, ...b],
  trl: ({ l, wlr }) => [...l, ...wlr],
  prt: ({ l, d, dtu, b }) => [l, ...d, ...opt(dtu), ...b],
  lam: ({ l, wldt, dtu, b }) => [l, ...wldt, ...opt(dtu), ...b],
  uni: ({ l, wli, i, b }) => [...opt(l), ...wli, ...opt(i), ...b],
  dot: ({ l, wldt, dtu, b }) => [...opt(l), ...wldt, dtu, ...b],
  cdp: ({ l, wli, i, cnu, t, dtu, b }) => [l, ...wli, ...proof_name_tokens(i), ...opt(cnu), ...t || [], ...opt(dtu), ...b],
  def: ({ l, wli, i, ceu, d, dtu, b }) => [l, ...wli, ...opt(i), ...opt(ceu), ...d, ...opt(dtu), ...b],
  lem: ({ l, wli, i, cnu, t, ceu, d, dtu, b }) => [l, ...wli, ...proof_name_tokens(i), ...opt(cnu), ...t || [], ...opt(ceu), ...d, ...opt(dtu), ...b],
  spe: ({ l, wlr, r }) => [...l, ...wlr, ...r],
  mop: ({ l, wlr, r }) => [...l, ...wlr, ...r],
  coe: ({ l, opu, r }) => [...l, ...opt(opu), ...r],
  ref: ({ i }) => proof_name_tokens(i),
  err: ({ b }) => b || [] }, {

  par: ({ lpu, b, rpu }) => [lpu, ...b, ...opt(rpu)],
  led: ({ wab, b }) => [...wab, ...b],
  trl: ({ l, wlr }) => [...l, ...wlr],
  lam: ({ l, wli, i, b }) => ([...opt(l), ...wli, ...opt(i), ...b]),
  dot: ({ l, wli, dtu, b }) => [...opt(l), ...wli, dtu, ...b],
  ref: ({ i }) => [i],
  imp: ({ l, opu, r }) => [...l, opu, ...r],
  app: ({ l, wlr, r }) => [...l, ...wlr, ...r],
  err: ({ }) => [] })
