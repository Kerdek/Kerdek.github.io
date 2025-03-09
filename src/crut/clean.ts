import { Inequalities } from "./constraints.js"
import { type_vars } from "./free_vars.js"
import { TypeTree } from "./graph.js"

export const clean: (given: Inequalities, vars: [string, boolean][], b: boolean) => Inequalities = (given, vars, b) => {
const o: Inequalities = { less: {}, greater: {} }
for (const k in given.less) {
  if (type_vars(given.less[k] as TypeTree, b).some(v => vars.some(x => x[0] === v[0] && x[1] === v[1]))) continue
  o.less[k] = given.less[k] as TypeTree }
for (const k in given.greater) {
  if (type_vars(given.greater[k] as TypeTree, !b).some(v => vars.some(x => x[0] === v[0] && x[1] === v[1]))) continue
  o.greater[k] = given.greater[k] as TypeTree }
return o }
