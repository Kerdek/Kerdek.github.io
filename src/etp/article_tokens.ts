import { opt } from '../common/util/di.js'
import { walk_concrete_article } from './concrete.js'
import { Token } from './tokenizer.js'

export const article_tokens = walk_concrete_article<
  Token[], Token[], Token[]>({
proposition: {
  par: ({ b }, { lpu, rpu }) => [lpu, ...b, ...opt(rpu)],
  led: ({ b }, { wab }) => [...wab, ...b],
  trl: ({ l }, { wlr }) => [...l, ...wlr],
  uni: ({ b }, { l, wli, i }) => ([...opt(l), ...wli, ...opt(i), ...b]),
  lam: ({ b }, { l, wli, i }) => ([...opt(l), ...wli, ...opt(i), ...b]),
  dot: ({ b }, { l, wli, dtu }) => [...opt(l), ...wli, dtu, ...b],
  ref: ({ }, { i }) => [i],
  imp: ({ l, r }, { aru }) => [...l, aru, ...r],
  app: ({ l, r }, { wlr }) => [...l, ...wlr, ...r],
  err: ({ }) => [] },
proof: {
  par: ({ b }, { lbu, rbu }) => [lbu, ...b, ...opt(rbu)],
  led: ({ b }, { wab }) => [...wab, ...b],
  trl: ({ l }, { wlr }) => [...l, ...wlr],
  prt: ({ d, b }, { l, dtu }) => [l, ...d, ...opt(dtu), ...b],
  lam: ({ b }, { l, wldt, dtu }) => [l, ...wldt, ...opt(dtu), ...b],
  uni: ({ b }, { l, wli, i }) => [...opt(l), ...wli, ...opt(i), ...b],
  dot: ({ b }, { l, wldt, dtu }) => [...opt(l), ...wldt, dtu, ...b],
  cdp: ({ b }, { l, wli, i }) => [...opt(l), ...wli, ...opt(i), ...b],
  cdt: ({ t, b }, { l, wllb, lbu, wlbi, i, wicn, cnu, rbu }) => [...opt(l), ...wllb, ...opt(lbu), ...wlbi, ...opt(i), ...wicn, ...opt(cnu), ...t, ...opt(rbu), ...b],
  def: ({ d, b }, { l, wli, i, ceu, dtu }) => [l, ...wli, ...opt(i), ...opt(ceu), ...d, ...opt(dtu), ...b],
  lem: ({ d, b }, { l, wli, i, ceu, dtu }) => [l, ...wli, ...opt(i), ...opt(ceu), ...d, ...opt(dtu), ...b],
  let: ({ t, d, b }, { l, wli, i, cnu, ceu, dtu }) => [l, ...wli, ...opt(i), cnu, ...t, ...opt(ceu), ...d, ...opt(dtu), ...b],
  spe: ({ l, r }, { wlr }) => [...l, ...wlr, ...r],
  mop: ({ l, r }, { wlr }) => [...l, ...wlr, ...r],
  ref: ({ }, { i }) => [i],
  err: ({ b }) => b || [] },
statement: {
  trl: ({ a }, { wal }) => [...wal, ...a || []],
  imp: ({ a }, { wal, l, wli, i, widt, dtu }) => [...wal, l, ...wli, ...opt(i), ...widt, ...opt(dtu), ...a || []],
  exf: ({ a }, { wal, l, wli, i, widt, dtu }) => [...wal, l, ...wli, ...opt(i), ...widt, ...opt(dtu), ...a || []],
  def: ({ a, d }, { wal, l, wli, i, wice, ceu, dtu }) => [...wal, l, ...wli, ...opt(i), ...wice, ...opt(ceu), ...d, ...opt(dtu), ...a || []],
  prt: ({ a, d }, { wal, l, wld, dtu }) => [...wal, l, ...wld, ...d, ...opt(dtu), ...a || []],
  thm: ({ a, t, d }, { wal, l, wli, i, wicn, cnu, ceu, dtu }) => [...wal, l, ...wli, ...opt(i), ...wicn, ...opt(cnu), ...t || [], ... opt(ceu), ...d, ...opt(dtu), ...a || []] } })
