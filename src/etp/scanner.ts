export type TextPosition = { line: number, col: number }
export type TextRange = { begin: TextPosition, end: TextPosition }

export type TokenT<TokenKind> = {
  w: TextRange,
  text: string
  type: TokenKind }

export const scanner =
  <
    Takers extends { [i in string]: (t: string, ...a: any[]) => [string, string] | null }>(takers: Takers) =>
  (x: string, w: TextPosition):
  { [i in keyof Takers]: (...a: Parameters<Takers[i]> extends [string, ...infer A] ? A : never) => TokenT<NonNullable<ReturnType<Takers[keyof Takers]>>[1]> | null } &
  { pos: () => TextPosition, eof: () => boolean }  => {
const
pos = () => ({ ...w }),
take = <A extends any[]>(f: (t: string, ...a: A) => [string, NonNullable<ReturnType<Takers[keyof Takers]>>[1]] | null) => {
  return (...a: A) => {
    const r = f(x, ...a)
    if (r === null) {
      return null }
    x = x.slice(r[0].length)
    const re = /\n/g
    const wa = { ...w }
    let colo = -w.col
    for (;;) {
      const m = re.exec(r[0])
      if (!m) {
        w.col = r[0].length - colo
        return { w: { begin: wa, end: { ...w } }, text: r[0], type: r[1] } }
      colo = m.index
      w.line++ } } }
const token_types: { [i in keyof Takers]: (...a: Parameters<Takers[i]> extends [string, ...infer A] ? A : never) => TokenT<NonNullable<ReturnType<Takers[keyof Takers]>>[1]> | null } = {} as any
for (const i in takers) {
  token_types[i] = take(takers[i] as Takers[keyof Takers]) }
return {
  pos,
  eof: () => x.length === 0,
  ...token_types } }
