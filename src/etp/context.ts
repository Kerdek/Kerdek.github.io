import { Identifier, Proposition } from "./abstract.js"
import { TextPosition, TextRange } from "./scanner.js"

export type Judgment = { i: Identifier, t: Proposition }
export type Binding = { i: Identifier, d: Proposition }

export type Sigma = Judgment[]
export type Rho = Binding[]
export type Pi = Identifier[]

export type PropositionContext = { rho: Rho, pi: Pi }
export type Context = { sigma: Sigma, rho: Rho, pi: Pi }
export type Prefix = { sigma: Sigma, rho: Rho, pi: Pi }
export type Module = { sigma: Sigma, pi: Pi }

export type Goal = { tau: Proposition } & Context

export type MessageContent = string | Goal | Proposition
export type Message = { w: TextPosition | TextRange, m: string, c: MessageContent[] }
export type Messages = Message[]

export const msg = (w: TextPosition | TextRange, m: string, ...c: MessageContent[]): Message => ({ w, m, c })
