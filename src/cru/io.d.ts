import { Term } from './cru.js'

declare module "./io.js" {

export const exec:(f: Term, put: (s: string) => void, unput: () => void, get: () => Promise<string>) => Promise<any>

}