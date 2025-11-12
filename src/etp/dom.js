import { dj } from "./di.js";
export const elm = (tag, mod) => {
    const e = document.createElement(tag);
    mod.apply(e, [e]);
    return e;
}, ela = async (tag, mod) => {
    const e = document.createElement(tag);
    await mod.apply(e, [e]);
    return e;
}, txt = (s) => document.createTextNode(s), css = dj(() => {
    const style = document.head.appendChild(document.createElement('style'));
    const ss = style.sheet;
    return ss ? (x) => ss.insertRule(x, 0) : () => { };
}), download = (text, title) => {
    const blob = new Blob([text], {
        type: "text/plain"
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}, prompt_file = async () => {
    let input = document.createElement('input');
    input.type = 'file';
    await new Promise(cb => {
        input.onchange = cb;
        input.click();
    });
    let chapters = input.files;
    return chapters && chapters[0] && await chapters[0].text();
}, hover_accent = (color, e) => {
    e.addEventListener('pointerenter', () => {
        e.style.background = color;
    });
    e.addEventListener('pointerleave', () => {
        e.style.removeProperty('background');
    });
};
//# sourceMappingURL=dom.js.map