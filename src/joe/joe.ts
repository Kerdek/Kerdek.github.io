type JoeProgram = { [i: string]: JoeRoutine }

type JoeRoutine = JoeInstruction[]

type JoeOperand =
  ["immediate", string | number | boolean] |
  ["stack", number]

type JoeInstruction =
  ["ccallcc", number, string] |
  ["callcc", string] |
  ["call", string] |
  ["ret"] |
  ["push", JoeOperand] |
  ["pop"] |
  ["delete", number] |
  ["newArray"] |
  ["ppush", JoeOperand, JoeOperand] |
  ["ppop", JoeOperand, JoeOperand] |
  ["pget", JoeOperand, number] |
  ["pdelete", JoeOperand, number] |
  ["add", JoeOperand, JoeOperand] |
  ["sub", JoeOperand, JoeOperand] |
  ["mul", JoeOperand, JoeOperand] |
  ["eq", JoeOperand, JoeOperand]

type Rest<i, Term> = Term extends [i, ...infer R] ? R : never
type JoeInstructionKind = JoeInstruction[0]
type JoeInstructionSorts = { [i in JoeInstructionKind]: [i, ...Rest<i, JoeInstruction>] }

export function joe(program: JoeProgram): any[] {
  type ProgramCounter = [JoeRoutine, number]
  type InstructionTable = { [i in JoeInstructionKind]: (e: JoeInstructionSorts[i]) => void }
  const stack: any[] = []
  const istack: ProgramCounter[] = []
  let main = program["main"]
  if (main === undefined) {
    throw new Error("No `main` found in program.") }
  let pc: ProgramCounter | undefined = [main, 0]
  let pcd: ProgramCounter = pc
  function operand(op: JoeOperand) {
    if (op[0] === "immediate") {
      return op[1] }
    else {
      return stack[op[1]] } }
  const table: InstructionTable = {
    ccallcc: ([, off, where]) => {
      if (stack[off]) {
        const w = program[where]
        if (w === undefined) {
          throw new Error(`Undefined label \`${where}\`.`)}
        pc = [w, 0]} },
    callcc: ([, where]) => {
      const w = program[where]
      if (w === undefined) {
        throw new Error(`Undefined label \`${where}\`.`)}
      pc = [w, 0]},
    call: ([, where]) => {
      istack.unshift(pcd)
      const w = program[where]
      if (w === undefined) {
        throw new Error(`Undefined label \`${where}\`.`)}
      pc = [w, 0]},ret: ([]) => (pc = istack.shift()),
    push: ([, op]) => stack.unshift(operand(op)),
    pop: ([]) => stack.shift(),
    delete: ([, off]) => stack.splice(off, 1),
    newArray: ([]) => stack.unshift([]),
    ppush: ([, opa, opb]) => operand(opa).unshift(operand(opb)),
    ppop: ([, op]) => operand(op).shift(),
    pget: ([, op, off]) => operand(op)[off],
    pdelete: ([, op, off]) => delete operand(op)[off],
    add: ([, opa, opb]) => stack.unshift((operand(opa) as any) + (operand(opb) as any)),
    sub: ([, opa, opb]) => stack.unshift((operand(opa) as any) - (operand(opb) as any)),
    mul: ([, opa, opb]) => stack.unshift((operand(opa) as any) * (operand(opb) as any)),
    eq: ([, opa, opb]) => stack.unshift((operand(opa) as any) === (operand(opb) as any)) }

  for (;;) {
    if (pc === undefined) {
      return stack }
    pcd = pc
    const ins = pc[0][pc[1]++]
    if (ins === undefined) table["ret"](["ret"])
    else table[ins[0]](ins as any) } }

let res = await fetch(`./demo.joe.json`);
if (!res.ok) {
  throw new Error(`HTTP status ${res.status} while fetching \`./${res.url}\``) }
console.log(joe(JSON.parse(await res.text())))