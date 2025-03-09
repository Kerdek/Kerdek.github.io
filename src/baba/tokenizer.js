export function tokenizer(s) {
    let t;
    function fatal(msg) {
        throw new Error(`(${s.pos()[0]}:${s.pos()[1]}:${s.pos()[2]}): tokenizer: ${msg}`);
    }
    function k(t) {
        const matches = s.get().match(t);
        if (matches === null) {
            return null;
        }
        return matches[0];
    }
    function pos() {
        return s.pos();
    }
    function take(k) {
        if (t[0] === k) {
            const r = t;
            skip();
            return r;
        }
        return undefined;
    }
    function ws() {
        const ws = k(/^(\s|\/\/([^\n\\]|\\.)*?(\n|$)|\/\*([^\*\\]|\\.|\*[^\/])*?(\*\/|$))*/);
        if (ws) {
            s.skip(ws.length);
        }
    }
    function skip() {
        if (t[0] === "eof") {
            return;
        }
        s.skip(t[1].length);
        ws();
        classify();
    }
    function classify() {
        if (s.get().length === 0) {
            t = ["eof"];
            return;
        }
        if (k(/^\(/)) {
            t = ["lparen", "("];
            return;
        }
        if (k(/^\)/)) {
            t = ["rparen", ")"];
            return;
        }
        if (k(/^{/)) {
            t = ["lbrace", "{"];
            return;
        }
        if (k(/^}/)) {
            t = ["rbrace", "}"];
            return;
        }
        if (k(/^\[/)) {
            t = ["lbracket", "["];
            return;
        }
        if (k(/^\]/)) {
            t = ["rbracket", "]"];
            return;
        }
        if (k(/^\./)) {
            t = ["dot", "."];
            return;
        }
        if (k(/^~/)) {
            t = ["tilde", "~"];
            return;
        }
        if (k(/^;/)) {
            t = ["semicolon", ";"];
            return;
        }
        if (k(/^<<=/)) {
            t = ["ltlteq", "<<="];
            return;
        }
        if (k(/^>>=/)) {
            t = ["gtgteq", ">>="];
            return;
        }
        if (k(/^&&=/)) {
            t = ["ampampeq", "&&="];
            return;
        }
        if (k(/^\|\|=/)) {
            t = ["pipepipeeq", "||="];
            return;
        }
        if (k(/^&=/)) {
            t = ["ampeq", "&="];
            return;
        }
        if (k(/^\^=/)) {
            t = ["careteq", "^="];
            return;
        }
        if (k(/^\|=/)) {
            t = ["pipeeq", "|="];
            return;
        }
        if (k(/^<</)) {
            t = ["ltlt", "<<"];
            return;
        }
        if (k(/^>>/)) {
            t = ["gtgt", ">>"];
            return;
        }
        if (k(/^&&/)) {
            t = ["ampamp", "&&"];
            return;
        }
        if (k(/^\|\|/)) {
            t = ["pipepipe", "||"];
            return;
        }
        if (k(/^&/)) {
            t = ["amp", "&"];
            return;
        }
        if (k(/^\^/)) {
            t = ["caret", "^"];
            return;
        }
        if (k(/^\|/)) {
            t = ["pipe", "|"];
            return;
        }
        if (k(/^<</)) {
            t = ["ltlt", "<<"];
            return;
        }
        if (k(/^>>/)) {
            t = ["gtgt", ">>"];
            return;
        }
        if (k(/^==/)) {
            t = ["ee", "=="];
            return;
        }
        if (k(/^!=/)) {
            t = ["ne", "!="];
            return;
        }
        if (k(/^<=/)) {
            t = ["le", "<="];
            return;
        }
        if (k(/^</)) {
            t = ["lt", "<"];
            return;
        }
        if (k(/^>=/)) {
            t = ["ge", ">="];
            return;
        }
        if (k(/^>/)) {
            t = ["gt", ">"];
            return;
        }
        if (k(/^\+=/)) {
            t = ["pluseq", "+="];
            return;
        }
        if (k(/^-=/)) {
            t = ["hypheneq", "-="];
            return;
        }
        if (k(/^\*=/)) {
            t = ["asteq", "*="];
            return;
        }
        if (k(/^\/=/)) {
            t = ["solideq", "/="];
            return;
        }
        if (k(/^%=/)) {
            t = ["perceq", "%="];
            return;
        }
        if (k(/^\+/)) {
            t = ["plus", "+"];
            return;
        }
        if (k(/^-/)) {
            t = ["hyphen", "-"];
            return;
        }
        if (k(/^\*/)) {
            t = ["ast", "*"];
            return;
        }
        if (k(/^\//)) {
            t = ["solid", "/"];
            return;
        }
        if (k(/^%/)) {
            t = ["perc", "%"];
            return;
        }
        if (k(/^!/)) {
            t = ["exclam", "!"];
            return;
        }
        if (k(/^=/)) {
            t = ["equal", "="];
            return;
        }
        if (k(/^,/)) {
            t = ["comma", ","];
            return;
        }
        let r = k(/^("([^"\\]|\\.)*($|")|'([^'\\]|\\.)*($|')|[+-]?(?:\d+(?:\.\d+)?)(?:[eE][+-]?\d+)?|false|true|null|undefined)/);
        if (r) {
            t = ["literal", r];
            return;
        }
        r = k(/^[A-Za-z_][A-Za-z0-9_]*/);
        if (r === "break" ||
            r === "continue" ||
            r === "return" ||
            r === "fun" ||
            r === "in" ||
            r === "if" ||
            r === "else" ||
            r === "while" ||
            r === "for" ||
            r === "do") {
            t = [r, r];
            return;
        }
        if (r) {
            t = ["identifier", r];
            return;
        }
        fatal(`Unrecognized character sequence.`);
    }
    function unget(text) {
        s.unget(text);
        ws();
        classify();
    }
    function unpos(p) {
        s.unpos(p);
    }
    ws();
    classify();
    return { get: () => s.get(), unget, pos, take, unpos };
}
//# sourceMappingURL=tokenizer.js.map