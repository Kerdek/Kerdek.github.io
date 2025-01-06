import { observer } from "mobx-react";
import * as React from "react";
import { observable, runInAction } from "mobx";
const allComponents = new Map();
export function hotComponent(module) {
    return (component) => {
        const key = JSON.stringify({ id: module.id, name: component.name });
        let result = allComponents.get(key);
        if (!result) {
            result = observable({ component: component });
            allComponents.set(key, result);
        }
        else {
            setTimeout(() => {
                runInAction(`Update Component ${component.name}`, () => {
                    result.component = component;
                });
            }, 0);
        }
        const m = module;
        if (m.hot) {
            m.hot.accept(() => { });
        }
        return observer((props) => {
            const C = result.component;
            return <C {...props}/>;
        });
    };
}
//# sourceMappingURL=hotComponent.js.map