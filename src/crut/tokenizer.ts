import { Pos, Scanner } from "./scanner.js"

export type NonEOFTokenKind =
  "lparen" | "rparen" | "rsolidus" | "colon" | "doublecolon" | "dot" | "comma" |
  "equal" | "arrow" | "dollar" | "identifier" | "literal" | "let" |
  "in" | "where" | "bar" | "amp" | "type" | "dots" | "lbracket" | "rbracket" |
  "hash" | "lbrace" | "rbrace" | "as"

export type Token =
  [NonEOFTokenKind, string] |
  ["eof"]

export type TokenKind = Token[0]
type TokenSorts = { [K in TokenKind]: [K, string] }

export type Tokenizer = {
  unget(s: string) : void
  unpos(p: Pos): void
  get(): string
  pos(): Pos
  take<K extends TokenKind>(k: K): TokenSorts[K] | undefined }

export function tokenizer(s: Scanner): Tokenizer {
  let t!: Token

  function fatal(msg: string): never {
    const w = s.pos()
    throw new Error(`(${w[0]}:${w[1]}:${w[2]}): tokenizer: ${msg}`) }

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
    if (k(/^\\/)) { t = ["rsolidus", "\\"]; return }
    if (k(/^=/)) { t = ["equal", "="]; return }
    if (k(/^,/)) { t = ["comma", ","]; return }
    if (k(/^::/)) { t = ["doublecolon", "::"]; return }
    if (k(/^:/)) { t = ["colon", ":"]; return }
    if (k(/^\|/)) { t = ["bar", "|"]; return }
    if (k(/^&/)) { t = ["amp", "&"]; return }
    if (k(/^\[/)) { t = ["lbracket", "["]; return }
    if (k(/^\]/)) { t = ["rbracket", "]"]; return }
    if (k(/^{/)) { t = ["lbrace", "{"]; return }
    if (k(/^}/)) { t = ["rbrace", "}"]; return }
    if (k(/^\.\.\./)) { t = ["dots", "..."]; return }
    if (k(/^\./)) { t = ["dot", "."]; return }
    if (k(/^->/)) { t = ["arrow", "->"]; return }
    if (k(/^#/)) { t = ["hash", "#"]; return }
    if (k(/^\$/)) { t = ["dollar", "$"]; return }
    let r = k(/^("([^"\\]|\\.)*($|")|[+-]?(?:\d+(?:\.\d+)?)(?:[eE][+-]?\d+)?)/)
    if (r) { t = ["literal", r]; return }
    r = k(/^[A-Za-z_][A-Za-z0-9_]*/)
    if (r === "let") { t = ["let", "let"]; return }
    if (r === "in") { t = ["in", "in"]; return }
    if (r === "as") { t = ["as", "as"]; return }
    if (r === "where") { t = ["where", "where"]; return }
    if (r === "type") { t = ["type", "type"]; return }
    if (r === "true" || r === "false" || r === "undefined") { t = ["literal", r]; return }
    if (r) { t = ["identifier", r]; return }
    fatal(`Unrecognized character sequence.`) }

  function get() {
    return s.get() }

  function unget(text: string): void {
    s.unget(text)
    ws()
    classify() }

  function unpos(p: Pos): void {
    s.unpos(p) }

  ws()
  classify()
  return { get, pos, take, unget, unpos } }
