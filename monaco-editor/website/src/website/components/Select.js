var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { observer } from "mobx-react";
import * as React from "react";
import { Form } from "./bootstrap";
let Select = class Select extends React.Component {
    map = new Map();
    render() {
        const { value, values } = this.props;
        this.map.clear();
        const groups = this.renderGroups(values);
        const currentValue = value.get();
        return (<Form.Select value={currentValue && this.map.get(currentValue)} defaultValue={currentValue ? undefined : ""} onChange={(e) => {
                const newValue = e.currentTarget.value;
                const selected = [...this.map.entries()].find(([k, v]) => v === newValue);
                if (selected) {
                    value.set(selected[0]);
                }
            }} style={this.props.style} size="sm">
				<option value="" disabled hidden>
					Select an example...
				</option>
				{groups}
			</Form.Select>);
    }
    renderGroups(groups) {
        const { getLabel } = this.props;
        return groups.map((g, idx) => {
            if (typeof g === "object" && g && "groupTitle" in g) {
                return (<optgroup label={g.groupTitle} key={idx}>
						{this.renderGroups(g.items)}
					</optgroup>);
            }
            else {
                let id = this.map.get(g);
                if (!id) {
                    id = `${this.map.size + 1}`;
                    this.map.set(g, id);
                }
                return (<option key={idx} value={id}>
						{getLabel(g)}
					</option>);
            }
        });
    }
};
Select = __decorate([
    observer
], Select);
export { Select };
//# sourceMappingURL=Select.js.map