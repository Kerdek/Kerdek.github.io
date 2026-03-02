import { Colors } from "../common/colors.js"
import { di } from "../common/util/di.js"
import { TokenT, scanner } from "./scanner.js"

export type TokenKind =
'invalid' |
'proposition' |
'propositionsymbol' |
'proof' |
'proofsymbol' |
'symbol' |
'comment'

export type Token = TokenT<TokenKind>
export type Tokens = Token[]

export type Tokenizer = ReturnType<typeof tokenizer>

const
  reg = (r: RegExp, k: TokenKind) =>
    (t: string): [string, TokenKind] | null =>
    di(t.match(r), m =>
    !m ? null : [m[0], k]),
  regf = (r: RegExp, k: TokenKind, f: string[]) =>
    (t: string): [string, TokenKind] | null =>
    di(t.match(r), m =>
    !m || f.some(e => e == m[0]) ? null : [m[0], k]),
  sym = <K extends 'top' | 'proposition' | 'proof'>(r: RegExp) =>
    (t: string, k: K): [string, TokenKind] | null =>
    di(t.match(r), m =>
    !m ? null : [m[0], k === 'top' ? 'symbol' : k === 'proposition' ? 'propositionsymbol' : 'proofsymbol']),
  // symf = <K extends 'top' | 'proposition' | 'proof'>(r: RegExp, f: string[]) =>
  //   (t: string, k: K): [string, TokenKind] | null =>
  //   di(t.match(r), m =>
  //   !m || f.some(e => e == m[0]) ? null : [m[0], k === 'top' ? 'symbol' : k === 'proposition' ? 'propositionsymbol' : 'proofsymbol']),
  reg_skip = (r: RegExp, k: TokenKind) =>
  (t: string): [string, TokenKind] | null =>
    di(t.match(r), m =>
    !m ? null :
    [m[0].substring(0, m[0].length - (m[1] || '').length), k]),
  keys = ['import', 'export', 'define', 'theorem', 'let', 'lemma', 'premise', 'given', 'print'],
  name = (r: RegExp, k: TokenKind) =>
  (t: string): [string, TokenKind] | null =>
    di(t.match(r), m =>
    m && (keys.some(i => i === m[0]) ? null :
    [m[0], k]))

export const tokenizer = scanner({
  dt: sym<'top' | 'proposition' | 'proof'>(/^\./),
  pp: name(/^[a-zA-Z']+/, 'proposition'),
  pf: name(/^[a-zA-Z0-9\-']+/, 'proof'),
  // ws: reg(/^(\s|--[\s\S]*?(\n|$)|\(\*[\s\S]*?(\*\)|$))*/, 'comment'),
  nl: reg(/^\n/, 'invalid'),
  wl: reg(/^[^\n\S]+/, 'invalid'),
  ch: reg(/^--[^\n]*/, 'comment'),
  cl: reg(/^\(\*/, 'comment'),
  cb: reg(/^(?:[^\n]*?\*\)|[^\n]+)/, 'comment'),
  op: regf(/^[->:=]+/, 'propositionsymbol', [":", ":="]),
  ce: sym<"top" | "proof">(/^:=/),
  cn: sym<"top" | "proof">(/^:/),
  al: sym<'proof' | 'proposition'>(/^\\\//),
  lm: sym<'proof' | 'proposition'>(/^\\/),
  lp: reg(/^\(/, 'propositionsymbol'),
  rp: reg(/^\)/, 'propositionsymbol'),
  lb: sym<'proof'>(/^\[/),
  rb: sym<'proof'>(/^\]/),
  dv: reg_skip(/^[\s\S]*?(\b(import|export|print|define|theorem)\b|\n|$)/, 'invalid'),
  df: reg(/^\bdefine\b/, 'symbol'),
  pt: sym<'top' | 'proof'>(/^\bprint\b/),
  ip: reg(/^\bimport\b/, 'symbol'),
  ep: reg(/^\bexport\b/, 'symbol'),
  ui: reg(/^\/\\/, 'proofsymbol'),
  cp: reg(/^\\/, 'proofsymbol'),
  le: reg(/^\blemma\b/, 'proofsymbol'),
  ll: reg(/^\blet\b/, 'proofsymbol'),
  th: reg(/^\btheorem\b/, 'symbol'),
  li: reg(/^"(?:[^"\\]|\\[nt"\\])*"?/, 'proofsymbol') })

export const token_kinds: (keyof Colors)[] = [
  'invalid',
  'foreground',
  'proposition',
  'propositionsymbol',
  'proof',
  'proofsymbol',
  'symbol',
  'comment']
