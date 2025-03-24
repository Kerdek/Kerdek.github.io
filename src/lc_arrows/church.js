export const visit = o => e => o[e.kind](e);
export const app = (lhs, rhs) => ({ kind: "app", lhs, rhs });
export const abs = (id, body) => ({ kind: "abs", id, body });
export const imp = (lhs, rhs) => ({ kind: "imp", lhs, rhs });
export const ref = (id) => ({ kind: "ref", id });
//# sourceMappingURL=church.js.map