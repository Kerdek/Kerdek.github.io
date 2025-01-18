export type ESTAMCont<_Code, Value, State, RealWorld> = (value: Value, state: State) => RealWorld
export type ESTAMRec<Code, Value, State, RealWorld> = (code: Code, state: State, cont: (value: Value, state: State) => RealWorld) => RealWorld
export type ESTAMCC<Code, _Value, _State, RealWorld> = (code: Code) => RealWorld
export type ESTAMRet<_Code, Value, _State, RealWorld> = (value: Value) => RealWorld
export type ESTAMVisit<Code, Value, State> = <RealWorld>(rec: ESTAMRec<Code, Value, State, RealWorld>, cc: ESTAMCC<Code, Value, State, RealWorld>, ret: ESTAMRet<Code, Value, State, RealWorld>) => (code: Code) => RealWorld
export type ESTAMStem<Code, Value, State> = <RealWorld>(rec: ESTAMRec<Code, Value, State, RealWorld>, cc: ESTAMCC<Code, Value, State, RealWorld>, ret: ESTAMRet<Code, Value, State, RealWorld>) => RealWorld
export type ESTAM = <Code, Value, State>(visit: ESTAMVisit<Code, Value, State>) => (root: ESTAMStem<Code, Value, State>) => Value

export const estam: ESTAM = visit => root => {
type Code = Parameters<ReturnType<typeof visit>>[0]
type Value = Parameters<Parameters<typeof visit>[2]>[0]
type State = Parameters<Parameters<typeof visit>[0]>[1]
type Cont = (value: Value, state: State) => boolean
type Rec = (code: Code, state: State, cont: Cont) => boolean
type CC = (code: Code) => boolean
type Ret = ESTAMRet<Code, Value, State, boolean>
const y: [State, Cont][] = []
let result!: Value
let f!: Code
const rec: Rec = (e, s, cont) => (y.push([s, cont]), f = e, true)
const cc: CC = e => (f = e, true)
const ret: Ret = value => (result = value, false)
root(rec, cc, ret)
const v = visit(rec, cc, ret)
for (;;) {
  v(f)
  for (;;) {
    const r = y.pop()
    if (!r) {
      return result }
    if (r[1](result, r[0])) {
      break; } } } }
