import { Term } from './graph.js'

declare module "./io.js" {

export const exec:(f: Term, put: (s: string) => void) => Promise<any>

}