"use strict";
// import { make_material_viewer_desc } from "./compile.js"
// import { PaneUser, add_scene_changed_handler, create_pane, remove_scene_changed_handler, rep } from "./playground.js"
// import { create_viewer } from "./viewer.js"
// const { Error } = self
// export const add_material_viewer = (name: string): PaneUser => {
// const [viewer, update_viewer, resize_viewer] = create_viewer(400, 400)
// const [pane, user] = create_pane(viewer, { autosize: true })
// pane.set_title('Material Viewer')
// pane.add_resize_handler(resize_viewer)
// const load = async () => {
//   const m = rep.materials[name]
//   if (!m) {
//     throw new Error("Specified material not found.") }
//   update_viewer(make_material_viewer_desc(rep, m)) }
// add_scene_changed_handler(load)
// pane.add_close_handler(() => {
//   remove_scene_changed_handler(load) })
// load()
// return user }
//# sourceMappingURL=material_viewer.js.map