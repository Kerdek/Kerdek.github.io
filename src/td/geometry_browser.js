import { e, t } from "./dom.js";
import { for_each } from "./iterate.js";
import { add_geometry_viewer } from "./geometry_viewer.js";
import { add_scene_changed_handler, context_menu, create_pane, remove_scene_changed_handler, scene_changed } from "./playground.js";
export const add_geometry_browser = (scene) => create_pane({}, pane => {
    pane.set_title('Geometry Browser');
    const list = e('div', function () { }, []);
    const elem = e('div', function () { }, [list]);
    const load = () => {
        list.innerHTML = '';
        for_each(scene.geometry, (name, geometry) => {
            const elem = e('div', function () {
                this.style.userSelect = 'none';
                this.style.cursor = 'pointer';
                this.addEventListener('mouseenter', () => {
                    this.style.background = "white";
                    this.style.color = "black";
                });
                this.addEventListener('mouseleave', () => {
                    this.style.removeProperty("background");
                    this.style.removeProperty("color");
                });
                this.addEventListener('pointerdown', e => {
                    if (e.button === 2) {
                        context_menu(e.clientX, e.clientY, [{
                                type: 'text',
                                label: 'View',
                                handler: () => add_geometry_viewer(scene, geometry)
                            },
                            {
                                type: 'text',
                                label: 'Delete',
                                handler: () => {
                                    delete scene.geometry[name];
                                    scene_changed();
                                }
                            }]);
                    }
                });
            }, [
                t(name)
            ]);
            list.appendChild(elem);
        });
    };
    add_scene_changed_handler(load);
    pane.add_close_handler(() => {
        remove_scene_changed_handler(load);
    });
    load();
    return elem;
});
//# sourceMappingURL=geometry_browser.js.map