var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { observable } from "mobx";
import { Page } from "../components/Page";
import { HistoryController, } from "../utils/ObservableHistory";
import * as React from "react";
export class DocsPage extends React.Component {
    _lastIFrame = null;
    setIFrame = (iframe) => {
        if (iframe === this._lastIFrame) {
            return;
        }
        if (this._lastIFrame) {
            this._lastIFrame.contentWindow?.removeEventListener("hashchange", this.onIFrameLoad);
            this._lastIFrame.removeEventListener("load", this.onIFrameLoad);
        }
        if (iframe) {
            iframe.addEventListener("load", this.onIFrameLoad);
        }
        this._lastIFrame = iframe;
    };
    onIFrameLoad = () => {
        this._lastIFrame.contentWindow?.addEventListener("hashchange", () => this.updateLocationFromIFrame());
        this.updateLocationFromIFrame();
    };
    updateLocationFromIFrame() {
        const match = this._lastIFrame?.contentWindow.location.href.match(/typedoc\/(.*)/);
        if (match) {
            let hashValue = match[1];
            if (hashValue === "index.html") {
                hashValue = "";
            }
            this.location = { hashValue, searchParams: {} };
        }
    }
    location;
    historyId = 0;
    getTypedocUrl() {
        let hashValue = this.location?.hashValue ?? "";
        // make sure hashValue is a valid path
        if (!hashValue.match(/^[a-zA-Z0-9#\._\-\/]*$/) ||
            hashValue.indexOf("..") !== -1) {
            hashValue = "";
        }
        return `./typedoc/${hashValue}`;
    }
    updateLocation(newLocation) {
        this.location = newLocation;
        if (this._lastIFrame) {
            this._lastIFrame.src = this.getTypedocUrl();
        }
    }
    constructor(props) {
        super(props);
        new HistoryController((location) => {
            this.location = location;
            return this;
        });
    }
    // not reactive to prevent unnecessary reloads of the iframe
    render() {
        if (!localStorage.getItem("tsd-theme")) {
            // Set default theme to light, unfortunately there is no config option for this
            localStorage.setItem("tsd-theme", "light");
        }
        return (<Page>
				<iframe ref={this.setIFrame} className="full-iframe" frameBorder={0} src={this.getTypedocUrl()}/>
			</Page>);
    }
}
__decorate([
    observable.ref
], DocsPage.prototype, "location", void 0);
//# sourceMappingURL=DocsPage.js.map