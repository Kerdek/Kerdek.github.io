export const position_from_monaco = (position) => ({
    line: position.lineNumber,
    col: position.column
}), position_to_monaco = (w) => ({
    lineNumber: w.line,
    column: w.col
}), range_from_monaco = (w) => ({
    begin: {
        line: w.startLineNumber,
        col: w.startColumn
    },
    end: {
        line: w.endLineNumber,
        col: w.endColumn
    }
}), range_to_monaco = (w) => ({
    startLineNumber: w.begin.line,
    startColumn: w.begin.col,
    endLineNumber: w.end.line,
    endColumn: w.end.col
});
//# sourceMappingURL=monaco_range.js.map