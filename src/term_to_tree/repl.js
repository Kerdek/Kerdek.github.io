import { read, to_digraph } from "./lang.js";
(async () => {
    document.title = 'term to tree repl';
    const include = src => new Promise(cb => {
        const js = document.createElement('script');
        js.src = src;
        js.type = 'text/javascript';
        js.addEventListener('load', cb);
        document.head.appendChild(js);
    });
    await include("../viz.js");
    await include("../lite.render.js");
    const style_element = document.createElement('style');
    const style_sheet = document.head.appendChild(style_element).sheet;
    const style_rule = style_sheet ? x => style_sheet.insertRule(x, 0) : () => { };
    style_rule(`::selection { background: #5c0a28; }`);
    style_rule(`* { margin: 0px; padding: 0px; }`);
    style_rule(`@font-face {
  font-family: CustomFont;
  src: url("../cmuntt.ttf"); }`);
    style_rule(`body {
  font-family: CustomFont;
  font-size: 11pt;
  line-height: 13pt; }`);
    style_rule(`.ree::after {
  content: '\\200D'; }`);
    style_rule(`@media (prefers-color-scheme: light) {
  :root {
    --foreground: black;
    --dim: gray;
    --background: white;
    --punct: #bb69d4;
    --parn0: #512881;
    --parn1: #6e1680;
    --parn2: #892365;
    --parn3: #a32e5b;
    --parn4: #a13648;
    --parn5: #a85334;
    --quant: #530ba5;
    --const: #228709;
    --key: #280a8c;
    --id: #cd3a05;
    --ws: #3e8888; } }`);
    style_rule(`@media (prefers-color-scheme: dark) {
  :root {
    --foreground: white;
    --dim: gray;
    --background: black;
    --punct: #9a1d3e;
    --parn0: #512881;
    --parn1: #6e1680;
    --parn2: #892365;
    --parn3: #a32e5b;
    --parn4: #a13648;
    --parn5: #a85334;
    --quant: #bb4088;
    --const: #96f3b5;
    --key: #7e57ff;
    --id: #ffaa8c;
    --ws: #006969; } }`);
    style_rule(`body {
  background: var(--background);
  color: var(--foreground);
  caret-color: var(--foreground); }`);
    style_rule(`.hlpunct { color: var(--punct); }`);
    style_rule(`.hlparn0 { color: var(--parn0); }`);
    style_rule(`.hlparn1 { color: var(--parn1); }`);
    style_rule(`.hlparn2 { color: var(--parn2); }`);
    style_rule(`.hlparn3 { color: var(--parn3); }`);
    style_rule(`.hlparn4 { color: var(--parn4); }`);
    style_rule(`.hlparn5 { color: var(--parn5); }`);
    style_rule(`.hlquant { color: var(--quant); }`);
    style_rule(`.hlconst { color: var(--const); }`);
    style_rule(`.hlkey { color: var(--key); }`);
    style_rule(`.hlid { color: var(--id); }`);
    style_rule(`.hlws { color: var(--ws); }`);
    style_rule(`svg text {
  font-size: 13pt;
  text-anchor: middle; }`);
    style_rule(`svg .edge path, svg .node ellipse, svg .node polygon {
  stroke: var(--foreground);
  fill: none; }`);
    style_rule(`svg .node text, svg .edge polygon, svg .node.start polygon {
  stroke: none;
  fill: var(--foreground); }`);
    style_rule(`svg .node.start text {
  stroke: none;
  fill: var(--background); }`);
    const txt = x => document.createTextNode(x);
    const intro = document.createElement('div');
    document.body.appendChild(intro);
    intro.className = "hlquant";
    const reset_link = document.createElement('a');
    intro.appendChild(reset_link);
    reset_link.href = '#';
    reset_link.appendChild(txt('Reset'));
    const cmd = document.createElement('div');
    document.body.appendChild(cmd);
    cmd.toggleAttribute('contenteditable');
    cmd.spellcheck = false;
    cmd.style.outline = "none";
    cmd.style.font = "inherit";
    cmd.style.border = "none";
    cmd.style.color = "inherit";
    cmd.style.whiteSpace = "pre-wrap";
    cmd.style.wordBreak = "break-all";
    cmd.style.minHeight = "12pt";
    cmd.style.overflow = "hidden";
    cmd.style.width = "100%";
    const output = document.createElement('div');
    document.body.appendChild(output);
    output.style.position = "relative";
    const dispatch = async () => {
        const s = cmd.textContent || '';
        try {
            const e = read(s);
            const input_segment = document.createElement('div');
            output.appendChild(input_segment);
            const output_segment = document.createElement('div');
            output.appendChild(output_segment);
            output_segment.appendChild(await to_digraph("state", e));
        }
        catch {
            const p = document.createElement("p");
            p.innerText = " # parse error #";
            output.appendChild(p);
            window.scrollTo(0, document.body.scrollHeight);
            return;
        }
    };
    const reset = () => {
        cmd.innerHTML = '';
        output.innerHTML = '';
    };
    reset_link.addEventListener('click', reset);
    cmd.onkeydown = e => {
        if (e.key === 'Enter') {
            if (e.ctrlKey) {
                reset();
                e.preventDefault();
                return false;
            }
            if (!e.shiftKey) {
                dispatch();
                e.preventDefault();
                return false;
            }
        }
        return true;
    };
    cmd.focus();
})();
//# sourceMappingURL=repl.js.map