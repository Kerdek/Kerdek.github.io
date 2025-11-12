export const empty_context = () => ({ sigma: [], rho: [], pi: [] });
export const msg = (w, m, ...c) => ({ w, m, c });
export const visit_proposition = o => (e, ...r) => o[e.k](e, ...r);
export const visit_proof = o => (e, ...r) => o[e.k](e, ...r);
//# sourceMappingURL=lang.js.map