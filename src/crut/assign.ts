type Assign = <K extends { [i: string]: any }>(e: { [i: string]: any }, x: K) => K

export const assign: Assign = (e, x) => {
  if (x === e) {
    return e as any }
  for (const i in e) {
    delete e[i] }
  for (const i in x) {
    e[i] = x[i] as any }
  return e as any }
