import { TextPosition, TextRange } from './scanner.js'

export const

position_from_monaco = (position: monaco.IPosition): TextPosition => ({
line: position.lineNumber,
col: position.column }),

position_to_monaco = (w: TextPosition): monaco.IPosition => ({
lineNumber: w.line,
column: w.col }),

range_from_monaco = (w: monaco.IRange): TextRange => ({
begin: {
  line: w.startLineNumber,
  col: w.startColumn},
end: {
  line: w.endLineNumber,
  col: w.endColumn } }),

range_to_monaco = (w: TextRange): monaco.IRange => ({
startLineNumber: w.begin.line,
startColumn: w.begin.col,
endLineNumber: w.end.line,
endColumn: w.end.col })
