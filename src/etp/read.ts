import { Run, run } from '../common/util/run3.js'
import { tr } from '../common/util/di.js'
import { TextPosition, TextRange } from './scanner.js'
import { Token, Tokenizer, Tokens } from './tokenizer.js'
import {
  Messages,
  msg } from './context.js'
import { ConcreteProof, ConcreteProposition, ConcreteStatement} from './concrete.js'

export const

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
          if (cbu.text.endsWith('*)')) {
            break }
          continue }
        break }
      continue }
    break }

  return r },

read_proposition =
  run(<P, R>({ proc, branch, call, cc, ret }: Run<ConcreteProposition, P, R>) =>
  (s: Tokenizer) => {
  const
  { pos, pp, al, lm, dt, lp, rp, op } = s,

  universal = proc((l: Token | null): R => {
    const
      w = pos(),
      wli = read_comments(s),
      dtu = dt('type_symbol')
    if (dtu) {
      return call(main, b => {
      return ret({ k: 'dot', m: [],
        ...l ? { l } : {},
        wli, dtu, b }) }) }
    const i = pp()
    return call(i ? universal(null) : main, b => {
    return ret({ k: 'uni', m: [
        ...i ? [] : [
          msg(w, `Syntax Error`, `A proposition name or \`.\` is expected here.`)]],
      ...l ? { l } : {}, wli, ...i ? { i } : {}, b }) }) }),

  lambda = proc((l: Token | null): R => {
    const
      w = pos(),
      wli = read_comments(s),
      dtu = dt('type_symbol')
    if (dtu) {
      return call(main, b => {
      return ret({ k: 'dot', m: [],
        ...l ? { l } : {},
        wli, dtu, b }) }) }
    const i = pp()
    return call(i ? lambda(null) : main, b => {
    return ret({ k: 'lam', m: [
        ...i ? [] : [
          msg(w, `Syntax Error`, `A proposition name or \`.\` is expected here.`)]],
      ...l ? { l } : {}, wli, ...i ? { i } : {}, b }) }) }),

  parens = proc((lpu: Token) => {
    return call(main, b => {
    const
      wrp = pos(),
      rpu = rp()
    return ret({ k: 'par', m: [
        ...rpu ? [] : [
          msg({ begin: lpu.w.begin, end: wrp }, `Syntax Error`, `\`(\` here is not matched.`)]],
      lpu, b, ...rpu ? { rpu } : {} }) }) }),

  reference = proc((i: Token) =>
    ret({ k: 'ref', m: [], i })),

  primary = () =>
    tr(al('type_symbol'), universal) ||
    tr(lm('type_symbol'), lambda) ||
    tr(lp(), parens) ||
    tr(pp(), reference),

  rhs = proc((l: ConcreteProposition): R => {
    const wlr = read_comments(s)
    const u = primary()
    if (!u) {
      return ret({ k: 'trl', m: [], l, wlr }) }
    return call(u, r =>
    cc(rhs({ k: 'app', m: [], l, wlr, r }))) }),

  lhs = branch(() => {
    const
      wa = pos(),
      wab = read_comments(s)
    return call(branch(() => {
      const
        w = { begin: wa, end: pos() },
        u = primary()
      if (!u) {
        return cc(rhs({ k: 'err', m: [
            msg(w, `Syntax Error`, 'A proposition is expected here.')],
          w })) }
      return call(u, x => {
      return cc(rhs(x)) }) }), b => {
    return ret({ k: 'led', m: [], wab, b }) }) }),

  arrow = branch(() => {
    return call(lhs, l => {
    const o = op()
    if (!o) {
      return ret(l) }
    return call(main, r => {
    return ret({ k: 'imp', m: [], l, aru: o, r }) }) }) }),

  main = arrow

  return main }),

