export const
  di: <X, Y>(x: X, f: (x: X) => Y) => Y = (x, f) => f(x),
  dj: <Y>(f: () => Y) => Y = f => f(),
  tr = <T, R>(t: T, f: (t: NonNullable<T>) => R): R | null => t ? f(t) : null,
  opt = <T>(x: T): [NonNullable<T>] | [] => x ? [x] : [],
  merge = <T>(c: (l: T, r: T) => boolean) => (a: T[], b: T[]) => {
    const r: T[] = []
    let i = 0, j = 0
    for (;;) {
      if (i === a.length) {
        r.push(...b.slice(j))
        break }
      if (j === b.length) {
        r.push(...a.slice(i))
        break }
      const [ai, bj] = [a[i], b[j]] as [T, T]
      r.push(c(ai, bj) ? (i++, ai) : (j++, bj)) }
    return r },
  mergev = <T>(c: (l: T, r: T) => boolean) => (...a: T[][]) =>
    a.reduce(merge(c), [])
