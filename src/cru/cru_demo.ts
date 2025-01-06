import { scanner } from '../scanner.js';
import { read, print, tokenizer, evaluate } from './cru.js'

(async () => {
let text_res = await fetch('./cru_demo.cru');
if (!text_res.ok) {
  throw new Error(`HTTP error! status: ${text_res.status}`) }
const text = await text_res.text()
const prog = await read(tokenizer(scanner(text)))
console.log(`input program:`)
console.log(text)
// console.log(`result from evaluator:`)
// console.log(evaluate_applicative({}, prog))
console.log(`result from interpreter:`)
console.log(print(evaluate(prog))) })()