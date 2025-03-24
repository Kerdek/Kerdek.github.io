import { create_playground } from './create_playground.js';
document.title = 'Lambda Calculus Playground';
const style_rule = (() => {
    const style = document.head.appendChild(document.createElement('style'));
    const ss = style.sheet;
    return ss ? x => ss.insertRule(x, 0) : () => -1;
})();
style_rule(`@font-face {
  font-family: CMU Typewriter Text;
  src: url("../cmuntt.ttf"); }`);
style_rule(`html {
  width: 100%;
  height: 100%; }`);
style_rule(`body {
  font-family: CMU Typewriter Text;
  font-size: 14pt;
  text-align: center;
  height: 100%;
  margin: 0;
  padding: 0; }`);
style_rule(`@media (prefers-color-scheme: light) {
  body {
    background: white;
    color: black;
    caret-color: black; } }`);
style_rule(`@media (prefers-color-scheme: dark) {
  body {
    background: black;
    color: white;
    caret-color: white; } }`);
const [pg, ed] = create_playground(localStorage.getItem('church-playground-system') || "");
pg.style.width = "100%";
pg.style.height = "100%";
ed.getModel().onDidChangeContent(() => localStorage.setItem('church-playground-system', ed.getValue()));
document.body.append(pg);
//# sourceMappingURL=playground.js.map