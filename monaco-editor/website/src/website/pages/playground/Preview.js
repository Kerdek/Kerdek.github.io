var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as React from "react";
import { observer } from "mobx-react";
import { observable, reaction } from "mobx";
import { Button } from "react-bootstrap";
let Preview = class Preview extends React.Component {
    disposables = [];
    counter = 0;
    currentState;
    iframe = null;
    render() {
        return (<div className="preview">
				{this.currentState ? null : (<div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
						<div>
							Load{" "}
							<Button type="button" className={"btn settings bi-arrow-clockwise btn-primary"} style={{
                    fontSize: 20,
                    padding: "0px 4px",
                }} onClick={() => this.props.model.reload()}/>
						</div>
					</div>)}
				<iframe className="full-iframe" key={this.counter} sandbox="allow-scripts allow-modals" frameBorder={0} ref={this.handleIframe} src="./playgroundRunner.html"/>
			</div>);
    }
    handleIframe = (iframe) => {
        this.iframe = iframe;
        if (!iframe) {
            return;
        }
        iframe.addEventListener("load", () => {
            if (!this.currentState) {
                return;
            }
            const message = {
                kind: "initialize",
                state: this.currentState,
            };
            iframe.contentWindow.postMessage(message, {
                targetOrigin: "*",
            });
        });
        window.addEventListener("message", (e) => {
            if (e.source !== iframe.contentWindow) {
                return;
            }
            const data = e.data;
            if (data.kind === "update-code-string") {
                this.props.model.setCodeString(data.codeStringName, data.value);
            }
            else if (data.kind === "reload") {
                this.props.model.reload();
            }
        });
    };
    componentDidMount() {
        this.disposables.push({
            dispose: reaction(() => this.props.getPreviewState(), (state) => {
                if (state) {
                    console.log("handlePreview", state);
                    this.handlePreview(state);
                }
            }, { fireImmediately: true }),
        });
    }
    componentWillUnmount() {
        this.disposables.forEach((d) => d.dispose());
    }
    handlePreview(state) {
        if (JSON.stringify({ ...state, css: "" }) ===
            JSON.stringify({ ...this.currentState, css: "" })) {
            // only css changed
            this.iframe?.contentWindow.postMessage({ kind: "update-css", css: state.css }, { targetOrigin: "*" });
            this.currentState = state;
        }
        else {
            this.currentState = state;
            this.counter++;
        }
    }
};
__decorate([
    observable
], Preview.prototype, "counter", void 0);
__decorate([
    observable.ref
], Preview.prototype, "currentState", void 0);
Preview = __decorate([
    observer
], Preview);
export { Preview };
//# sourceMappingURL=Preview.js.map