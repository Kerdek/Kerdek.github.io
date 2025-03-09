export function tokenizer(s) {
    let t;
    function fatal(msg) {
        const w = s.pos();
        throw new Error(`(${w[0]}:${w[1]}:${w[2]}): tokenizer: ${msg}`);
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
        if (k(/^\\/)) {
            t = ["rsolidus", "\\"];
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
        if (k(/^::/)) {
            t = ["doublecolon", "::"];
            return;
        }
        if (k(/^:/)) {
            t = ["colon", ":"];
            return;
        }
        if (k(/^\|/)) {
            t = ["bar", "|"];
            return;
        }
        if (k(/^&/)) {
            t = ["amp", "&"];
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
        if (k(/^{/)) {
            t = ["lbrace", "{"];
            return;
        }
        if (k(/^}/)) {
            t = ["rbrace", "}"];
            return;
        }
        if (k(/^\.\.\./)) {
            t = ["dots", "..."];
            return;
        }
        if (k(/^\./)) {
            t = ["dot", "."];
            return;
        }
        if (k(/^->/)) {
            t = ["arrow", "->"];
            return;
        }
        if (k(/^-/)) {
            t = ["hyphen", "-"];
            return;
        }
        if (k(/^#/)) {
            t = ["hash", "#"];
            return;
        }
        if (k(/^\$/)) {
            t = ["dollar", "$"];
            return;
        }
        let r = k(/^("([^"\\]|\\.)*($|")|[+-]?(?:\d+(?:\.\d+)?)(?:[eE][+-]?\d+)?)/);
        if (r) {
            t = ["literal", r];
            return;
        }
        r = k(/^[A-Za-z_][A-Za-z0-9_]*/);
        if (r === "let") {
            t = ["let", "let"];
            return;
        }
        if (r === "in") {
            t = ["in", "in"];
            return;
        }
        if (r === "as") {
            t = ["as", "as"];
            return;
        }
        if (r === "where") {
            t = ["where", "where"];
            return;
        }
        if (r === "type") {
            t = ["type", "type"];
            return;
        }
        if (r === "true" || r === "false" || r === "undefined") {
            t = ["literal", r];
            return;
        }
        if (r) {
            t = ["identifier", r];
            return;
        }
        fatal(`Unrecognized character sequence.`);
    }
    function get() {
        return s.get();
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
    return { get, pos, take, unget, unpos };
}
//# sourceMappingURL=tokenizer.js.map