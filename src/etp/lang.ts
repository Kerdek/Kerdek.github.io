import { TextPosition, TextRange } from "./scanner.js"

export type Identifier = string

export type Variable = [] | [Proposition]

export type PropositionGrammar = {
lam: { w: TextRange, o?: Proposition, k: "lam", i: Identifier, b: Proposition }, // Lambda
imp: { w: TextRange, o?: Proposition, k: "imp", l: Proposition, r: Proposition }, // Arrow
app: { w: TextRange, o?: Proposition, k: "app", l: Proposition, r: Proposition }, // Application
ref: { w: TextRange, o?: Proposition, k: "ref", i: Identifier }, // Reference
var: { w: TextRange, o?: Proposition, k: "var", d: Variable }, // Variable
err: { w: TextRange, o?: Proposition, k: "err" } } // Error

export type ProofGrammar = {
uni: { w: TextRange, k: "uni", i: Identifier, b: Proof }, // Introduction
cdp: { w: TextRange, k: "cdp", i: Identifier, t?: Proposition, b: Proof }, // Premise
def: { w: TextRange, k: "def", i: Identifier, d: Proposition, b: Proof }, // Let
lem: { w: TextRange, k: "lem", i: Identifier, t?: Proposition, d: Proof, b: Proof }, // Lemma
spe: { w: TextRange, k: "spe", l: Proof, r: Proposition }, // Specialization
mop: { w: TextRange, k: "mop", l: Proof, r: Proof }, // Modus Ponens
coe: { w: TextRange, k: "coe", l: Proof, r: Proposition }, // Coercion
ref: { w: TextRange, k: "ref", i: Identifier }, // Reference
prt: { w: TextRange, k: "prt", d: Proposition, b: Proof }, // Print
err: { w: TextRange, k: "err", b?: Proposition } } // Error

export type StatementGrammar = {
def: { w: TextRange, k: "def", i: Identifier, d: Proposition },
prt: { w: TextRange, k: "prt", d: Proposition },
thm: { w: TextRange, k: "thm", i: Identifier, t: Proposition, d: Proof } }

export type PropositionKind = keyof PropositionGrammar
export type ProofKind = keyof ProofGrammar
export type StatementKind = keyof StatementGrammar

export type Proposition = PropositionGrammar[PropositionKind]
export type Proof = ProofGrammar[ProofKind]
export type Statement = StatementGrammar[StatementKind]

export type Article = Statement[]

export type Sigma = ({ i: Identifier, t: Proposition })[]
export type Rho = ({ i: Identifier, d: Proposition })[]
export type Pi = Identifier[]

export type PropositionContext = { rho: Rho, pi: Pi }
export type ProofContext = { sigma: Sigma }
export type Context = PropositionContext & ProofContext
export type Goal = { tau: Proposition } & Context

export type MessageContent = string | Goal | Proposition
export type Message = { w: TextPosition | TextRange, m: string, c: MessageContent[] }
export type Messages = Message[]

export const empty_context = () => ({ sigma: [], rho: [], pi: [] } as Context)

export const msg = (w: TextPosition | TextRange, m: string, ...c: MessageContent[]): Message => ({ w, m, c })

type Visit<G> = <K extends keyof G, R, E extends any[], O extends { [i in K]: (e: G[i], ...r: E) => R }>(o: O) => (e: G[K], ...r: E) => R

export const visit_proposition: Visit<PropositionGrammar> = o => (e, ...r) => o[e.k as keyof typeof o](e, ...r)
export const visit_proof: Visit<ProofGrammar> = o => (e, ...r) => o[e.k as keyof typeof o](e, ...r)