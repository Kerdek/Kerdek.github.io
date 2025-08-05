Object.assign(self, await import('./script_editor.js'))
Object.assign(self, await import('./compile.js'))
Object.assign(self, await import('./viewer.js'))
Object.assign(self, await import('./dom.js'))
Object.assign(self, await import('./goni.js'))
Object.assign(self, await import('./material_viewer.js'))
Object.assign(self, await import('./microsurface_viewer.js'))

ui.add_menu_pane({
  name: "Script Editor",
  handler: add_script_editor })

const notes = await (await fetch('./scripts/notes.js')).text()

add_script_editor(notes)