import { homproc } from "../run.js"
import { Graph, Value, visit } from "./church.js"

export const print: (e: Graph) => string = e => homproc((call, cc, ret) => {
const s = (e: Graph) => () => visit({
  abs: ({ param, body }) => call(s(body), dx => ret(`(λ${param}.${dx})`)),
  app: ({ lhs, rhs }) => call(s(lhs), dx => call(s(rhs), dy => ret(`(${dx} ${dy})`))),
  ref: ({ id }) => ret(id),
  ext: ({ body }) => cc(s(body)),
  shr: () => ret("<shared>"),
  lit: ({ value }) => ret(JSON.stringify(value)) })(e)
return s(e) })

export const print_value: (e: Value) => string = e => typeof e === "function" ? "<function>" : JSON.stringify(e)