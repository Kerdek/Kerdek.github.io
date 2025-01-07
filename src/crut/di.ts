export const di: <X, Y>(x: X, f: (x: X) => Y) => Y = (x, f) => f(x)
