import { cascade } from "../common/util/di.js";
export const msg = (w, m, ...c) => ({ w, m, c }), pi = (g) => 'prefix' in g ? [...g.prefix.pi, ...g.pi] : g.pi, rho = (g) => 'prefix' in g ? [...g.prefix.rho, ...g.rho] : g.rho, sigma = (g) => 'prefix' in g ? [...g.prefix.sigma, ...g.sigma] : g.sigma, set_tau = (g, tau) => ({ ...g, tau }), push_hi = (g, ...hi) => ({ ...g, hi: [...g.hi, ...hi] }), push_pi = (g, ...pi) => ({ ...g, pi: [...g.pi, ...pi] }), push_rho = (g, ...rho) => ({ ...g, rho: [...g.rho, ...rho], pi: [...g.pi, ...rho.map(({ i }) => i)] }), push_sigma = (g, ...sigma) => ({ ...g, sigma: [...g.sigma, ...sigma] }), push_module = (g, gi) => push_pi(push_sigma(g, ...gi.sigma), ...gi.pi), undefine = (i, rho) => rho.filter(({ i: ip }) => ip !== i), safe = (i, bound) => {
    while (bound.some(ipp => ipp === i)) {
        i = `${i}'`;
    }
    return i;
}, empty_goal = (prefix, tau) => ({ prefix, tau, sigma: [], rho: [], pi: [], hi: [] }), empty_prefix = () => ({ sigma: [], rho: [], pi: [] }), proposition_bound_pi = (i) => (pi) => pi.includes(i), proposition_bound = (i, g) => {
    const f = proposition_bound_pi(i);
    return 'prefix' in g ? cascade(f, g.pi, g.prefix.pi) : f(g.pi);
}, look_up_proposition_rho = (i) => (rho) => rho.findLast(({ i: ip }) => ip === i), look_up_proposition = (i, g) => {
    const f = look_up_proposition_rho(i);
    return 'prefix' in g ? cascade(f, g.rho, g.prefix.rho) : f(g.rho);
}, proof_bound_sigma = (i) => (sigma) => sigma.some(({ i: ip }) => ip === i), proof_bound = (i, g) => {
    const f = proof_bound_sigma(i);
    return 'prefix' in g ? cascade(f, g.sigma, g.prefix.sigma) : f(g.sigma);
}, look_up_proof_sigma = (i) => (sigma) => sigma.findLast(({ i: ip }) => ip === i), look_up_proof = (i, g) => {
    const f = look_up_proof_sigma(i);
    return 'prefix' in g ? cascade(f, g.sigma, g.prefix.sigma) : f(g.sigma);
};
//# sourceMappingURL=context.js.map