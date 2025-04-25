import { make_viewer_desc } from "./compile.js"
import { Geometry, Scene } from "./desc.js"
import { add_scene_changed_handler, create_pane, remove_scene_changed_handler } from "./playground.js"
import { create_viewer } from "./viewer.js"

export const add_geometry_viewer = (scene: Scene, geometry: Geometry) => create_pane({}, pane => {
  pane.set_title('Geometry Viewer')
  const [canvas, update_viewer, resize_viewer] = create_viewer(pane.get_width(), pane.get_height())
  pane.add_resize_handler(resize_viewer)
  const load = () => update_viewer(make_viewer_desc(scene, geometry))
  add_scene_changed_handler(load)
  pane.add_close_handler(() => {
    remove_scene_changed_handler(load) })
  load()
  return canvas })