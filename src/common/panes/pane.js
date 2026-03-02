import { colors } from '../colors.js';
import { assign, mod } from '../util/di.js';
import { elm, grab_hold, pointer_hold, txt } from '../util/dom.js';
import { button, simple_tool_tip, context_menu } from './ui.js';
const metas = [], shift_down = (i) => {
    for (const meta of metas) {
        if (meta.index > i) {
            meta.index = meta.index - 1;
            meta.all.style.zIndex = `${meta.index}`;
        }
    }
}, to_front = (meta) => {
    const i = meta.index;
    meta.index = metas.length;
    meta.all.style.zIndex = `${meta.index}`;
    shift_down(i);
}, set_emph = () => {
    for (const meta of metas) {
        meta.title_bar.style.background =
            meta.index == metas.length - 1 ?
                colors.ruler :
                colors.background;
    }
}, activate = (pane) => {
    to_front(pane);
    set_emph();
};
let pane_spawn = 0;
export const create_pane = (element, options) => {
    pane_spawn += 100;
    if (pane_spawn > document.body.clientHeight - 100) {
        pane_spawn -= document.body.clientHeight - 200;
    }
    let pos = [pane_spawn, pane_spawn];
    let size = options && 'size' in options ? options.size : [300, 400];
    const close_handlers = new Set();
    const close = () => {
        for (const handler of close_handlers) {
            handler();
        }
        const k = metas.findIndex(x => x.all == all);
        if (k !== -1) {
            metas.splice(k, 1);
        }
        document.body.removeChild(all);
        shift_down(meta.index);
        set_emph();
    };
    const title_text = txt('');
    const title_text_box = mod(elm('div'), e => {
        assign(e.style, {
            whiteSpace: 'pre',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexGrow: '1',
            flexShrink: '1',
            overflow: 'hidden'
        });
        simple_tool_tip(e, 'Move window');
        grab_hold(e);
        e.addEventListener('pointerdown', ev => {
            if (ev.button === 0) {
                ev.preventDefault();
                ev.stopPropagation();
                const drag_total = [0, 0];
                const pos_start = [...pos];
                pointer_hold(e, ev, false, (x, y) => {
                    drag_total[0] += x;
                    drag_total[1] += y;
                    pos[0] = pos_start[0] + drag_total[0];
                    pos[0] = Math.min(pos[0], document.body.clientWidth - 100);
                    pos[0] = Math.max(pos[0], 100 - size[0]);
                    pos[1] = pos_start[1] + drag_total[1];
                    pos[1] = Math.min(pos[1], document.body.clientHeight - 100);
                    pos[1] = Math.max(pos[1], 0);
                    all.style.left = `${pos[0]}px`;
                    all.style.top = `${pos[1]}px`;
                });
            }
            return false;
        });
        context_menu(e, () => [{
                type: 'text',
                tip: 'Close window',
                label: 'Close',
                handler: () => {
                    close();
                }
            }]);
        e.append(title_text);
    });
    const resize_button = () => mod(button('⤢'), e => {
        assign(e.style, {
            flexGrow: '0',
            flexShrink: '0',
            paddingLeft: '1px',
            paddingRight: '0',
            paddingTop: '1px',
            height: '18px',
            width: '18px',
            margin: '1px'
        });
        simple_tool_tip(e, 'Resize window');
        grab_hold(e);
        e.addEventListener('pointerdown', async (ev) => {
            if (ev.button === 0) {
                const drag_total = [0, 0];
                const pos_start = [...pos];
                const size_start = [...size];
                pointer_hold(e, ev, false, (x, y) => {
                    drag_total[0] += x;
                    drag_total[1] += y;
                    size[0] = size_start[0] + drag_total[0];
                    size[0] = Math.max(size[0], 50);
                    size[0] = Math.max(size[0], 100 - pos_start[0]);
                    size[1] = size_start[1] - drag_total[1];
                    size[1] = Math.max(size[1], 27);
                    size[1] = Math.max(size[1], size_start[1] + 100 + pos_start[1] - document.body.clientHeight);
                    size[1] = Math.min(size[1], size_start[1] + pos_start[1]);
                    pos[1] = pos_start[1] + size_start[1] - size[1];
                    all.style.top = `${pos[1]}px`;
                    all.style.width = `${size[0] - 2}px`;
                    all.style.height = `${size[1] - 2}px`;
                });
            }
        });
    });
    const close_button = mod(button('⏼'), e => {
        assign(e.style, {
            flexGrow: '0',
            flexShrink: '0',
            fontSize: '16px',
            paddingLeft: '0',
            paddingRight: '0',
            paddingTop: '3px',
            height: '16px',
            width: '19px',
            margin: '1px'
        });
        const end = simple_tool_tip(e, 'Close window');
        e.addEventListener('click', () => {
            end();
            close();
        });
    });
    const title_bar = mod(elm('div'), e => {
        assign(e.style, {
            borderBottomStyle: 'solid',
            borderBottomWidth: '1px',
            borderBottomColor: colors.foreground,
            userSelect: 'none',
            alignItems: 'center',
            padding: '1px',
            display: 'flex',
            flexDirection: 'row',
            height: '23px',
            flexGrow: '0',
            flexShrink: '0',
            background: colors.background,
            color: colors.foreground
        });
        e.append(title_text_box, ...!options || !('user_size' in options) || options.user_size ? [resize_button()] : [], close_button);
    });
    const contents_box = mod(elm('div'), e => {
        assign(e.style, {
            position: 'relative',
            display: 'inline',
            flexGrow: '1',
            flexShrink: '0',
            flexBasis: '0'
        });
        e.append(element);
    });
    const all = mod(elm('div'), e => {
        assign(e.style, {
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: colors.foreground,
            background: colors.background,
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            left: `${pos[0]}px`,
            top: `${pos[1]}px`,
            width: `${size[0] - 2}px`,
            height: `${size[1] - 2}px`,
            overflow: 'hidden',
            zIndex: `${metas.length}`
        });
        e.addEventListener('pointerdown', () => {
            activate(meta);
        }, true);
        e.append(title_bar, contents_box);
    });
    const meta = { all, index: metas.length, title_bar, close };
    metas.push(meta);
    document.body.appendChild(all);
    if (options && 'auto_size' in options && options.auto_size) {
        size = [element.offsetWidth + 2, element.offsetHeight + 26];
        all.style.width = `${size[0] - 2}px`;
        all.style.height = `${size[1] - 2}px`;
    }
    set_emph();
    return {
        client_width: () => size[0] - 2,
        client_height: () => size[1] - 26,
        add_close_handler: handler => {
            close_handlers.add(handler);
        },
        remove_close_handler: handler => {
            close_handlers.delete(handler);
        },
        close,
        set_title: title => {
            title_text.data = title;
        }
    };
};
//# sourceMappingURL=pane.js.map