import { cascade } from "../common/util/di.js"
import { Identifier, Proposition } from "./abstract.js"
import { TextPosition, TextRange } from "./scanner.js"

export type Judgment = { wi: TextRange, i: Identifier, t: Proposition }
export type Binding = { wi: TextRange, i: Identifier, d: Proposition }

export type Sigma = Judgment[]
export type Rho = Binding[]
export type Pi = Identifier[]

export type PropositionContext = { rho: Rho, pi: Pi, hi: Pi }
export type Context = { prefix: Prefix, sigma: Sigma, rho: Rho, pi: Pi, hi: Pi }
export type Prefix = { sigma: Sigma, rho: Rho, pi: Pi }
export type Module = { sigma: Sigma, pi: Pi }

export type Goal = { tau: Proposition } & Context

export type MessageContent = string | Goal | Proposition
export type Message = { w: TextPosition | TextRange, m: string, c: MessageContent[] }
export type Messages = Message[]

export const

msg = (w: TextPosition | TextRange, m: string, ...c: MessageContent[]): Message =>
({ w, m, c }),

pi = (g: Context | Prefix) =>
'prefix' in g ? [...g.prefix.pi, ...g.pi] : g.pi,

rho = (g: Context | Prefix) =>
'prefix' in g ? [...g.prefix.rho, ...g.rho] : g.rho,

sigma = (g: Context | Prefix) =>
'prefix' in g ? [...g.prefix.sigma, ...g.sigma] : g.sigma,

set_tau = (g: Goal, tau: Proposition) =>
({ ...g, tau }),

push_hi = (g: Goal, ...hi: Pi): Goal =>
({ ...g, hi: [...g.hi, ...hi]}),

push_pi = <T extends Prefix | Context>(g: T, ...pi: Pi): T =>
({ ...g, pi: [...g.pi, ...pi]}),

push_rho = <T extends Prefix | Context>(g: T, ...rho: Rho): T =>
({ ...g, rho: [...g.rho, ...rho], pi: [...g.pi, ...rho.map(({ i }) => i)] }),

push_sigma = <T extends Prefix | Context>(g: T, ...sigma: Sigma): T =>
({ ...g, sigma: [...g.sigma, ...sigma] }),

push_module = (g: Prefix, gi: Module): Prefix =>
push_pi(push_sigma(g, ...gi.sigma), ...gi.pi),

undefine = (i: Identifier, rho: Rho) =>
rho.filter(({ i: ip }) => ip !== i),

safe = (i: Identifier, bound: Pi): Identifier => {
while (bound.some(ipp => ipp === i)) {
  i = `${i}'` }
return i },

empty_goal = (prefix: Prefix, tau: Proposition): Goal =>
({ prefix, tau, sigma: [], rho: [], pi: [], hi: [] }),

empty_prefix = (): Prefix =>
({ sigma: [], rho: [], pi: [] }),

proposition_bound_pi = (i: Identifier) => (pi: Pi) =>
pi.includes(i),

proposition_bound = (i: Identifier, g: Context | Prefix) => {
const f = proposition_bound_pi(i)
return 'prefix' in g ? cascade(f, g.pi, g.prefix.pi) : f(g.pi) },

look_up_proposition_rho = (i: Identifier) => (rho: Rho) =>
rho.findLast(({ i: ip }) => ip === i),

look_up_proposition = (i: Identifier, g: Context | Prefix) => {
const f = look_up_proposition_rho(i)
return 'prefix' in g ? cascade(f, g.rho, g.prefix.rho) : f(g.rho) },

proof_bound_sigma = (i: Identifier) => (sigma: Sigma) =>
sigma.some(({ i: ip }) => ip === i),

proof_bound = (i: Identifier, g: Context | Prefix) => {
const f = proof_bound_sigma(i)
return 'prefix' in g ? cascade(f, g.sigma, g.prefix.sigma) : f(g.sigma) },

look_up_proof_sigma = (i: Identifier) => (sigma: Sigma) =>
sigma.findLast(({ i: ip }) => ip === i),

look_up_proof = (i: Identifier, g: Context | Prefix) => {
const f = look_up_proof_sigma(i)
return 'prefix' in g ? cascade(f, g.sigma, g.prefix.sigma) : f(g.sigma) }