read_proof =
  run(<P, R>({ proc, branch, call, cc, ret }: Run<ConcreteProof, P, R>) =>
  (s: Tokenizer) => {
  const
  { pos, pp, pf, dt, lp, rp, lb, rb, cn, ce, ui, cp, ll, le, pt } = s,

  universal = proc((l: Token | null): ReturnType<typeof ret> => {
  const
    w = pos(),
    wli = read_comments(s),
    dtu = dt('term_symbol')
  if (dtu) {
    return call(lead, b => {
    return ret({ k: 'dot', m: [], ...l ? { l } : {}, wldt: wli, dtu, b }) }) }
  const i = pp()
  return call(i ? universal(null) : lead, b => {
  return ret({ k: 'uni', m: [
      ...i ? [] : [
        msg(w, `Syntax Error`, `A proposition name or \`.\` is expected here.`)]],
    ...l ? { l } : {}, wli, ...i ? { i } : {}, b }) }) }),

  premise = proc((l: Token | null): R => {
  const
    wi = pos(),
    wldt = read_comments(s),
    dtu = dt('term_symbol')
  if (dtu) {
    return call(main, b => {
    return ret({ k: 'dot', m: [],
      ...l ? { l } : {},
      wldt, dtu, b }) }) }
  const
    wli = wldt,
    i = pf()
  if (i) {
    return call(premise(null), b => {
    return ret({ k: 'cdp', m: [], ...l ? { l } : {}, wli, i, b }) }) }
  const
    wllb = wli,
    lbu = lb('term_symbol'),
    wj = pos(),
    wlbi = read_comments(s),
    j = pf(),
    wcn = pos(),
    wicn = read_comments(s),
    cnu = cn('term_symbol'),
    t = read_proposition(s),
    wrb = pos(),
    rbu = rb('term_symbol')
  const
    m = [
      ...lbu ? [
        ...j ? [
          ...cnu ? [
            ...rbu ? [] : [
              msg(wrb, `Syntax Error`, `\`)\` is expected here.`)]] : [
            msg(wcn, `Syntax Error`, `\`:\` is expected here.`)]] : [
          msg(wj, `Syntax Error`, `An identifier is expected here.`)]] : [
        msg(wi, `Syntax Error`, `An identifier or \`(\` is expected here.`)]]
  return call(lbu ? premise(null) : main, b => {
  return ret({ k: 'cdt', m, ...l ? { l } : {}, wllb, ...lbu ? { lbu } : {}, wlbi, ...j ? { i: j } : {}, wicn, ...cnu ? { cnu } : {}, t, ...rbu ? { rbu } : {}, b }) }) }),

  definition = proc((l: Token) => {
  const
    wli = read_comments(s),
    wi = pos(),
    i = pp(),
    wce = pos(),
    wice = read_comments(s),
    ceu = ce('term_symbol'),
    d = read_proposition(s),
    wdt = pos(),
    dtu = dt('term_symbol')
  return call(lead, b => {
  return ret({ k: 'def', m: [
      ...i ? [] : [
        msg(wi, `Syntax Error`, `A proposition name is expected here.`)],
      ...ceu ? [] : [
        msg(wce, `Syntax Error`, `\`:=\` is expected here.`)],
      ...dtu ? [] : [
        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]],
    l, wli, ...i ? { i } : i, wice, ...ceu ? { ceu } : {}, ...dtu ? { dtu } : {}, d, b }) }) }),

  lemma = proc((l: Token) => {
  const
    wi = pos(),
    wli = read_comments(s),
    i = pf(),
    wicn = read_comments(s),
    wcn = pos(),
    ceup = ce('term_symbol'),
    cnu = !ceup && cn('term_symbol'),
    t = cnu && read_proposition(s),
    ceu = ceup || ce('term_symbol')
  return call(lead, d => {
  const
    wdt = pos(),
    dtu = dt('term_symbol')
  return call(lead, b => {
  const
    m = [
      ...i ? [] : [
        msg(wi, `Syntax Error`, `An identifier is expected here.`)],
      ...ceu ? [] : [
        msg(wcn, `Syntax Error`, `\`:\` or \`:=\` is expected here.`)],
      ...dtu ? [] : [
        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]]
  return ret(t ?
    { k: 'let', m, l, wli, ...i ? { i } : {}, wicn, cnu, t, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {}, b } :
  { k: 'lem', m, l, wli, ...i ? { i } : {}, wicn, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {}, b }) }) }) }),

  print = proc((l: Token) => {
  const
    d = read_proposition(s),
    wdt = pos(),
    dtu = dt('term_symbol')
  return call(lead, b => {
  return ret({ k: 'prt', m: [
      ...dtu ? [] : [
        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]],
    l, d, ...dtu ? { dtu } : {}, b }) }) }),

  brackets = proc((lbu: Token) => {
  return call(main, b => {
  const
    wrp = pos(),
    rbu = rb('term_symbol')
  return ret({ k: 'par', m: [
      ...rbu ? [] : [
        msg({ begin: lbu.w.begin, end: wrp }, `Syntax Error`, `\`[\` here is not matched.`)]],
    lbu, b, ...rbu ? { rbu } : {} }) }) }),

  reference = proc((i: Token) =>
    ret({ k: 'ref', m: [], i })),

  primary = () =>
  tr(ui(), universal) ||
  tr(cp(), premise) ||
  tr(ll(), definition) ||
  tr(le(), lemma) ||
  tr(pt('term_symbol'), print) ||
  tr(lb('term_symbol'), brackets) ||
  tr(pf(), reference),

  prop = (): ConcreteProposition | null => {
  const lpu = lp()
  if (lpu) {
    const
      b = read_proposition(s),
      wrp = pos(),
      rpu = rp()
    return { k: 'par', m: [
        ...rpu ? [] : [
          msg({ begin: lpu.w.begin, end: wrp }, `Syntax Error`, `\`(\` here is not matched.`)]],
      lpu, b, ...rpu ? { rpu } : {} } }
  return null },

  rhs = proc((l: ConcreteProof): ReturnType<typeof ret> => {
  const
    wlr = read_comments(s),
    r = prop()
  if (r) {
    return cc(rhs({ k: 'spe', m: [], l, wlr, r })) }
  const u = primary()
  if (!u) {
    return ret({ k: 'trl', m: [], l, wlr }) }
  return call(u, r => {
  return cc(rhs({ k: 'mop', m: [], l, wlr, r })) }) }),

  lhs = proc((begin: TextPosition) => {
  const
    b = prop(),
    end = pos(),
    w: TextRange = { begin, end }
  if (b) {
    return cc(rhs({ k: 'err', m: [
      msg(w, 'Syntax Error', `A proposition is not allowed here.`)], w, b })) }
  const u = primary()
  if (!u) {
    return ret({ k: 'err', m: [
      msg(w, 'Syntax Error', `A proof is expected here.`)], w, b: { k: 'err', m: [], w } }) }
  return call(u, l => {
  return cc(rhs(l)) }) }),

  lead = branch(() => {
  const
    wa = pos(),
    wab = read_comments(s)
  return call(lhs(wa), b => {
  return ret({ k: 'led', m: [], wab, b }) }) }),

  main = lead

  return main }),

