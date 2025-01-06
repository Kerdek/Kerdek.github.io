/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { typescriptDefaults } from './monaco.contribution';
import { libFileSet } from './lib/lib.index';
import { editor, languages, Uri, Range, MarkerTag, MarkerSeverity } from '../../fillers/monaco-editor-core';
//#region utils copied from typescript to prevent loading the entire typescriptServices ---
var IndentStyle;
(function (IndentStyle) {
    IndentStyle[IndentStyle["None"] = 0] = "None";
    IndentStyle[IndentStyle["Block"] = 1] = "Block";
    IndentStyle[IndentStyle["Smart"] = 2] = "Smart";
})(IndentStyle || (IndentStyle = {}));
export function flattenDiagnosticMessageText(diag, newLine, indent = 0) {
    if (typeof diag === 'string') {
        return diag;
    }
    else if (diag === undefined) {
        return '';
    }
    let result = '';
    if (indent) {
        result += newLine;
        for (let i = 0; i < indent; i++) {
            result += '  ';
        }
    }
    result += diag.messageText;
    indent++;
    if (diag.next) {
        for (const kid of diag.next) {
            result += flattenDiagnosticMessageText(kid, newLine, indent);
        }
    }
    return result;
}
function displayPartsToString(displayParts) {
    if (displayParts) {
        return displayParts.map((displayPart) => displayPart.text).join('');
    }
    return '';
}
//#endregion
export class Adapter {
    _worker;
    constructor(_worker) {
        this._worker = _worker;
    }
    // protected _positionToOffset(model: editor.ITextModel, position: monaco.IPosition): number {
    // 	return model.getOffsetAt(position);
    // }
    // protected _offsetToPosition(model: editor.ITextModel, offset: number): monaco.IPosition {
    // 	return model.getPositionAt(offset);
    // }
    _textSpanToRange(model, span) {
        let p1 = model.getPositionAt(span.start);
        let p2 = model.getPositionAt(span.start + span.length);
        let { lineNumber: startLineNumber, column: startColumn } = p1;
        let { lineNumber: endLineNumber, column: endColumn } = p2;
        return { startLineNumber, startColumn, endLineNumber, endColumn };
    }
}
// --- lib files
export class LibFiles {
    _worker;
    _libFiles;
    _hasFetchedLibFiles;
    _fetchLibFilesPromise;
    constructor(_worker) {
        this._worker = _worker;
        this._libFiles = {};
        this._hasFetchedLibFiles = false;
        this._fetchLibFilesPromise = null;
    }
    isLibFile(uri) {
        if (!uri) {
            return false;
        }
        if (uri.path.indexOf('/lib.') === 0) {
            return !!libFileSet[uri.path.slice(1)];
        }
        return false;
    }
    getOrCreateModel(fileName) {
        const uri = Uri.parse(fileName);
        const model = editor.getModel(uri);
        if (model) {
            return model;
        }
        if (this.isLibFile(uri) && this._hasFetchedLibFiles) {
            return editor.createModel(this._libFiles[uri.path.slice(1)], 'typescript', uri);
        }
        const matchedLibFile = typescriptDefaults.getExtraLibs()[fileName];
        if (matchedLibFile) {
            return editor.createModel(matchedLibFile.content, 'typescript', uri);
        }
        return null;
    }
    _containsLibFile(uris) {
        for (let uri of uris) {
            if (this.isLibFile(uri)) {
                return true;
            }
        }
        return false;
    }
    async fetchLibFilesIfNecessary(uris) {
        if (!this._containsLibFile(uris)) {
            // no lib files necessary
            return;
        }
        await this._fetchLibFiles();
    }
    _fetchLibFiles() {
        if (!this._fetchLibFilesPromise) {
            this._fetchLibFilesPromise = this._worker()
                .then((w) => w.getLibFiles())
                .then((libFiles) => {
                this._hasFetchedLibFiles = true;
                this._libFiles = libFiles;
            });
        }
        return this._fetchLibFilesPromise;
    }
}
// --- diagnostics --- ---
var DiagnosticCategory;
(function (DiagnosticCategory) {
    DiagnosticCategory[DiagnosticCategory["Warning"] = 0] = "Warning";
    DiagnosticCategory[DiagnosticCategory["Error"] = 1] = "Error";
    DiagnosticCategory[DiagnosticCategory["Suggestion"] = 2] = "Suggestion";
    DiagnosticCategory[DiagnosticCategory["Message"] = 3] = "Message";
})(DiagnosticCategory || (DiagnosticCategory = {}));
export class DiagnosticsAdapter extends Adapter {
    _libFiles;
    _defaults;
    _selector;
    _disposables = [];
    _listener = Object.create(null);
    constructor(_libFiles, _defaults, _selector, worker) {
        super(worker);
        this._libFiles = _libFiles;
        this._defaults = _defaults;
        this._selector = _selector;
        const onModelAdd = (model) => {
            if (model.getLanguageId() !== _selector) {
                return;
            }
            const maybeValidate = () => {
                const { onlyVisible } = this._defaults.getDiagnosticsOptions();
                if (onlyVisible) {
                    if (model.isAttachedToEditor()) {
                        this._doValidate(model);
                    }
                }
                else {
                    this._doValidate(model);
                }
            };
            let handle;
            const changeSubscription = model.onDidChangeContent(() => {
                clearTimeout(handle);
                handle = window.setTimeout(maybeValidate, 500);
            });
            const visibleSubscription = model.onDidChangeAttached(() => {
                const { onlyVisible } = this._defaults.getDiagnosticsOptions();
                if (onlyVisible) {
                    if (model.isAttachedToEditor()) {
                        // this model is now attached to an editor
                        // => compute diagnostics
                        maybeValidate();
                    }
                    else {
                        // this model is no longer attached to an editor
                        // => clear existing diagnostics
                        editor.setModelMarkers(model, this._selector, []);
                    }
                }
            });
            this._listener[model.uri.toString()] = {
                dispose() {
                    changeSubscription.dispose();
                    visibleSubscription.dispose();
                    clearTimeout(handle);
                }
            };
            maybeValidate();
        };
        const onModelRemoved = (model) => {
            editor.setModelMarkers(model, this._selector, []);
            const key = model.uri.toString();
            if (this._listener[key]) {
                this._listener[key].dispose();
                delete this._listener[key];
            }
        };
        this._disposables.push(editor.onDidCreateModel((model) => onModelAdd(model)));
        this._disposables.push(editor.onWillDisposeModel(onModelRemoved));
        this._disposables.push(editor.onDidChangeModelLanguage((event) => {
            onModelRemoved(event.model);
            onModelAdd(event.model);
        }));
        this._disposables.push({
            dispose() {
                for (const model of editor.getModels()) {
                    onModelRemoved(model);
                }
            }
        });
        const recomputeDiagostics = () => {
            // redo diagnostics when options change
            for (const model of editor.getModels()) {
                onModelRemoved(model);
                onModelAdd(model);
            }
        };
        this._disposables.push(this._defaults.onDidChange(recomputeDiagostics));
        this._disposables.push(this._defaults.onDidExtraLibsChange(recomputeDiagostics));
        editor.getModels().forEach((model) => onModelAdd(model));
    }
    dispose() {
        this._disposables.forEach((d) => d && d.dispose());
        this._disposables = [];
    }
    async _doValidate(model) {
        const worker = await this._worker(model.uri);
        if (model.isDisposed()) {
            // model was disposed in the meantime
            return;
        }
        const promises = [];
        const { noSyntaxValidation, noSemanticValidation, noSuggestionDiagnostics } = this._defaults.getDiagnosticsOptions();
        if (!noSyntaxValidation) {
            promises.push(worker.getSyntacticDiagnostics(model.uri.toString()));
        }
        if (!noSemanticValidation) {
            promises.push(worker.getSemanticDiagnostics(model.uri.toString()));
        }
        if (!noSuggestionDiagnostics) {
            promises.push(worker.getSuggestionDiagnostics(model.uri.toString()));
        }
        const allDiagnostics = await Promise.all(promises);
        if (!allDiagnostics || model.isDisposed()) {
            // model was disposed in the meantime
            return;
        }
        const diagnostics = allDiagnostics
            .reduce((p, c) => c.concat(p), [])
            .filter((d) => (this._defaults.getDiagnosticsOptions().diagnosticCodesToIgnore || []).indexOf(d.code) ===
            -1);
        // Fetch lib files if necessary
        const relatedUris = diagnostics
            .map((d) => d.relatedInformation || [])
            .reduce((p, c) => c.concat(p), [])
            .map((relatedInformation) => relatedInformation.file ? Uri.parse(relatedInformation.file.fileName) : null);
        await this._libFiles.fetchLibFilesIfNecessary(relatedUris);
        if (model.isDisposed()) {
            // model was disposed in the meantime
            return;
        }
        editor.setModelMarkers(model, this._selector, diagnostics.map((d) => this._convertDiagnostics(model, d)));
    }
    _convertDiagnostics(model, diag) {
        const diagStart = diag.start || 0;
        const diagLength = diag.length || 1;
        const { lineNumber: startLineNumber, column: startColumn } = model.getPositionAt(diagStart);
        const { lineNumber: endLineNumber, column: endColumn } = model.getPositionAt(diagStart + diagLength);
        const tags = [];
        if (diag.reportsUnnecessary) {
            tags.push(MarkerTag.Unnecessary);
        }
        if (diag.reportsDeprecated) {
            tags.push(MarkerTag.Deprecated);
        }
        return {
            severity: this._tsDiagnosticCategoryToMarkerSeverity(diag.category),
            startLineNumber,
            startColumn,
            endLineNumber,
            endColumn,
            message: flattenDiagnosticMessageText(diag.messageText, '\n'),
            code: diag.code.toString(),
            tags,
            relatedInformation: this._convertRelatedInformation(model, diag.relatedInformation)
        };
    }
    _convertRelatedInformation(model, relatedInformation) {
        if (!relatedInformation) {
            return [];
        }
        const result = [];
        relatedInformation.forEach((info) => {
            let relatedResource = model;
            if (info.file) {
                relatedResource = this._libFiles.getOrCreateModel(info.file.fileName);
            }
            if (!relatedResource) {
                return;
            }
            const infoStart = info.start || 0;
            const infoLength = info.length || 1;
            const { lineNumber: startLineNumber, column: startColumn } = relatedResource.getPositionAt(infoStart);
            const { lineNumber: endLineNumber, column: endColumn } = relatedResource.getPositionAt(infoStart + infoLength);
            result.push({
                resource: relatedResource.uri,
                startLineNumber,
                startColumn,
                endLineNumber,
                endColumn,
                message: flattenDiagnosticMessageText(info.messageText, '\n')
            });
        });
        return result;
    }
    _tsDiagnosticCategoryToMarkerSeverity(category) {
        switch (category) {
            case DiagnosticCategory.Error:
                return MarkerSeverity.Error;
            case DiagnosticCategory.Message:
                return MarkerSeverity.Info;
            case DiagnosticCategory.Warning:
                return MarkerSeverity.Warning;
            case DiagnosticCategory.Suggestion:
                return MarkerSeverity.Hint;
        }
        return MarkerSeverity.Info;
    }
}
export class SuggestAdapter extends Adapter {
    get triggerCharacters() {
        return ['.'];
    }
    async provideCompletionItems(model, position, _context, token) {
        const wordInfo = model.getWordUntilPosition(position);
        const wordRange = new Range(position.lineNumber, wordInfo.startColumn, position.lineNumber, wordInfo.endColumn);
        const resource = model.uri;
        const offset = model.getOffsetAt(position);
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const info = await worker.getCompletionsAtPosition(resource.toString(), offset);
        if (!info || model.isDisposed()) {
            return;
        }
        const suggestions = info.entries.map((entry) => {
            let range = wordRange;
            if (entry.replacementSpan) {
                const p1 = model.getPositionAt(entry.replacementSpan.start);
                const p2 = model.getPositionAt(entry.replacementSpan.start + entry.replacementSpan.length);
                range = new Range(p1.lineNumber, p1.column, p2.lineNumber, p2.column);
            }
            const tags = [];
            if (entry.kindModifiers !== undefined && entry.kindModifiers.indexOf('deprecated') !== -1) {
                tags.push(languages.CompletionItemTag.Deprecated);
            }
            return {
                uri: resource,
                position: position,
                offset: offset,
                range: range,
                label: entry.name,
                insertText: entry.name,
                sortText: entry.sortText,
                kind: SuggestAdapter.convertKind(entry.kind),
                tags
            };
        });
        return {
            suggestions
        };
    }
    async resolveCompletionItem(item, token) {
        const myItem = item;
        const resource = myItem.uri;
        const position = myItem.position;
        const offset = myItem.offset;
        const worker = await this._worker(resource);
        const details = await worker.getCompletionEntryDetails(resource.toString(), offset, myItem.label);
        if (!details) {
            return myItem;
        }
        return {
            uri: resource,
            position: position,
            label: details.name,
            kind: SuggestAdapter.convertKind(details.kind),
            detail: displayPartsToString(details.displayParts),
            documentation: {
                value: SuggestAdapter.createDocumentationString(details)
            }
        };
    }
    static convertKind(kind) {
        switch (kind) {
            case Kind.primitiveType:
            case Kind.keyword:
                return languages.CompletionItemKind.Keyword;
            case Kind.variable:
            case Kind.localVariable:
                return languages.CompletionItemKind.Variable;
            case Kind.memberVariable:
            case Kind.memberGetAccessor:
            case Kind.memberSetAccessor:
                return languages.CompletionItemKind.Field;
            case Kind.function:
            case Kind.memberFunction:
            case Kind.constructSignature:
            case Kind.callSignature:
            case Kind.indexSignature:
                return languages.CompletionItemKind.Function;
            case Kind.enum:
                return languages.CompletionItemKind.Enum;
            case Kind.module:
                return languages.CompletionItemKind.Module;
            case Kind.class:
                return languages.CompletionItemKind.Class;
            case Kind.interface:
                return languages.CompletionItemKind.Interface;
            case Kind.warning:
                return languages.CompletionItemKind.File;
        }
        return languages.CompletionItemKind.Property;
    }
    static createDocumentationString(details) {
        let documentationString = displayPartsToString(details.documentation);
        if (details.tags) {
            for (const tag of details.tags) {
                documentationString += `\n\n${tagToString(tag)}`;
            }
        }
        return documentationString;
    }
}
function tagToString(tag) {
    let tagLabel = `*@${tag.name}*`;
    if (tag.name === 'param' && tag.text) {
        const [paramName, ...rest] = tag.text;
        tagLabel += `\`${paramName.text}\``;
        if (rest.length > 0)
            tagLabel += ` — ${rest.map((r) => r.text).join(' ')}`;
    }
    else if (Array.isArray(tag.text)) {
        tagLabel += ` — ${tag.text.map((r) => r.text).join(' ')}`;
    }
    else if (tag.text) {
        tagLabel += ` — ${tag.text}`;
    }
    return tagLabel;
}
export class SignatureHelpAdapter extends Adapter {
    signatureHelpTriggerCharacters = ['(', ','];
    static _toSignatureHelpTriggerReason(context) {
        switch (context.triggerKind) {
            case languages.SignatureHelpTriggerKind.TriggerCharacter:
                if (context.triggerCharacter) {
                    if (context.isRetrigger) {
                        return { kind: 'retrigger', triggerCharacter: context.triggerCharacter };
                    }
                    else {
                        return { kind: 'characterTyped', triggerCharacter: context.triggerCharacter };
                    }
                }
                else {
                    return { kind: 'invoked' };
                }
            case languages.SignatureHelpTriggerKind.ContentChange:
                return context.isRetrigger ? { kind: 'retrigger' } : { kind: 'invoked' };
            case languages.SignatureHelpTriggerKind.Invoke:
            default:
                return { kind: 'invoked' };
        }
    }
    async provideSignatureHelp(model, position, token, context) {
        const resource = model.uri;
        const offset = model.getOffsetAt(position);
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const info = await worker.getSignatureHelpItems(resource.toString(), offset, {
            triggerReason: SignatureHelpAdapter._toSignatureHelpTriggerReason(context)
        });
        if (!info || model.isDisposed()) {
            return;
        }
        const ret = {
            activeSignature: info.selectedItemIndex,
            activeParameter: info.argumentIndex,
            signatures: []
        };
        info.items.forEach((item) => {
            const signature = {
                label: '',
                parameters: []
            };
            signature.documentation = {
                value: displayPartsToString(item.documentation)
            };
            signature.label += displayPartsToString(item.prefixDisplayParts);
            item.parameters.forEach((p, i, a) => {
                const label = displayPartsToString(p.displayParts);
                const parameter = {
                    label: label,
                    documentation: {
                        value: displayPartsToString(p.documentation)
                    }
                };
                signature.label += label;
                signature.parameters.push(parameter);
                if (i < a.length - 1) {
                    signature.label += displayPartsToString(item.separatorDisplayParts);
                }
            });
            signature.label += displayPartsToString(item.suffixDisplayParts);
            ret.signatures.push(signature);
        });
        return {
            value: ret,
            dispose() { }
        };
    }
}
// --- hover ------
export class QuickInfoAdapter extends Adapter {
    async provideHover(model, position, token) {
        const resource = model.uri;
        const offset = model.getOffsetAt(position);
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const info = await worker.getQuickInfoAtPosition(resource.toString(), offset);
        if (!info || model.isDisposed()) {
            return;
        }
        const documentation = displayPartsToString(info.documentation);
        const tags = info.tags ? info.tags.map((tag) => tagToString(tag)).join('  \n\n') : '';
        const contents = displayPartsToString(info.displayParts);
        return {
            range: this._textSpanToRange(model, info.textSpan),
            contents: [
                {
                    value: '```typescript\n' + contents + '\n```\n'
                },
                {
                    value: documentation + (tags ? '\n\n' + tags : '')
                }
            ]
        };
    }
}
// --- occurrences ------
export class DocumentHighlightAdapter extends Adapter {
    async provideDocumentHighlights(model, position, token) {
        const resource = model.uri;
        const offset = model.getOffsetAt(position);
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const entries = await worker.getDocumentHighlights(resource.toString(), offset, [
            resource.toString()
        ]);
        if (!entries || model.isDisposed()) {
            return;
        }
        return entries.flatMap((entry) => {
            return entry.highlightSpans.map((highlightSpans) => {
                return {
                    range: this._textSpanToRange(model, highlightSpans.textSpan),
                    kind: highlightSpans.kind === 'writtenReference'
                        ? languages.DocumentHighlightKind.Write
                        : languages.DocumentHighlightKind.Text
                };
            });
        });
    }
}
// --- definition ------
export class DefinitionAdapter extends Adapter {
    _libFiles;
    constructor(_libFiles, worker) {
        super(worker);
        this._libFiles = _libFiles;
    }
    async provideDefinition(model, position, token) {
        const resource = model.uri;
        const offset = model.getOffsetAt(position);
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const entries = await worker.getDefinitionAtPosition(resource.toString(), offset);
        if (!entries || model.isDisposed()) {
            return;
        }
        // Fetch lib files if necessary
        await this._libFiles.fetchLibFilesIfNecessary(entries.map((entry) => Uri.parse(entry.fileName)));
        if (model.isDisposed()) {
            return;
        }
        const result = [];
        for (let entry of entries) {
            const refModel = this._libFiles.getOrCreateModel(entry.fileName);
            if (refModel) {
                result.push({
                    uri: refModel.uri,
                    range: this._textSpanToRange(refModel, entry.textSpan)
                });
            }
        }
        return result;
    }
}
// --- references ------
export class ReferenceAdapter extends Adapter {
    _libFiles;
    constructor(_libFiles, worker) {
        super(worker);
        this._libFiles = _libFiles;
    }
    async provideReferences(model, position, context, token) {
        const resource = model.uri;
        const offset = model.getOffsetAt(position);
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const entries = await worker.getReferencesAtPosition(resource.toString(), offset);
        if (!entries || model.isDisposed()) {
            return;
        }
        // Fetch lib files if necessary
        await this._libFiles.fetchLibFilesIfNecessary(entries.map((entry) => Uri.parse(entry.fileName)));
        if (model.isDisposed()) {
            return;
        }
        const result = [];
        for (let entry of entries) {
            const refModel = this._libFiles.getOrCreateModel(entry.fileName);
            if (refModel) {
                result.push({
                    uri: refModel.uri,
                    range: this._textSpanToRange(refModel, entry.textSpan)
                });
            }
        }
        return result;
    }
}
// --- outline ------
export class OutlineAdapter extends Adapter {
    async provideDocumentSymbols(model, token) {
        const resource = model.uri;
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const root = await worker.getNavigationTree(resource.toString());
        if (!root || model.isDisposed()) {
            return;
        }
        const convert = (item, containerLabel) => {
            const result = {
                name: item.text,
                detail: '',
                kind: (outlineTypeTable[item.kind] || languages.SymbolKind.Variable),
                range: this._textSpanToRange(model, item.spans[0]),
                selectionRange: this._textSpanToRange(model, item.spans[0]),
                tags: [],
                children: item.childItems?.map((child) => convert(child, item.text)),
                containerName: containerLabel
            };
            return result;
        };
        // Exclude the root node, as it alwas spans the entire document.
        const result = root.childItems ? root.childItems.map((item) => convert(item)) : [];
        return result;
    }
}
export class Kind {
    static unknown = '';
    static keyword = 'keyword';
    static script = 'script';
    static module = 'module';
    static class = 'class';
    static interface = 'interface';
    static type = 'type';
    static enum = 'enum';
    static variable = 'var';
    static localVariable = 'local var';
    static function = 'function';
    static localFunction = 'local function';
    static memberFunction = 'method';
    static memberGetAccessor = 'getter';
    static memberSetAccessor = 'setter';
    static memberVariable = 'property';
    static constructorImplementation = 'constructor';
    static callSignature = 'call';
    static indexSignature = 'index';
    static constructSignature = 'construct';
    static parameter = 'parameter';
    static typeParameter = 'type parameter';
    static primitiveType = 'primitive type';
    static label = 'label';
    static alias = 'alias';
    static const = 'const';
    static let = 'let';
    static warning = 'warning';
}
let outlineTypeTable = Object.create(null);
outlineTypeTable[Kind.module] = languages.SymbolKind.Module;
outlineTypeTable[Kind.class] = languages.SymbolKind.Class;
outlineTypeTable[Kind.enum] = languages.SymbolKind.Enum;
outlineTypeTable[Kind.interface] = languages.SymbolKind.Interface;
outlineTypeTable[Kind.memberFunction] = languages.SymbolKind.Method;
outlineTypeTable[Kind.memberVariable] = languages.SymbolKind.Property;
outlineTypeTable[Kind.memberGetAccessor] = languages.SymbolKind.Property;
outlineTypeTable[Kind.memberSetAccessor] = languages.SymbolKind.Property;
outlineTypeTable[Kind.variable] = languages.SymbolKind.Variable;
outlineTypeTable[Kind.const] = languages.SymbolKind.Variable;
outlineTypeTable[Kind.localVariable] = languages.SymbolKind.Variable;
outlineTypeTable[Kind.variable] = languages.SymbolKind.Variable;
outlineTypeTable[Kind.function] = languages.SymbolKind.Function;
outlineTypeTable[Kind.localFunction] = languages.SymbolKind.Function;
// --- formatting ----
export class FormatHelper extends Adapter {
    static _convertOptions(options) {
        return {
            ConvertTabsToSpaces: options.insertSpaces,
            TabSize: options.tabSize,
            IndentSize: options.tabSize,
            IndentStyle: IndentStyle.Smart,
            NewLineCharacter: '\n',
            InsertSpaceAfterCommaDelimiter: true,
            InsertSpaceAfterSemicolonInForStatements: true,
            InsertSpaceBeforeAndAfterBinaryOperators: true,
            InsertSpaceAfterKeywordsInControlFlowStatements: true,
            InsertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
            InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
            InsertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
            InsertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
            PlaceOpenBraceOnNewLineForControlBlocks: false,
            PlaceOpenBraceOnNewLineForFunctions: false
        };
    }
    _convertTextChanges(model, change) {
        return {
            text: change.newText,
            range: this._textSpanToRange(model, change.span)
        };
    }
}
export class FormatAdapter extends FormatHelper {
    canFormatMultipleRanges = false;
    async provideDocumentRangeFormattingEdits(model, range, options, token) {
        const resource = model.uri;
        const startOffset = model.getOffsetAt({
            lineNumber: range.startLineNumber,
            column: range.startColumn
        });
        const endOffset = model.getOffsetAt({
            lineNumber: range.endLineNumber,
            column: range.endColumn
        });
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const edits = await worker.getFormattingEditsForRange(resource.toString(), startOffset, endOffset, FormatHelper._convertOptions(options));
        if (!edits || model.isDisposed()) {
            return;
        }
        return edits.map((edit) => this._convertTextChanges(model, edit));
    }
}
export class FormatOnTypeAdapter extends FormatHelper {
    get autoFormatTriggerCharacters() {
        return [';', '}', '\n'];
    }
    async provideOnTypeFormattingEdits(model, position, ch, options, token) {
        const resource = model.uri;
        const offset = model.getOffsetAt(position);
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const edits = await worker.getFormattingEditsAfterKeystroke(resource.toString(), offset, ch, FormatHelper._convertOptions(options));
        if (!edits || model.isDisposed()) {
            return;
        }
        return edits.map((edit) => this._convertTextChanges(model, edit));
    }
}
// --- code actions ------
export class CodeActionAdaptor extends FormatHelper {
    async provideCodeActions(model, range, context, token) {
        const resource = model.uri;
        const start = model.getOffsetAt({
            lineNumber: range.startLineNumber,
            column: range.startColumn
        });
        const end = model.getOffsetAt({
            lineNumber: range.endLineNumber,
            column: range.endColumn
        });
        const formatOptions = FormatHelper._convertOptions(model.getOptions());
        const errorCodes = context.markers
            .filter((m) => m.code)
            .map((m) => m.code)
            .map(Number);
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const codeFixes = await worker.getCodeFixesAtPosition(resource.toString(), start, end, errorCodes, formatOptions);
        if (!codeFixes || model.isDisposed()) {
            return { actions: [], dispose: () => { } };
        }
        const actions = codeFixes
            .filter((fix) => {
            // Removes any 'make a new file'-type code fix
            return fix.changes.filter((change) => change.isNewFile).length === 0;
        })
            .map((fix) => {
            return this._tsCodeFixActionToMonacoCodeAction(model, context, fix);
        });
        return {
            actions: actions,
            dispose: () => { }
        };
    }
    _tsCodeFixActionToMonacoCodeAction(model, context, codeFix) {
        const edits = [];
        for (const change of codeFix.changes) {
            for (const textChange of change.textChanges) {
                edits.push({
                    resource: model.uri,
                    versionId: undefined,
                    textEdit: {
                        range: this._textSpanToRange(model, textChange.span),
                        text: textChange.newText
                    }
                });
            }
        }
        const action = {
            title: codeFix.description,
            edit: { edits: edits },
            diagnostics: context.markers,
            kind: 'quickfix'
        };
        return action;
    }
}
// --- rename ----
export class RenameAdapter extends Adapter {
    _libFiles;
    constructor(_libFiles, worker) {
        super(worker);
        this._libFiles = _libFiles;
    }
    async provideRenameEdits(model, position, newName, token) {
        const resource = model.uri;
        const fileName = resource.toString();
        const offset = model.getOffsetAt(position);
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return;
        }
        const renameInfo = await worker.getRenameInfo(fileName, offset, {
            allowRenameOfImportPath: false
        });
        if (renameInfo.canRename === false) {
            // use explicit comparison so that the discriminated union gets resolved properly
            return {
                edits: [],
                rejectReason: renameInfo.localizedErrorMessage
            };
        }
        if (renameInfo.fileToRename !== undefined) {
            throw new Error('Renaming files is not supported.');
        }
        const renameLocations = await worker.findRenameLocations(fileName, offset, 
        /*strings*/ false, 
        /*comments*/ false, 
        /*prefixAndSuffix*/ false);
        if (!renameLocations || model.isDisposed()) {
            return;
        }
        const edits = [];
        for (const renameLocation of renameLocations) {
            const model = this._libFiles.getOrCreateModel(renameLocation.fileName);
            if (model) {
                edits.push({
                    resource: model.uri,
                    versionId: undefined,
                    textEdit: {
                        range: this._textSpanToRange(model, renameLocation.textSpan),
                        text: newName
                    }
                });
            }
            else {
                throw new Error(`Unknown file ${renameLocation.fileName}.`);
            }
        }
        return { edits };
    }
}
// --- inlay hints ----
export class InlayHintsAdapter extends Adapter {
    async provideInlayHints(model, range, token) {
        const resource = model.uri;
        const fileName = resource.toString();
        const start = model.getOffsetAt({
            lineNumber: range.startLineNumber,
            column: range.startColumn
        });
        const end = model.getOffsetAt({
            lineNumber: range.endLineNumber,
            column: range.endColumn
        });
        const worker = await this._worker(resource);
        if (model.isDisposed()) {
            return null;
        }
        const tsHints = await worker.provideInlayHints(fileName, start, end);
        const hints = tsHints.map((hint) => {
            return {
                ...hint,
                label: hint.text,
                position: model.getPositionAt(hint.position),
                kind: this._convertHintKind(hint.kind)
            };
        });
        return { hints, dispose: () => { } };
    }
    _convertHintKind(kind) {
        switch (kind) {
            case 'Parameter':
                return languages.InlayHintKind.Parameter;
            case 'Type':
                return languages.InlayHintKind.Type;
            default:
                return languages.InlayHintKind.Type;
        }
    }
}
//# sourceMappingURL=languageFeatures.js.map