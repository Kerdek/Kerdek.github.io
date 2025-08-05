import { Geometry, Material, Scene } from "./desc.js"
import { e, t } from "./dom.js"
import { add_geometry_viewer } from "./geometry_viewer.js"
import { add_material_viewer } from "./material_viewer.js"
import { axis_angle, identity, mmul, scale, skew, translate } from "./matrix.js"
import { Vars, context_menu, create_pane, scene_changed } from "./playground.js"

const include = (type: string, src: string) => new Promise(cb => {
const js = document.createElement('script')
js.src = src
js.type = type
js.addEventListener('load', cb)
document.head.appendChild(js) })

await include('text/javascript', '../monaco/vs/loader.js')
require.config({ paths: { vs: new URL(`${document.documentURI}/../../monaco/vs`).toString() } })
await new Promise(cb => require(['vs/editor/editor.main'], cb))

monaco.editor.setTheme('hc-black')

const editor_config: monaco.editor.IStandaloneEditorConstructionOptions = {
  matchBrackets: "always",
  fontSize: 13,
  language: 'javascript',
  inlineSuggest: { enabled: false },
  quickSuggestions: false,
  minimap: {
      enabled: false },
  fontFamily: 'CMU Typewriter Text',
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true }

const lib = {
  identity,
  translate,
  scale,
  skew,
  axis_angle,
  mmul }

export const add_script_editor = (scene: Scene, global: Vars, text: string, name: string) => create_pane({}, pane => {
  const window_lib = {
    create_pane,
    geometry_viewer: (geometry: Geometry) => { add_geometry_viewer(scene, geometry) },
    material_viewer: (material: Material) => { add_material_viewer(material) } }

  const local: Vars = {}
  pane.set_title(`Script Editor (${name})`)
  const input = e('div', function () {
    this.style.height = '70%' }, [])
  const editor = monaco.editor.create(input, editor_config)
  const model = editor.getModel()
  if (!model) {
    throw new Error("No text model in script editor.") }
  model.setValue(text)
  const print = (m: string) => {
    output.appendChild(t(`${m}\n`)) }
  const run = () => {
    try {
      new Function("scene", "lib", "window", "global", "print", model.getValue()).apply(local, [scene, lib, window_lib, global, print]) }
    catch (e) {
      if (e instanceof Error) {
        output.appendChild(t(e.message)) } }
    scene_changed() }
  input.addEventListener('keydown', e => {
    if (e.key === 'F4') {
      output.innerHTML = ''
      run() } })
  const output = e('div', function () {
    this.style.borderTopColor = 'white'
    this.style.borderTopStyle = 'solid'
    this.style.borderTopWidth = '1px'
    this.style.whiteSpace = 'pre-wrap'
    this.style.flexGrow = '1'
    this.style.flexShrink = '1' }, [])
  const all = e('div', function() {
    this.style.height = '100%'
    this.style.display = 'flex'
    this.style.flexDirection = 'column'

    this.addEventListener('pointerdown', e => {
      if (e.button === 2) {
        context_menu(e.clientX, e.clientY, [{
          type: 'text',
          label: 'Run',
          handler: run },
        {
          type: 'separator' },
        {
          type: 'text',
          label: 'Save',
          handler: () => {
            scene.scripts[name] = model.getValue() } }]) } })}, [
    input,
    output])
  return all })
