import { make_geometry_viewer_desc } from "./compile.js";
import { create_viewer } from "./viewer.js";
export const add_geometry_viewer = (geometry) => {
    const [canvas, update_viewer, _resize_viewer] = create_viewer();
    const [pane, user] = ui.create_pane(canvas, { auto_size: true });
    pane.set_title(`Geometry Viewer`);
    update_viewer(make_geometry_viewer_desc(geometry));
    return user;
};
//# sourceMappingURL=geometry_viewer.js.map