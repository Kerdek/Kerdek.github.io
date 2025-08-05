export const pointer_hold = (elem, button, id, lock, handler) => {
    const move = (e) => {
        if (e.pointerId === id) {
            handler(e);
        }
    };
    const end = (e) => {
        if (e.pointerId === id && e.button === button) {
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", end);
            document.exitPointerLock();
        }
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end);
    if (lock && !document.pointerLockElement) {
        elem.requestPointerLock();
    }
};
export const html_element = (tag, mod, children) => {
    const elem = document.createElement(tag);
    mod.apply(elem);
    elem.append(...children);
    return elem;
};
export const text_node = s => document.createTextNode(s);
//# sourceMappingURL=dom.js.map