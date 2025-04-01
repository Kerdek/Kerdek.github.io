export const visit = o => e => o[e.kind](e);
export const all = (id, schema, body) => ({ kind: "all", id, schema, body });
export const imp = (lhs, rhs) => ({ kind: "imp", lhs, rhs });
export const app = (lhs, rhs) => ({ kind: "app", lhs, rhs });
export const ref = (id) => ({ kind: "ref", id });
//# sourceMappingURL=lang.js.map