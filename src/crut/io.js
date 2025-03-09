import { term_lit, term_ext, term_aka, term_app } from './graph.js'
import { evaluate } from './evaluate.js'

export const exec = async (io, put) => {
  const
    s = [],
    unbox = e => evaluate(e).value
  for (;;) {
    io = evaluate(io)
    const { iokind: kind, operands: args } = io
    let x;
    switch (kind) {


    // sequencing

    case "return": {
      const [r] = args
      x = r
      break }
    case "bind": {
      const [n, f] = args
      s.push(f)
      io = n
      continue }
    case "yield": {
      await new Promise(c => window.setTimeout(c, 0))
      x = term_lit(true)
      break }

    // console io

    case "puts": {
      const [s] = args
      put(unbox(s))
      x = term_lit(undefined)
      break }

    // rng

    case "random": {
      const [] = args
      x = term_lit(Math.random())
      break }

    // references

    case "new": {
      const [v] = args
      x = term_ext([[v]])
      break }
    case "get": {
      const [r] = args
      x = term_aka(unbox(r)[0], "<reference>")
      break }
    case "set": {
      const [r, v] = args
      unbox(r)[0] = [v]
      x = term_lit(undefined)
      break }


    default: {
      throw new Error(`No IO kind \`${op[1]}\` is defined.`) } }
    const f = s.pop()
    if (!f) {
      return x }
    io = term_app(['<io>', 0, 0], f, x) } }