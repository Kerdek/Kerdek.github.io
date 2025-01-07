import { make, evaluate } from './cru.js'

export const exec = async (io, put, unput, get) => {
  const
    s = [],
    unbox = e => evaluate(e)[1]
  for (;;) {
    io = evaluate(io)
    const [, , ...value] = io
    const [kind, ...args] = value
    const op = evaluate(kind)
    let x;
    switch (op[1]) {

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
      x = make("lit", true)
      break }

    // console io

    case "puts": {
      const [s] = args
      put(unbox(s))
      x = make("lit", undefined)
      break }
    case "unputc": {
      unput()
      x = make("lit", true)
      break }
    case "getc": {
      x = make("lit", await get())
      break }

    // rng

    case "random": {
      const [] = args
      x = make("lit", Math.random())
      break }

    // references

    case "new": {
      const [v] = args
      x = make("ref", [[v]])
      break }
    case "get": {
      const [r] = args
      x = make("shr", unbox(r)[0], "<reference>")
      break }
    case "set": {
      const [r, v] = args
      unbox(r)[0] = [v]
      x = make("lit", undefined)
      break }


    default: {
      throw new Error(`No IO kind \`${op[1]}\` is defined.`) } }
    const f = s.pop()
    if (!f) {
      return x }
    io = make("app", f, x) } }