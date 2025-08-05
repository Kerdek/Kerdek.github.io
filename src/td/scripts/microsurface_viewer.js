import { html_element } from "./dom.js";
import { make_microsurface_viewer_desc } from "./compile.js";
import { create_viewer } from "./viewer.js";
export const add_microsurface_viewer = () => {
    const elem = html_element('div', function () {
        this.style.width = '100%';
        this.style.height = '100%';
    }, []);
    const update = create_viewer(elem);
    const [pane, user] = ui.create_pane(elem, {
        size: [400, 400]
    });
    pane.set_title('Microsurface Viewer');
    return {
        ...user,
        refresh: sdf => update(make_microsurface_viewer_desc(sdf))
    };
};
//# sourceMappingURL=microsurface_viewer.js.map