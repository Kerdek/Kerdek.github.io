// import { make_geometry_viewer_desc } from "./compile.js"
// import { PaneUser, add_scene_changed_handler, create_pane, remove_scene_changed_handler, rep } from "./playground.js"
// import { create_viewer } from "./viewer.js"

// const { Error } = self

// export const add_geometry_viewer = (name: string): PaneUser => {
// const [canvas, update_viewer, resize_viewer] = create_viewer(640, 480)
// const [pane, user] = create_pane(canvas, { autosize: true })
// pane.set_title(`Geometry Viewer (${name})`)
// pane.add_resize_handler(resize_viewer)
// const load = async () => {
//   const geometry = rep.geometry[name]
//   if (!geometry) {
//     throw new Error('Specified geometry not found.') }
//   update_viewer(make_geometry_viewer_desc(rep, geometry)) }
// add_scene_changed_handler(load)
// pane.add_close_handler(() => {
//   remove_scene_changed_handler(load) })
// load()
// return user }