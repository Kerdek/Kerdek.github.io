
export const for_each = <K extends string | number | symbol, E>(l: { [i in K]: E }, f: (k: K, x: E) => void) => {
  for (const k of Reflect.ownKeys(l)) {
    f(k as keyof typeof l, l[k as keyof typeof l]) } }

export const enumerate_list = <L extends Object, EP>(l: L, f: (k: keyof L, x: L[keyof L]) => EP) => {
  const r: EP[] = []
  for (const k of Reflect.ownKeys(l)) {
    r.push(f(k as keyof typeof l, l[k as keyof typeof l])) }
  return r }

// const enumerate = <K extends string | number | symbol, E, KP extends string | number | symbol, EP>(l: { [i in K]: E }, f: (k: K, x: E) => [KP, EP]) => {
//   const r: { [i in KP]: EP } = {} as any
//   for (const k of Reflect.ownKeys(l)) {
//     const [kp, vp] = f(k as keyof typeof l, l[k as keyof typeof l])
//     r[kp] = vp }
//   return r }

// const async_enumerate = async <K extends string | number | symbol, E, KP extends string | number | symbol, EP>(l: { [i in K]: E }, f: (k: K, x: E) => Promise<[KP, EP]>) => {
//   const r: { [i in KP]: EP } = {} as any
//   for (const k of Reflect.ownKeys(l)) {
//     const [kp, vp] = await f(k as keyof typeof l, l[k as keyof typeof l])
//     r[kp] = vp }
//   return r }

// const async_map = async <E, F>(l: E[], f: (x: E) => Promise<F>) => {
//   const r: F[] = []
//   for (const x of l) {
//     r.push(await f(x)) }
//   return r }
