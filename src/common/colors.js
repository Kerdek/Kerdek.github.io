export const mode = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches ?
    "dark" :
    "light";
export const colors = mode === "dark" ? {
    background: '#000000',
    foreground: '#FFFFFF',
    invalid: '#FF0000',
    type_text: '#ffb3aa',
    type_symbol: '#fc5e4c',
    term_text: '#b8dfff',
    term_symbol: '#52a3ff',
    document_symbol: '#ff3b96',
    comment: '#64c464',
    line_highlight: '#1b040a',
    ruler: "#002222",
    guide: "#555555"
} : {
    background: '#FFFFFF',
    foreground: '#000000',
    invalid: '#CC0000',
    type_text: '#bd4031',
    type_symbol: '#fc5e4c',
    term_text: '#2558d8',
    term_symbol: '#6a94ff',
    document_symbol: '#ff3b96',
    comment: '#339133',
    line_highlight: "#ffddee",
    ruler: "#ddeeff",
    guide: "#AAAAAA"
};
//# sourceMappingURL=colors.js.map