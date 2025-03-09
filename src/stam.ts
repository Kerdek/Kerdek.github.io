import { homproc } from "./run.js"

export type STAMRec<Code, Value, RealWorld> = (code: Code, cont: STAMRet<Code, Value, RealWorld>) => RealWorld
export type STAMRC<Code, _Value, RealWorld> = (code: Code) => RealWorld
export type STAMRet<_Code, Value, RealWorld> = (value: Value) => RealWorld
export type STAMVisit<Code, Value> = <RealWorld>(rec: STAMRec<Code, Value, RealWorld>, cc: STAMRC<Code, Value, RealWorld>, ret: STAMRet<Code, Value, RealWorld>) => (code: Code) => () => RealWorld
export type STAMStem<Code, Value> = <RealWorld>(rec: STAMRec<Code, Value, RealWorld>, cc: STAMRC<Code, Value, RealWorld>, ret: STAMRet<Code, Value, RealWorld>) => RealWorld
export type STAM = <Code, Value>(visit: STAMVisit<Code, Value>) => (root: STAMStem<Code, Value>) => Value

export const stam: STAM = visit => root => homproc((call, cc, ret) => {
type Branch = ReturnType<typeof ret>
type Code = Parameters<ReturnType<typeof visit>>[0]
type Value = Parameters<Parameters<typeof visit>[2]>[0]
type Rec = (code: Code, cont: (x: Value) => Branch) => Branch
type CC = (code: Code) => Branch
const rec: Rec = (code, cont) => call(v(code), cont)
const rc: CC = code => cc(v(code))
const v = visit(rec, rc, ret)
return () => root(rec, rc, ret) })