read_article =
  run(<P, R>({ proc, branch, call, cc, ret }: Run<ConcreteStatement, P, R>) =>
  (s: Tokenizer) => {
  const
  { pos, pp, pf, dt, cn, ce, ip, ep, df, pt, th, nl, dv, li } = s,

  impor = (l: Token) => proc((wal: Tokens, m: Messages) => {
  const
    wi = pos(),
    wli = read_comments(s),
    i = li(),
    wdt = pos(),
    widt = read_comments(s),
    dtu = dt('document_symbol')
  return call(main, a =>
  ret({ a, k: 'imp', m: [...m,
      ...i ? [] : [
        msg(wi, `Syntax Error`, `A file name is expected here.`)],
      ...dtu ? [] : [
        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]],
    wal, l, wli, ...i ? { i } : {}, widt, ...dtu ? { dtu } : {} })) }),

  expor = (l: Token) => proc((wal: Tokens, m: Messages) => {
  const
    wi = pos(),
    wli = read_comments(s),
    i = pf(),
    wdt = pos(),
    widt = read_comments(s),
    dtu = dt('document_symbol')
  return call(main, a =>
  ret({ a, k: 'exf', m: [...m,
      ...i ? [] : [
        msg(wi, `Syntax Error`, `An identifier is expected here.`)],
      ...dtu ? [] : [
        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]],
    wal, l, wli, i, widt, ...dtu ? { dtu } : {} })) }),

  define = (l: Token) => proc((wal: Tokens, m: Messages) => {
  const
    wli = read_comments(s),
    i = pp(),
    wice = read_comments(s),
    ceu = ce('document_symbol'),
    d = read_proposition(s),
    wdt = pos(),
    dtu = dt('document_symbol')
  return call(main, a =>
  ret({ a, k: 'def', m: [...m,
      ...i ?
        ceu ? [] : [
          msg(i.w.end, `Syntax Error`, `\`:=\` is expected here.`)] : [
        msg(l.w.end, `Syntax Error`, `A proposition name is expected here.`)],
      ...dtu ? [] : [
        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]],
    wal, l, wli, ...i ? { i } : {}, wice, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {} })) }),

  print = (l: Token) => proc((wal: Tokens, m: Messages) => {
  const
    wld = read_comments(s),
    d = read_proposition(s),
    wdt = pos(),
    dtu = dt('document_symbol')
  return call(main, a =>
  ret({ a, k: 'prt', m: [...m,
      ...dtu ? [] : [
        msg(wdt, `Syntax Error`, `\`.\` is expected here.`)]],
    wal, l, wld, d, ...dtu ? { dtu } : {} })) }),

  theorem = (l: Token) => proc((wal: Tokens, m: Messages) => {
  const
    wi = pos(),
    wli = read_comments(s),
    i = pf(),
    wicn = read_comments(s),
    wcn = pos(),
    cnu = cn('document_symbol'),
    t = read_proposition(s),
    wce = pos(),
    ceu = ce('document_symbol'),
    d = read_proof(s),
    wdt = pos(),
    dtu = dt('document_symbol')
  return call(main, a =>
  ret({ a, k: 'thm', m: [...m,
      ...i ? [] : [
        msg(wi, `Syntax Error`, `An identifier is expected here.`)],
      ...cnu ?
        ceu ?
          dtu ? [] : [
            msg(wdt, `Syntax Error`, `\`.\` is expected here.`)] : [
          msg(wce, `Syntax Error`, `\`:=\` is expected here.`)] : [
        msg(wcn, `Syntax Error`, '\`:\` is expected here.')]],
    wal, l, wli, i, wicn, ...cnu ? { cnu } : {}, t, ...ceu ? { ceu } : {}, d, ...dtu ? { dtu } : {} })) }),

main = branch(() => {
  const
    wal: Tokens = read_comments(s),
    w: TextPosition = pos(),
    dvu: Token | null = dv(),
    m: Messages = []
  if (dvu && dvu.text.length != 0) {
    m.push(msg(w, `Syntax Error`, `A directive is expected here.`))
    wal.push(dvu)
    for (;;) {
      if (nl()) {
        continue }
      const dvu = dv()
      if (dvu && dvu.text.length != 0) {
        wal.push(dvu)
        continue }
      break } }
  let l =
    tr(ip(), impor) ||
    tr(ep(), expor) ||
    tr(df(), define) ||
    tr(pt('document_symbol'), print) ||
    tr(th(), theorem)
  if (!l) {
    return ret({ a: null, k: 'trl', m, wal }) }
  return cc(l(wal, m)) })
return main })