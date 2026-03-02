const { assign } = Object;
export const elm = (tag) => document.createElement(tag), txt = (s) => document.createTextNode(s), css = (() => {
    const e = document.head.appendChild(document.createElement('style'));
    const ss = e.sheet;
    return ss ? (x) => ss.insertRule(x, 0) : () => -1;
})(), download = (title, text) => {
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
}, get_image_data = async (src) => {
    const image = new Image();
    image.src = src;
    await new Promise(cb => image.onload = cb);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return null;
    }
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}, prompt_file = async () => {
    let input = document.createElement('input');
    input.type = 'file';
    await new Promise(cb => {
        input.onchange = cb;
        input.click();
    });
    let chapters = input.files;
    return chapters && chapters[0] && await chapters[0].text();
}, hover_accent = (e, unhovered, hovered) => {
    const s = new Set();
    assign(e.style, unhovered);
    e.addEventListener('pointerenter', ev => {
        s.add(ev.pointerId);
        assign(e.style, hovered);
    });
    e.addEventListener('pointerleave', ev => {
        s.delete(ev.pointerId);
        if (s.size === 0) {
            assign(e.style, unhovered);
        }
    });
}, pointer_hold = (e, ev, lock, handler) => {
    let x = ev.clientX;
    let y = ev.clientY;
    const move = (evp) => {
        if (evp.pointerId === ev.pointerId) {
            if (lock) {
                handler(evp.movementX, evp.movementY);
                return;
            }
            handler(evp.clientX - x, evp.clientY - y);
            x = evp.clientX;
            y = evp.clientY;
        }
    };
    const end = (evp) => {
        if (evp.pointerId === ev.pointerId && evp.button === ev.button) {
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", end);
            if (lock) {
                document.exitPointerLock();
            }
        }
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end);
    if (lock && !document.pointerLockElement) {
        e.requestPointerLock();
    }
}, grab_hold = (e) => {
    assign(e.style, {
        cursor: 'grab'
    });
    e.addEventListener('pointerdown', ev => {
        if (ev.button === 0) {
            if (ev.pointerType === 'mouse') {
                const up = (evp) => {
                    if (ev.pointerId === evp.pointerId) {
                        e.style.cursor = 'grab';
                        e.removeEventListener('pointerup', up);
                    }
                };
                e.addEventListener('pointerup', up);
                e.style.cursor = 'grabbing';
            }
        }
    });
};
//# sourceMappingURL=dom.js.map