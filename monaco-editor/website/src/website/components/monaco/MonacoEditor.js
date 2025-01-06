var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as React from "react";
import { getLoadedMonaco } from "../../../monaco-loader";
import { withLoadedMonaco } from "./MonacoLoader";
let ControlledMonacoEditor = class ControlledMonacoEditor extends React.Component {
    model = getLoadedMonaco().editor.createModel(this.props.value, this.props.language);
    lastSubscription;
    componentDidUpdate(lastProps) {
        const newOnDidValueChange = this.props.onDidValueChange;
        if (newOnDidValueChange !== lastProps.onDidValueChange) {
            if (this.lastSubscription) {
                this.lastSubscription.dispose();
                this.lastSubscription = undefined;
            }
            if (newOnDidValueChange) {
                this.lastSubscription = this.model.onDidChangeContent((e) => {
                    newOnDidValueChange(this.model.getValue());
                });
            }
        }
        if (this.props.value !== this.model.getValue()) {
            this.model.setValue(this.props.value);
        }
        if (this.model.getLanguageId() !== this.props.language) {
            getLoadedMonaco().editor.setModelLanguage(this.model, this.props.language || "plaintext");
        }
        if (this.props.onDidValueChange) {
            this.model.setValue(this.props.value);
        }
    }
    render() {
        return (<MonacoEditor readOnly={!this.props.onDidValueChange} model={this.model} theme={this.props.theme}/>);
    }
};
ControlledMonacoEditor = __decorate([
    withLoadedMonaco
], ControlledMonacoEditor);
export { ControlledMonacoEditor };
let ControlledMonacoDiffEditor = class ControlledMonacoDiffEditor extends React.Component {
    originalModel = getLoadedMonaco().editor.createModel(this.props.originalValue, this.props.language);
    modifiedModel = getLoadedMonaco().editor.createModel(this.props.modifiedValue, this.props.language);
    componentDidUpdate() {
        if (this.props.originalValue !== this.originalModel.getValue()) {
            this.originalModel.setValue(this.props.originalValue);
        }
        if (this.originalModel.getLanguageId() !== this.props.language) {
            getLoadedMonaco().editor.setModelLanguage(this.originalModel, this.props.language || "plaintext");
        }
        if (this.props.modifiedValue !== this.modifiedModel.getValue()) {
            this.modifiedModel.setValue(this.props.modifiedValue);
        }
        if (this.modifiedModel.getLanguageId() !== this.props.language) {
            getLoadedMonaco().editor.setModelLanguage(this.modifiedModel, this.props.language || "plaintext");
        }
    }
    render() {
        return (<MonacoDiffEditor originalModel={this.originalModel} modifiedModel={this.modifiedModel}/>);
    }
};
ControlledMonacoDiffEditor = __decorate([
    withLoadedMonaco
], ControlledMonacoDiffEditor);
export { ControlledMonacoDiffEditor };
let MonacoEditor = class MonacoEditor extends React.Component {
    editor;
    get height() {
        if (this.state.contentHeight === undefined) {
            return undefined;
        }
        return Math.min(200, this.state.contentHeight);
    }
    divRef = React.createRef();
    resizeObserver = new ResizeObserver(() => {
        if (this.editor) {
            this.editor.layout();
        }
    });
    constructor(props) {
        super(props);
        this.state = { contentHeight: undefined };
    }
    render() {
        const heightInfo = this.props.height || { kind: "fill" };
        const height = heightInfo.kind === "fill" ? "100%" : this.height;
        return (<div style={{
                height,
                minHeight: 0,
                minWidth: 0,
            }} className={"monaco-editor-react " + this.props.className} ref={this.divRef}/>);
    }
    componentDidMount() {
        const div = this.divRef.current;
        if (!div) {
            throw new Error("unexpected");
        }
        this.resizeObserver.observe(div);
        this.editor = getLoadedMonaco().editor.create(div, {
            model: this.props.model,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            automaticLayout: false,
            theme: this.props.theme,
            readOnly: this.props.readOnly,
        });
        this.editor.onDidContentSizeChange((e) => {
            this.setState({ contentHeight: e.contentHeight });
        });
        if (this.props.onEditorLoaded) {
            this.props.onEditorLoaded(this.editor);
        }
    }
    componentDidUpdate(oldProps) {
        if (oldProps.model !== this.props.model) {
            this.editor.setModel(this.props.model);
        }
        if (oldProps.theme !== this.props.theme && this.props.theme) {
            getLoadedMonaco().editor.setTheme(this.props.theme);
        }
        if (oldProps.readOnly !== this.props.readOnly) {
            this.editor.updateOptions({ readOnly: this.props.readOnly });
        }
    }
    componentWillUnmount() {
        if (!this.editor) {
            console.error("unexpected state");
        }
        else {
            this.editor.dispose();
        }
    }
};
MonacoEditor = __decorate([
    withLoadedMonaco
], MonacoEditor);
export { MonacoEditor };
let MonacoDiffEditor = class MonacoDiffEditor extends React.Component {
    editor;
    divRef = React.createRef();
    resizeObserver = new ResizeObserver(() => {
        if (this.editor) {
            this.editor.layout();
        }
    });
    constructor(props) {
        super(props);
        this.state = { contentHeight: undefined };
    }
    render() {
        const height = "100%";
        return (<div style={{
                height,
                minHeight: 0,
                minWidth: 0,
            }} className="monaco-editor-react" ref={this.divRef}/>);
    }
    componentDidMount() {
        const div = this.divRef.current;
        if (!div) {
            throw new Error("unexpected");
        }
        this.resizeObserver.observe(div);
        this.editor = getLoadedMonaco().editor.createDiffEditor(div, {
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            automaticLayout: false,
            theme: this.props.theme,
            originalEditable: true,
        });
        this.editor.setModel({
            original: this.props.originalModel,
            modified: this.props.modifiedModel,
        });
        if (this.props.onEditorLoaded) {
            this.props.onEditorLoaded(this.editor);
        }
    }
    componentWillUnmount() {
        if (!this.editor) {
            console.error("unexpected state");
        }
        else {
            this.editor.dispose();
        }
    }
};
MonacoDiffEditor = __decorate([
    withLoadedMonaco
], MonacoDiffEditor);
export { MonacoDiffEditor };
//# sourceMappingURL=MonacoEditor.js.map