var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { autorun } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { ButtonGroup, FormCheck } from "react-bootstrap";
import { getLoadedMonaco } from "../../../monaco-loader";
import { Page } from "../../components/Page";
import { Select } from "../../components/Select";
import { Button, Col, Row, Stack } from "../../components/bootstrap";
import { MonacoEditor, } from "../../components/monaco/MonacoEditor";
import { withLoadedMonaco } from "../../components/monaco/MonacoLoader";
import { monacoEditorVersion } from "../../monacoEditorVersion";
import { hotComponent } from "../../utils/hotComponent";
import { ref } from "../../utils/ref";
import { Preview } from "./Preview";
import { SettingsDialog } from "./SettingsDialog";
import { getNpmVersionsSync } from "./getNpmVersionsSync";
import { getPlaygroundExamples } from "./playgroundExamples";
let PlaygroundPageContent = class PlaygroundPageContent extends React.Component {
    render() {
        const model = this.props.model;
        return (<Page>
				<SettingsDialog model={model}/>
				<div className="p-2" style={{ height: "100%" }}>
					<Row className="h-100 g-2" style={{ flexWrap: "wrap-reverse" }}>
						{model.wasEverNonFullScreen && (<Col md className={model.previewShouldBeFullScreen
                    ? "d-none"
                    : ""}>
								<Vertical>
									<div style={{ flex: 1 }}>
										<LabeledEditor label="JavaScript" titleBarItems={<div className="hstack" style={{
                        marginLeft: "auto",
                    }}>
													<span style={{
                        marginRight: 8,
                    }}>
														Example:
													</span>
													<Select values={getPlaygroundExamples().map((e) => ({
                        groupTitle: e.chapterTitle,
                        items: e.examples,
                    }))} value={ref(model, "selectedExample")} getLabel={(i) => i.title}/>
												</div>}>
											<Editor language={"javascript"} value={ref(model, "js")}/>
										</LabeledEditor>
									</div>

									<div>
										<LabeledEditor label="HTML">
											<Editor height={{
                    kind: "dynamic",
                    maxHeight: 200,
                }} language={"html"} value={ref(model, "html")}/>
										</LabeledEditor>
									</div>

									<div>
										<LabeledEditor label="CSS">
											<Editor height={{
                    kind: "dynamic",
                    maxHeight: 200,
                }} language={"css"} value={ref(model, "css")}/>
										</LabeledEditor>
									</div>
								</Vertical>
							</Col>)}
						<Col md style={{ display: "flex", flexDirection: "column" }}>
							<LabeledEditor label={`Preview${model.historyModel.compareWith &&
                model.historyModel.sourceOverride
                ? " " +
                    model.historyModel.sourceOverride.toString()
                : ""}:`} titleBarItems={<div style={{ marginLeft: "auto" }} className="d-flex gap-2 align-items-center">
										{model.previewShouldBeFullScreen || (<FormCheck label="Auto-Reload" className="text-nowrap" checked={model.settings.autoReload} onChange={(e) => {
                        model.settings.autoReload =
                            e.target.checked;
                        if (e.target.checked &&
                            model.isDirty) {
                            model.reload();
                        }
                    }}/>)}
										<Button type="button" className={"btn settings bi-arrow-clockwise " +
                    (model.isDirty
                        ? "btn-primary"
                        : "btn-light")} style={{
                    fontSize: 20,
                    padding: "0px 4px",
                }} onClick={() => model.reload()}/>

										<Button type="button" active={model.settings.previewFullScreen} className="btn btn-light settings bi-arrows-fullscreen" style={{
                    fontSize: 20,
                    padding: "0px 4px",
                }} onClick={() => (model.settings.previewFullScreen =
                    !model.settings
                        .previewFullScreen)}/>

										{!model.historyModel.compareWith ? (model.historyModel
                    .sourceOverride ? (<ButtonGroup>
													<button type="button" className="btn btn-primary" onClick={() => model.historyModel.disableSourceOverride()}>
														Disable{" "}
														{model.historyModel
                        .sourceOverride
                        .version ??
                        "url"}{" "}
														override
													</button>
													<button type="button" className="btn btn-secondary" onClick={() => model.compareWithLatestDev()}>
														Compare with latest dev
													</button>
													<button type="button" className="btn btn-secondary" onClick={() => model.historyModel.saveSourceOverride()}>
														Save
													</button>
												</ButtonGroup>) : (<>
													<VersionSelector model={model}/>

													<button type="button" className="btn btn-light settings bi-gear" style={{
                        fontSize: 20,
                        padding: "0px 4px",
                    }} onClick={() => model.showSettingsDialog()}/>
												</>)) : (<ButtonGroup>
												<button type="button" className="btn btn-primary" onClick={() => model.historyModel.exitCompare()}>
													Exit Compare
												</button>
											</ButtonGroup>)}
									</div>}>
								<Preview model={model} getPreviewState={model.getPreviewState}/>
							</LabeledEditor>
							{model.historyModel.compareWith && (<>
									<div style={{ height: "10px" }}/>
									<LabeledEditor label={`Preview ${model.historyModel.compareWith.toString()}:`} titleBarItems={<div style={{ marginLeft: "auto" }} className="d-flex gap-2 align-items-center">
												<ButtonGroup>
													<button type="button" className="btn btn-primary" onClick={() => model.historyModel.saveCompareWith()}>
														Save
													</button>
												</ButtonGroup>
											</div>}>
										<Preview model={model} getPreviewState={model.getCompareWithPreviewState}/>
									</LabeledEditor>
								</>)}
						</Col>
					</Row>
				</div>
			</Page>);
    }
};
PlaygroundPageContent = __decorate([
    hotComponent(module),
    observer
], PlaygroundPageContent);
export { PlaygroundPageContent };
let VersionSelector = class VersionSelector extends React.Component {
    render() {
        const model = this.props.model;
        if (model.settings.settings.monacoSource !== "npm" &&
            model.settings.settings.monacoSource !== "latest") {
            return null;
        }
        const latestValue = "latest";
        const versions = [latestValue].concat(getNpmVersionsSync(model.settings.settings.npmVersion));
        return (<Stack direction="horizontal" gap={2}>
				<Select values={versions} getLabel={(i) => i === latestValue
                ? `latest stable (${monacoEditorVersion})`
                : `${i}${{
                    ["undefined"]: "",
                    ["true"]: " ✓",
                    ["false"]: " ✗",
                }["" + model.bisectModel.getState(i)]}`} value={{
                get() {
                    if (model.settings.settings.monacoSource ===
                        "latest") {
                        return latestValue;
                    }
                    return model.settings.settings.npmVersion;
                },
                set(value) {
                    if (value === latestValue) {
                        model.settings.setSettings({
                            ...model.settings.settings,
                            monacoSource: "latest",
                        });
                    }
                    else {
                        model.settings.setSettings({
                            ...model.settings.settings,
                            monacoSource: "npm",
                            npmVersion: value,
                        });
                    }
                },
            }}/>
				{model.bisectModel.isActive && (<ButtonGroup>
						<Button type="button" className={"btn bi-github settings" +
                    (model.bisectModel.isFinished
                        ? " btn-success"
                        : " btn-light")} style={{
                    fontSize: 14,
                    margin: 0,
                    padding: 4,
                    minWidth: 46,
                    whiteSpace: "nowrap",
                }} onClick={() => model.bisectModel.openGithub()} title={`Bisect active, ${model.bisectModel.steps} steps or less remaining. Click here to show changes.`}>
							{" "}
							{model.bisectModel.steps}
						</Button>
						<Button type="button" className="btn btn-light settings bi-skip-start" style={{
                    fontSize: 20,
                    margin: 0,
                    padding: 0,
                }} onClick={() => model.bisectModel.reset()} title="Reset bisect"/>
					</ButtonGroup>)}

				<ButtonGroup>
					<Button type="button" className="btn btn-light settings bi-check" style={{
                fontSize: 20,
                margin: 0,
                padding: 0,
            }} disabled={model.settings.settings.monacoSource !== "npm"} active={model.bisectModel.getState(model.settings.settings.npmVersion) === true} onClick={() => model.bisectModel.toggleState(model.settings.settings.npmVersion, true)} title="Mark version as working (for bisect)"/>
					<Button type="button" className="btn btn-light settings bi-x" style={{
                fontSize: 20,
                margin: 0,
                padding: 0,
            }} disabled={model.settings.settings.monacoSource !== "npm"} active={model.bisectModel.getState(model.settings.settings.npmVersion) === false} onClick={() => model.bisectModel.toggleState(model.settings.settings.npmVersion, false)} title="Mark version as broken (for bisect)"/>
				</ButtonGroup>
			</Stack>);
    }
};
VersionSelector = __decorate([
    observer
], VersionSelector);
export { VersionSelector };
export class LabeledEditor extends React.Component {
    render() {
        return (<Vertical>
				<Horizontal style={{ height: undefined, marginBottom: 6 }}>
					<div style={{ margin: "5px 10px" }}>{this.props.label}</div>
					{this.props.titleBarItems}
				</Horizontal>
				<div style={{ flex: 1 }}>{this.props.children}</div>
			</Vertical>);
    }
}
let Editor = class Editor extends React.Component {
    editor = undefined;
    disposables = [];
    model = getLoadedMonaco().editor.createModel(this.props.value.get(), this.props.language);
    render() {
        return (<MonacoEditor model={this.model} onEditorLoaded={(editor) => this.initializeEditor(editor)} height={this.props.height} className="editor-container"/>);
    }
    ignoreChange = false;
    initializeEditor(editor) {
        this.editor = editor;
        this.disposables.push(this.editor);
        this.disposables.push(this.editor.onDidChangeModelContent((e) => {
            this.ignoreChange = true;
            try {
                this.props.value.set(this.editor.getValue());
            }
            finally {
                this.ignoreChange = false;
            }
        }));
        this.disposables.push({
            dispose: autorun(() => {
                const value = this.props.value.get();
                if (!this.ignoreChange) {
                    this.model.pushEditOperations(null, [
                        {
                            range: this.model.getFullModelRange(),
                            text: value,
                        },
                    ], () => null);
                }
            }, { name: "update text" }),
        });
    }
    componentWillUnmount() {
        this.disposables.forEach((d) => d.dispose());
        this.model.dispose();
    }
};
Editor = __decorate([
    withLoadedMonaco
], Editor);
export function Vertical(props) {
    return (<div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            width: "100%",
            height: "100%",
        }}>
			{props.children}
		</div>);
}
export function Horizontal(props) {
    return (<div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            height: "100%",
            width: "100%",
            ...props.style,
        }}>
			{props.children}
		</div>);
}
//# sourceMappingURL=PlaygroundPageContent.js.map