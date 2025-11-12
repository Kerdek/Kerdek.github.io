export type Colors = typeof colors

export const mode = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches ?
      "dark" :
    "light"

export const colors = mode === "dark" ? {
  background: '#000000',
  foreground: '#FFFFFF',
  invalid: '#FF0000',
  proposition: '#ffb3aa',
  propositionsymbol: '#fc5e4c',
  proof: '#b0c7ff',
  proofsymbol: '#2e6aff',
  symbol: '#ff3b96',
  comment: '#64c464',
  lineHighlight: '#1b040a',
  ruler: "#002222",
  guide: "#555555" } : {

  background: '#FFFFFF',
  foreground: '#000000',
  invalid: '#CC0000',
  proposition: '#bd4031',
  propositionsymbol: '#fc5e4c',
  proof: '#2146a3',
  proofsymbol: '#2e6aff',
  symbol: '#ff3b96',
  comment: '#339133',
  lineHighlight: "#ffddee",
  ruler: "#ddeeff",
  guide: "#AAAAAA" }
