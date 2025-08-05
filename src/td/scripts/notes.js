const sdf = `
float v = 2.0 + (sin(p.x) + sin(p.y));
return 0.5 * (p.z + 0.1 * v);`

// const { refresh } = add_microsurface_viewer()

// refresh(sdf)

const divisions = 5
const g = measure_surface(1 << 22, divisions, sdf)

// out(g)

const box = html_element('div', function() {
  this.style.width = '100%'
  this.style.height = '100%' }, [])

const update = create_viewer(box)

update(make_measured_material_viewer_desc(divisions, g))

const [vp, vu] = ui.create_pane(box)

vp.set_title('Measured Surface Viewer')
