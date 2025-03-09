import { Pos, Scanner } from "../scanner.js"

export type NonEOFTokenKind =
  "lparen" | "rparen" | "lbrace" | "rbrace" | "dot" | "dots" | "dotbracket" | "lbracket" | "rbracket" | "rsolidus" | "comma" | "equal" |
  "arrow" | "hash" | "colon" | "dollar" | "where" | "let" | "in" | "identifier" | "literal"
export type Token =
  [NonEOFTokenKind, string] |
  ["eof"]

export type TokenKind = Token[0]
type TokenSorts = { [K in TokenKind]: [K, string] }

export type Tokenizer = {
  unget(s: string) : void
  pos(): Pos
  unpos(p: Pos): void
  take<K extends TokenKind>(k: K): TokenSorts[K] | undefined }

export function tokenizer(s: Scanner): Tokenizer {
  let t!: Token

  function fatal(msg: string): never {
    throw new Error(`(${s.pos()[0]}:${s.pos()[1]}:${s.pos()[2]}): tokenizer: ${msg}`) }

  function k(t: RegExp) {
    const matches = s.get().match(t);
    if (matches === null) {
      return null; }
    return matches[0]; }

  function pos(): Pos {
    return s.pos() }

  function take<K extends TokenKind>(k: K): TokenSorts[K] | undefined {
    if (t[0] === k) {
      const r = t as TokenSorts[K]
      skip()
      return r }
    return undefined }

  function ws(): void {
    const ws = k(/^(\s|\/\/([^\n\\]|\\.)*?(\n|$)|\/\*([^\*\\]|\\.|\*[^\/])*?(\*\/|$))*/)
    if (ws) {
      s.skip(ws.length) }  }

  function skip(): void {
    if (t[0] === "eof") {
      return }
    s.skip(t[1].length)
    ws()
    classify() }

  function classify(): void {
    if (s.get().length === 0) { t = ["eof"]; return }
    if (k(/^\(/)) { t = ["lparen", "("]; return }
    if (k(/^\)/)) { t = ["rparen", ")"]; return }
    if (k(/^{/)) { t = ["lbrace", "{"]; return }
    if (k(/^}/)) { t = ["rbrace", "}"]; return }
    if (k(/^\[/)) { t = ["lbracket", "["]; return }
    if (k(/^\]/)) { t = ["rbracket", "]"]; return }
    if (k(/^:/)) { t = ["colon", ":"]; return }
    if (k(/^\.\[/)) { t = ["dotbracket", ".["]; return }
    if (k(/^\.\.\./)) { t = ["dots", "..."]; return }
    if (k(/^\./)) { t = ["dot", "."]; return }
    if (k(/^\\/)) { t = ["rsolidus", "\\"]; return }
    if (k(/^=/)) { t = ["equal", "="]; return }
    if (k(/^,/)) { t = ["comma", ","]; return }
    if (k(/^->/)) { t = ["arrow", "->"]; return }
    if (k(/^#/)) { t = ["hash", "#"]; return }
    if (k(/^\$/)) { t = ["dollar", "$"]; return }
    let r = k(/^("([^"\\]|\\.)*($|")|[+-]?(?:\d+(?:\.\d+)?)(?:[eE][+-]?\d+)?|false|true|null|undefined)/)
    if (r) { t = ["literal", r]; return }
    r = k(/^[A-Za-z_][A-Za-z0-9_]*/)
    if (r === "where") { t = ["where", "where"]; return }
    if (r === "let") { t = ["let", "let"]; return }
    if (r === "in") { t = ["in", "in"]; return }
    if (r) { t = ["identifier", r]; return }
    fatal(`Unrecognized character sequence.`) }

  function unget(text: string): void {
    s.unget(text)
    ws()
    classify() }

  function unpos(p: Pos): void {
    s.unpos(p) }

  ws()
  classify()
  return { unget, pos, take, unpos } }
