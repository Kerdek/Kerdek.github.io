import { DHomStem } from './run.js'

export const fatal: (m: string) => never = m => { throw new Error(m) }

export type Term = {
  print: (p: boolean, r: boolean) => DHomStem<string>,
  to_JS: DHomStem<string> }

export type Func = (e: Term) => Term
export type Value = number | string | boolean | undefined | Func

const parens = (c: boolean, s: string) => c ? `(${s})` : s

export const abs: (param: string, body: Term) => Term = (param, body) => {
  const e: Term = {
  print: (_p, r) => (call, _cc, ret) => call(body.print(false, true), dx => ret(parens(!r, `λ${param}.${dx}`))),
  to_JS: (call, _cc, ret) => call(body.to_JS, dx => ret(`(call, ret) => _${param} => ${dx}`)) }
  return e }

export const app: (lhs: Term, rhs: Term) => Term = (lhs, rhs) => {
  const e: Term = {
  print: (p, r) => (call, _cc, ret) => call(lhs.print(false, false), dx => call(rhs.print(true, p || r), dy => ret(parens(p, `${dx} ${dy}`)))),
  to_JS: (call, _cc, ret) => call(lhs.to_JS, dx => call(rhs.to_JS, dy => ret(`call(${dy}, (${dx})(call, ret))`))) }
  return e }

export const ref: (id: string) => Term = id => {
  const e: Term = {
  print: (_p, _r) => (_call, _cc, ret) => ret(id),
  to_JS: (_call, _cc, ret) => ret(`ret(${id})`) }
  return e }