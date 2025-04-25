export const for_each = (l, f) => {
    for (const k of Reflect.ownKeys(l)) {
        f(k, l[k]);
    }
};
export const enumerate_list = (l, f) => {
    const r = [];
    for (const k of Reflect.ownKeys(l)) {
        r.push(f(k, l[k]));
    }
    return r;
};
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
//# sourceMappingURL=iterate.js.map