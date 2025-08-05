import { html_element } from "./dom.js"
import { make_material_viewer_desc } from "./compile.js"
import { Material } from "./rep.js"
import { create_viewer } from "./viewer.js"

type MaterialViewerUser = PaneUser & { refresh: (material: Material) => void }

export const add_material_viewer = (): MaterialViewerUser => {
const elem = html_element('div', function() {
  this.style.width = '100%'
  this.style.height = '100%' }, [])
const update = create_viewer(elem)
const [pane, user] = ui.create_pane(
  elem, {
  size: [400, 400] })
pane.set_title('Material Viewer')
return {
  ...user,
  refresh: material => update(make_material_viewer_desc(material)) } }
