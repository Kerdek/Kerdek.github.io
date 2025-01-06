var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { observer } from "mobx-react";
import * as React from "react";
import { hotComponent } from "../../utils/hotComponent";
import { PlaygroundModel } from "./PlaygroundModel";
import { PlaygroundPageContent } from "./PlaygroundPageContent";
import { withLoader } from "../../components/Loader";
import { getNpmVersions } from "./getNpmVersionsSync";
let PlaygroundPage = class PlaygroundPage extends React.Component {
    model = new PlaygroundModel();
    componentWillUnmount() {
        this.model.dispose();
    }
    render() {
        return <PlaygroundPageContent model={this.model}/>;
    }
};
PlaygroundPage = __decorate([
    withLoader(async () => {
        const search = new URLSearchParams(window.location.search);
        if (search.get("source") === "latest-dev" ||
            search.get("compareWith") === "latest-dev") {
            // So that the source class can resolve that value
            await getNpmVersions();
        }
    }),
    hotComponent(module),
    observer
], PlaygroundPage);
export { PlaygroundPage };
//# sourceMappingURL=PlaygroundPage.js.map