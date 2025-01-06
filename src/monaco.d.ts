interface IMonarchLanguageBracket {
    close: string
    open: string
    token: string }
type IMonarchLanguageRule = [string | RegExp, string | { token: string, next: string }]
interface UriComponents {
    authority?: string
    fragment?: string
    path?: string
    query?: string
    scheme: string }
type Uri = UriComponents
interface IMonarchLanguage {
    brackets?: IMonarchLanguageBracket[]
    defaultToken?: string
    ignoreCase?: boolean
    includeLF?: boolean
    start?: string
    tokenPostfix?: string
    tokenizer: {
        [name: string]: IMonarchLanguageRule[] }
    unicode?: boolean
    [key: string]: any }
interface ILanguageExtensionPoint {
    aliases?: string[]
    configuration?: Uri
    extensions?: string[]
    filenamePatterns?: string[]
    filenames?: string[]
    firstLine?: string
    id: string
    mimetypes?: string[] }
interface IAutoClosingPairConditional {
    close: string
    notIn?: string[]
    open: string }
type CharacterPair = [string, string]
interface CommentRule {
    blockComment?: CharacterPair
    lineComment?: string }
interface FoldingMarkers {
    end: RegExp
    start: RegExp }
interface FoldingRules {
    markers?: FoldingMarkers
    offSide?: boolean }
interface OnEnterRule {
    action: EnterAction
    afterText?: RegExp
    beforeText: RegExp
    previousLineText?: RegExp }
declare enum IndentAction {
    None = 0,
    Indent = 1,
    IndentOutdent = 2,
    Outdent = 3 }
interface EnterAction {
    appendText?: string
    indentAction: IndentAction
    removeText?: number }
interface IndentationRule {
    decreaseIndentPattern: RegExp
    increaseIndentPattern: RegExp
    indentNextLinePattern?: RegExp
    unIndentedLinePattern?: RegExp }
interface IAutoClosingPair {
    close: string
    open: string }
interface LanguageConfiguration {
    autoCloseBefore?: string
    autoClosingPairs?: IAutoClosingPairConditional[]
    brackets?: CharacterPair[]
    colorizedBracketPairs?: CharacterPair[]
    comments?: CommentRule
    folding?: FoldingRules
    indentationRules?: IndentationRule
    onEnterRules?: OnEnterRule[]
    surroundingPairs?: IAutoClosingPair[]
    wordPattern?: RegExp }
type MonacoLanguages = {
    register: (language: ILanguageExtensionPoint) => void,
    setLanguageConfiguration: (languageId: string, configuration: LanguageConfiguration) => IDisposable,
    setMonarchTokensProvider: (languageId: string, langaugeDef: IMonarchLanguage) => IDisposable }
type EditorAutoClosingStrategy = "always" | "languageDefined" | "beforeWhitespace" | "never"
type EditorAutoClosingEditStrategy = "always" | "auto" | "never"
type EditorAutoSurroundStrategy = "languageDefined" | "quotes" | "brackets" | "never"
interface IBracketPairColorizationOptions {
    enabled?: boolean
    independentColorPoolPerBracketType?: boolean }
interface IEditorCommentsOptions {
    ignoreEmptyLines?: boolean
    insertSpace?: boolean }
interface IDimension {
    height: number
    width: number }
interface IDropIntoEditorOptions {
    enabled?: boolean
    showDropSelector?: "never" | "afterDrop" }
interface IInlineEditOptions {
    enabled?: boolean
    fontFamily?: string
    keepOnBlur?: boolean
    showToolbar?: "always" | "never" | "onHover" }
interface IEditorFindOptions {
    addExtraSpaceOnTop?: boolean
    autoFindInSelection?: "always" | "never" | "multiline"
    cursorMoveOnType?: boolean
    loop?: boolean
    seedSearchStringFromSelection?: "always" | "never" | "selection" }
type GoToLocationValues = "peek" | "gotoAndPeek" | "goto"
interface IGotoLocationOptions {
    alternativeDeclarationCommand?: string
    alternativeDefinitionCommand?: string
    alternativeImplementationCommand?: string
    alternativeReferenceCommand?: string
    alternativeTestsCommand?: string
    alternativeTypeDefinitionCommand?: string
    multiple?: GoToLocationValues
    multipleDeclarations?: GoToLocationValues
    multipleDefinitions?: GoToLocationValues
    multipleImplementations?: GoToLocationValues
    multipleReferences?: GoToLocationValues
    multipleTests?: GoToLocationValues
    multipleTypeDefinitions?: GoToLocationValues }
interface IGuidesOptions {
    bracketPairs?: boolean | "active"
    bracketPairsHorizontal?: boolean | "active"
    highlightActiveBracketPair?: boolean
    highlightActiveIndentation?: boolean | "always"
    indentation?: boolean }
interface IEditorHoverOptions {
    above?: boolean
    delay?: number
    enabled?: boolean
    hidingDelay?: number
    sticky?: boolean }
interface IEditorInlayHintsOptions {
    enabled?: "off" | "on" | "offUnlessPressed" | "onUnlessPressed"
    fontFamily?: string
    fontSize?: number
    padding?: boolean }
interface IInlineSuggestOptions {
    enabled?: boolean
    fontFamily?: string
    keepOnBlur?: boolean
    mode?: "prefix" | "subword" | "subwordSmart"
    showToolbar?: "always" | "never" | "onHover"
    suppressSuggestions?: boolean }
declare enum ShowLightbulbIconMode {
    Off = "off",
    On = "on",
    OnCode = "onCode" }
interface IEditorLightbulbOptions {
    enabled?: ShowLightbulbIconMode }
type LineNumbersType = "on" | "off" | "relative" | "interval" | ((lineNumber: string) => string)
interface IEditorMinimapOptions {
    autohide?: boolean
    enabled?: boolean
    maxColumn?: number
    renderCharacters?: boolean
    scale?: number
    sectionHeaderFontSize?: number
    sectionHeaderLetterSpacing?: number
    showMarkSectionHeaders?: boolean
    showRegionSectionHeaders?: boolean
    showSlider?: "always" | "mouseover"
    side?: "right" | "left"
    size?: "proportional" | "fill" | "fit" }
interface ITextModel {
    // id: string
    // onDidChangeAttached: IEvent<void>
    // onDidChangeDecorations: IEvent<IModelDecorationsChangedEvent>
    // onDidChangeLanguage: IEvent<IModelLanguageChangedEvent>
    // onDidChangeLanguageConfiguration: IEvent<IModelLanguageConfigurationChangedEvent>
    // onDidChangeOptions: IEvent<IModelOptionsChangedEvent>
    // onWillDispose: IEvent<void>
    // uri: Uri
    // applyEdits(operations): void
    // applyEdits(operations, computeUndoEdits): void
    // applyEdits(operations, computeUndoEdits): IValidEditOperation[]
    // createSnapshot(preserveBOM?): ITextSnapshot
    // deltaDecorations(oldDecorations, newDecorations, ownerId?): string[]
    // detectIndentation(defaultInsertSpaces, defaultTabSize): void
    // dispose(): void
    // findMatches(searchString, searchOnlyEditableRange, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount?): FindMatch[]
    // findMatches(searchString, searchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount?): FindMatch[]
    // findNextMatch(searchString, searchStart, isRegex, matchCase, wordSeparators, captureMatches): FindMatch
    // findPreviousMatch(searchString, searchStart, isRegex, matchCase, wordSeparators, captureMatches): FindMatch
    // getAllDecorations(ownerId?, filterOutValidation?): IModelDecoration[]
    // getAllMarginDecorations(ownerId?): IModelDecoration[]
    // getAlternativeVersionId(): number
    // getCharacterCountInRange(range, eol?): number
    // getDecorationOptions(id): IModelDecorationOptions
    // getDecorationRange(id): Range
    // getDecorationsInRange(range, ownerId?, filterOutValidation?, onlyMinimapDecorations?, onlyMarginDecorations?): IModelDecoration[]
    // getEOL(): string
    // getEndOfLineSequence(): EndOfLineSequence
    // getFullModelRange(): Range
    // getInjectedTextDecorations(ownerId?): IModelDecoration[]
    // getLanguageId(): string
    // getLineContent(lineNumber): string
    // getLineCount(): number
    // getLineDecorations(lineNumber, ownerId?, filterOutValidation?): IModelDecoration[]
    // getLineFirstNonWhitespaceColumn(lineNumber): number
    // getLineLastNonWhitespaceColumn(lineNumber): number
    // getLineLength(lineNumber): number
    // getLineMaxColumn(lineNumber): number
    // getLineMinColumn(lineNumber): number
    // getLinesContent(): string[]
    // getLinesDecorations(startLineNumber, endLineNumber, ownerId?, filterOutValidation?): IModelDecoration[]
    // getOffsetAt(position): number
    // getOptions(): TextModelResolvedOptions
    // getOverviewRulerDecorations(ownerId?, filterOutValidation?): IModelDecoration[]
    // getPositionAt(offset): Position
    // getValue(eol?, preserveBOM?): string
    // getValueInRange(range, eol?): string
    // getValueLength(eol?, preserveBOM?): number
    // getValueLengthInRange(range, eol?): number
    // getVersionId(): number
    // getWordAtPosition(position): IWordAtPosition
    // getWordUntilPosition(position): IWordAtPosition
    // isAttachedToEditor(): boolean
    // isDisposed(): boolean
    // modifyPosition(position, offset): Position
    // normalizeIndentation(str): string
    onDidChangeContent(listener: (e: void) => void): IDisposable
    // popStackElement(): void
    // pushEOL(eol): void
    // pushEditOperations(beforeCursorState, editOperations, cursorStateComputer): Selection[]
    // pushStackElement(): void
    // setEOL(eol): void
    // setValue(newValue): void
    // updateOptions(newOpts): void
    // validatePosition(position): Position
    // validateRange(range): Range
}
interface IEditorPaddingOptions {
    bottom?: number
    top?: number }
interface IEditorParameterHintOptions {
    cycle?: boolean
    enabled?: boolean }
interface IPasteAsOptions {
    enabled?: boolean
    showPasteSelector?: "never" | "afterPaste" }
type QuickSuggestionsValue = "on" | "inline" | "off"
interface IQuickSuggestionsOptions {
    comments?: boolean | QuickSuggestionsValue
    other?: boolean | QuickSuggestionsValue
    strings?: boolean | QuickSuggestionsValue }
interface MarkdownStringTrustedOptions {
    enabledCommands: readonly string[] }
interface IMarkdownString {
    baseUri?: UriComponents
    isTrusted?: boolean | MarkdownStringTrustedOptions
    supportHtml?: boolean
    supportThemeIcons?: boolean
    uris?: {
        [href: string]: UriComponents }
    value: string }
interface IRulerOption {
    color: string
    column: number }
interface IEditorScrollbarOptions {
    alwaysConsumeMouseWheel?: boolean
    arrowSize?: number
    handleMouseWheel?: boolean
    horizontal?: "auto" | "visible" | "hidden"
    horizontalHasArrows?: boolean
    horizontalScrollbarSize?: number
    horizontalSliderSize?: number
    ignoreHorizontalScrollbarInContentHeight?: boolean
    scrollByPage?: boolean
    useShadows?: boolean
    vertical?: "auto" | "visible" | "hidden"
    verticalHasArrows?: boolean
    verticalScrollbarSize?: number
    verticalSliderSize?: number }
interface ISemanticHighlightingOptions {
    enabled?: boolean | "configuredByTheme" }
interface ISmartSelectOptions {
    selectLeadingAndTrailingWhitespace?: boolean
    selectSubwords?: boolean }
interface IEditorStickyScrollOptions {
    defaultModel?: "outlineModel" | "foldingProviderModel" | "indentationModel"
    enabled?: boolean
    maxLineCount?: number
    scrollWithEditor?: boolean }
interface ISuggestOptions {
    filterGraceful?: boolean
    insertMode?: "insert" | "replace"
    localityBonus?: boolean
    matchOnWordStartOnly?: boolean
    preview?: boolean
    previewMode?: "prefix" | "subword" | "subwordSmart"
    selectionMode?: "always" | "never" | "whenTriggerCharacter" | "whenQuickSuggestion"
    shareSuggestSelections?: boolean
    showClasses?: boolean
    showColors?: boolean
    showConstants?: boolean
    showConstructors?: boolean
    showDeprecated?: boolean
    showEnumMembers?: boolean
    showEnums?: boolean
    showEvents?: boolean
    showFields?: boolean
    showFiles?: boolean
    showFolders?: boolean
    showFunctions?: boolean
    showIcons?: boolean
    showInlineDetails?: boolean
    showInterfaces?: boolean
    showIssues?: boolean
    showKeywords?: boolean
    showMethods?: boolean
    showModules?: boolean
    showOperators?: boolean
    showProperties?: boolean
    showReferences?: boolean
    showSnippets?: boolean
    showStatusBar?: boolean
    showStructs?: boolean
    showTypeParameters?: boolean
    showUnits?: boolean
    showUsers?: boolean
    showValues?: boolean
    showVariables?: boolean
    showWords?: boolean
    snippetsPreventQuickSuggestions?: boolean }
interface IUnicodeHighlightOptions {
    allowedCharacters?: Record<string, true>
    allowedLocales?: Record<string, true>
    ambiguousCharacters?: boolean
    includeComments?: boolean | "inUntrustedWorkspace"
    includeStrings?: boolean | "inUntrustedWorkspace"
    invisibleCharacters?: boolean
    nonBasicASCII?: boolean | "inUntrustedWorkspace" }
interface IStandaloneEditorConstructionOptions {
    acceptSuggestionOnCommitCharacter?: boolean
    acceptSuggestionOnEnter?: "off" | "on" | "smart"
    accessibilityHelpUrl?: string
    accessibilityPageSize?: number
    accessibilitySupport?: "off" | "on" | "auto"
    ariaContainerElement?: HTMLElement
    ariaLabel?: string
    ariaRequired?: boolean
    autoClosingBrackets?: EditorAutoClosingStrategy
    autoClosingComments?: EditorAutoClosingStrategy
    autoClosingDelete?: EditorAutoClosingEditStrategy
    autoClosingOvertype?: EditorAutoClosingEditStrategy
    autoClosingQuotes?: EditorAutoClosingStrategy
    autoDetectHighContrast?: boolean
    autoIndent?: "none" | "advanced" | "full" | "brackets" | "keep"
    autoSurround?: EditorAutoSurroundStrategy
    automaticLayout?: boolean
    bracketPairColorization?: IBracketPairColorizationOptions
    codeActionsOnSaveTimeout?: number
    codeLens?: boolean
    codeLensFontFamily?: string
    codeLensFontSize?: number
    colorDecorators?: boolean
    colorDecoratorsActivatedOn?: "clickAndHover" | "click" | "hover"
    colorDecoratorsLimit?: number
    columnSelection?: boolean
    comments?: IEditorCommentsOptions
    contextmenu?: boolean
    copyWithSyntaxHighlighting?: boolean
    cursorBlinking?: "blink" | "smooth" | "phase" | "expand" | "solid"
    cursorSmoothCaretAnimation?: "off" | "on" | "explicit"
    cursorStyle?: "line" | "block" | "underline" | "line-thin" | "block-outline" | "underline-thin"
    cursorSurroundingLines?: number
    cursorSurroundingLinesStyle?: "default" | "all"
    cursorWidth?: number
    defaultColorDecorators?: boolean
    definitionLinkOpensInPeek?: boolean
    detectIndentation?: boolean
    dimension?: IDimension
    disableLayerHinting?: boolean
    disableMonospaceOptimizations?: boolean
    domReadOnly?: boolean
    dragAndDrop?: boolean
    dropIntoEditor?: IDropIntoEditorOptions
    emptySelectionClipboard?: boolean
    experimentalInlineEdit?: IInlineEditOptions
    experimentalWhitespaceRendering?: "off" | "svg" | "font"
    extraEditorClassName?: string
    fastScrollSensitivity?: number
    find?: IEditorFindOptions
    fixedOverflowWidgets?: boolean
    folding?: boolean
    foldingHighlight?: boolean
    foldingImportsByDefault?: boolean
    foldingMaximumRegions?: number
    foldingStrategy?: "auto" | "indentation"
    fontFamily?: string
    fontLigatures?: string | boolean
    fontSize?: number
    fontVariations?: string | boolean
    fontWeight?: string
    formatOnPaste?: boolean
    formatOnType?: boolean
    glyphMargin?: boolean
    gotoLocation?: IGotoLocationOptions
    guides?: IGuidesOptions
    hideCursorInOverviewRuler?: boolean
    hover?: IEditorHoverOptions
    inDiffEditor?: boolean
    inlayHints?: IEditorInlayHintsOptions
    inlineCompletionsAccessibilityVerbose?: boolean
    inlineSuggest?: IInlineSuggestOptions
    insertSpaces?: boolean
    language?: string
    largeFileOptimizations?: boolean
    letterSpacing?: number
    lightbulb?: IEditorLightbulbOptions
    lineDecorationsWidth?: string | number
    lineHeight?: number
    lineNumbers?: LineNumbersType
    lineNumbersMinChars?: number
    linkedEditing?: boolean
    links?: boolean
    matchBrackets?: "always" | "never" | "near"
    matchOnWordStartOnly?: boolean
    maxTokenizationLineLength?: number
    minimap?: IEditorMinimapOptions
    model?: ITextModel
    mouseStyle?: "default" | "text" | "copy"
    mouseWheelScrollSensitivity?: number
    mouseWheelZoom?: boolean
    multiCursorLimit?: number
    multiCursorMergeOverlapping?: boolean
    multiCursorModifier?: "ctrlCmd" | "alt"
    multiCursorPaste?: "spread" | "full"
    occurrencesHighlight?: "off" | "singleFile" | "multiFile"
    overflowWidgetsDomNode?: HTMLElement
    overviewRulerBorder?: boolean
    overviewRulerLanes?: number
    padding?: IEditorPaddingOptions
    parameterHints?: IEditorParameterHintOptions
    pasteAs?: IPasteAsOptions
    peekWidgetDefaultFocus?: "tree" | "editor"
    placeholder?: string
    quickSuggestions?: boolean | IQuickSuggestionsOptions
    quickSuggestionsDelay?: number
    readOnly?: boolean
    readOnlyMessage?: IMarkdownString
    renameOnType?: boolean
    renderControlCharacters?: boolean
    renderFinalNewline?: "off" | "on" | "dimmed"
    renderLineHighlight?: "all" | "line" | "none" | "gutter"
    renderLineHighlightOnlyWhenFocus?: boolean
    renderValidationDecorations?: "off" | "on" | "editable"
    renderWhitespace?: "all" | "none" | "boundary" | "selection" | "trailing"
    revealHorizontalRightPadding?: number
    roundedSelection?: boolean
    rulers?: (number | IRulerOption)[]
    screenReaderAnnounceInlineSuggestion?: boolean
    scrollBeyondLastColumn?: number
    scrollBeyondLastLine?: boolean
    scrollPredominantAxis?: boolean
    scrollbar?: IEditorScrollbarOptions
    selectOnLineNumbers?: boolean
    selectionClipboard?: boolean
    selectionHighlight?: boolean
    semanticHighlighting?: ISemanticHighlightingOptions
    showDeprecated?: boolean;
    showFoldingControls?: "always" | "never" | "mouseover";
    showUnused?: boolean;
    smartSelect?: ISmartSelectOptions;
    smoothScrolling?: boolean;
    snippetSuggestions?: "none" | "top" | "bottom" | "inline";
    stablePeek?: boolean;
    stickyScroll?: IEditorStickyScrollOptions;
    stickyTabStops?: boolean;
    stopRenderingLineAfter?: number;
    suggest?: ISuggestOptions;
    suggestFontSize?: number;
    suggestLineHeight?: number;
    suggestOnTriggerCharacters?: boolean;
    suggestSelection?: "first" | "recentlyUsed" | "recentlyUsedByPrefix";
    tabCompletion?: "off" | "on" | "onlySnippets";
    tabFocusMode?: boolean;
    tabIndex?: number;
    tabSize?: number;
    theme?: string;
    trimAutoWhitespace?: boolean;
    unfoldOnClickAfterEndOfLine?: boolean;
    unicodeHighlight?: IUnicodeHighlightOptions;
    unusualLineTerminators?: "off" | "auto" | "prompt";
    useShadowDOM?: boolean;
    useTabStops?: boolean;
    value?: string;
    wordBasedSuggestions?: "off" | "currentDocument" | "matchingDocuments" | "allDocuments";
    wordBasedSuggestionsOnlySameLanguage?: boolean;
    wordBreak?: "normal" | "keepAll";
    wordSegmenterLocales?: string | string[];
    wordSeparators?: string;
    wordWrap?: "off" | "on" | "wordWrapColumn" | "bounded";
    wordWrapBreakAfterCharacters?: string;
    wordWrapBreakBeforeCharacters?: string;
    wordWrapColumn?: number;
    wordWrapOverride1?: "off" | "on" | "inherit";
    wordWrapOverride2?: "off" | "on" | "inherit";
    wrappingIndent?: "none" | "same" | "indent" | "deepIndent";
    wrappingStrategy?: "simple" | "advanced"; }
interface IEditorOverrideServices {
    [index: string]: any; }
interface IDisposable {
    dispose(): void; }
type IEvent<T> = (listener: (e: T) => any, thisArg?: any) => IDisposable
interface IStandaloneCodeEditor {
    // onBeginUpdate: IEvent<void>;
    // onContextMenu: IEvent<IEditorMouseEvent>;
    // onDidAttemptReadOnlyEdit: IEvent<void>;
    // onDidBlurEditorText: IEvent<void>;
    // onDidBlurEditorWidget: IEvent<void>;
    // onDidChangeConfiguration: IEvent<ConfigurationChangedEvent>;
    // onDidChangeCursorPosition: IEvent<ICursorPositionChangedEvent>;
    // onDidChangeCursorSelection: IEvent<ICursorSelectionChangedEvent>;
    // onDidChangeHiddenAreas: IEvent<void>;
    // onDidChangeModel: IEvent<IModelChangedEvent>;
    // onDidChangeModelContent: IEvent<IModelContentChangedEvent>;
    // onDidChangeModelDecorations: IEvent<IModelDecorationsChangedEvent>;
    // onDidChangeModelLanguage: IEvent<IModelLanguageChangedEvent>;
    // onDidChangeModelLanguageConfiguration: IEvent<IModelLanguageConfigurationChangedEvent>;
    // onDidChangeModelOptions: IEvent<IModelOptionsChangedEvent>;
    // onDidCompositionEnd: IEvent<void>;
    // onDidCompositionStart: IEvent<void>;
    // onDidContentSizeChange: IEvent<IContentSizeChangedEvent>;
    // onDidFocusEditorText: IEvent<void>;
    // onDidFocusEditorWidget: IEvent<void>;
    // onDidLayoutChange: IEvent<EditorLayoutInfo>;
    // onDidPaste: IEvent<IPasteEvent>;
    // onDidScrollChange: IEvent<IScrollEvent>;
    // onEndUpdate: IEvent<void>;
    // onKeyDown: IEvent<IKeyboardEvent>;
    // onKeyUp: IEvent<IKeyboardEvent>;
    // onMouseDown: IEvent<IEditorMouseEvent>;
    // onMouseLeave: IEvent<IPartialEditorMouseEvent>;
    // onMouseMove: IEvent<IEditorMouseEvent>;
    // onMouseUp: IEvent<IEditorMouseEvent>;
    // onWillChangeModel: IEvent<IModelChangedEvent>;
    // addAction(descriptor): IDisposable;
    // addCommand(keybinding, handler, context?): string;
    // addContentWidget(widget): void;
    // addGlyphMarginWidget(widget): void;
    // addOverlayWidget(widget): void;
    // applyFontInfo(target): void;
    // changeViewZones(callback): void;
    // createContextKey<T>(key, defaultValue): IContextKey<T>;
    // createDecorationsCollection(decorations?): IEditorDecorationsCollection;
    // deltaDecorations(oldDecorations, newDecorations): string[];
    // dispose(): void;
    // executeCommand(source, command): void;
    // executeCommands(source, commands): void;
    // executeEdits(source, edits, endCursorState?): boolean;
    // focus(): void;
    // getAction(id): IEditorAction;
    // getBottomForLineNumber(lineNumber): number;
    // getContainerDomNode(): HTMLElement;
    // getContentHeight(): number;
    // getContentWidth(): number;
    // getContribution<T>(id): T;
    // getDecorationsInRange(range): IModelDecoration[];
    // getDomNode(): HTMLElement;
    // getEditorType(): string;
    // getId(): string;
    // getLayoutInfo(): EditorLayoutInfo;
    // getLineDecorations(lineNumber): IModelDecoration[];
    getModel(): ITextModel;
    // getOffsetForColumn(lineNumber, column): number;
    // getOption<T>(id): FindComputedEditorOptionValueById<T>;
    // getOptions(): IComputedEditorOptions;
    // getPosition(): Position;
    // getRawOptions(): IEditorOptions;
    // getScrollHeight(): number;
    // getScrollLeft(): number;
    // getScrollTop(): number;
    // getScrollWidth(): number;
    // getScrolledVisiblePosition(position): {
    //     height: number;
    //     left: number;
    //     top: number; };
    // getSelection(): Selection;
    // getSelections(): Selection[];
    // getSupportedActions(): IEditorAction[];
    // getTargetAtClientPoint(clientX, clientY): IMouseTarget;
    // getTopForLineNumber(lineNumber, includeViewZones?): number;
    // getTopForPosition(lineNumber, column): number;
    getValue(options?: {
        lineEnding: string
        preserveBOM: boolean }): string;
    // getVisibleColumnFromPosition(position): number;
    // getVisibleRanges(): Range[];
    // handleInitialized?(): void;
    // hasPendingScrollAnimation(): boolean;
    // hasTextFocus(): boolean;
    // hasWidgetFocus(): boolean;
    // layout(dimension?, postponeRendering?): void;
    // layoutContentWidget(widget): void;
    // layoutGlyphMarginWidget(widget): void;
    // layoutOverlayWidget(widget): void;
    // onDidDispose(listener): IDisposable;
    // popUndoStop(): boolean;
    // pushUndoStop(): boolean;
    // removeContentWidget(widget): void;
    // removeDecorations(decorationIds): void;
    // removeGlyphMarginWidget(widget): void;
    // removeOverlayWidget(widget): void;
    // render(forceRedraw?): void;
    // restoreViewState(state): void;
    // revealLine(lineNumber, scrollType?): void;
    // revealLineInCenter(lineNumber, scrollType?): void;
    // revealLineInCenterIfOutsideViewport(lineNumber, scrollType?): void;
    // revealLineNearTop(lineNumber, scrollType?): void;
    // revealLines(startLineNumber, endLineNumber, scrollType?): void;
    // revealLinesInCenter(lineNumber, endLineNumber, scrollType?): void;
    // revealLinesInCenterIfOutsideViewport(lineNumber, endLineNumber, scrollType?): void;
    // revealLinesNearTop(lineNumber, endLineNumber, scrollType?): void;
    // revealPosition(position, scrollType?): void;
    // revealPositionInCenter(position, scrollType?): void;
    // revealPositionInCenterIfOutsideViewport(position, scrollType?): void;
    // revealPositionNearTop(position, scrollType?): void;
    // revealRange(range, scrollType?): void;
    // revealRangeAtTop(range, scrollType?): void;
    // revealRangeInCenter(range, scrollType?): void;
    // revealRangeInCenterIfOutsideViewport(range, scrollType?): void;
    // revealRangeNearTop(range, scrollType?): void;
    // revealRangeNearTopIfOutsideViewport(range, scrollType?): void;
    // saveViewState(): ICodeEditorViewState;
    // setBanner(bannerDomNode, height): void;
    // setModel(model): void;
    // setPosition(position, source?): void;
    // setScrollLeft(newScrollLeft, scrollType?): void;
    // setScrollPosition(position, scrollType?): void;
    // setScrollTop(newScrollTop, scrollType?): void;
    // setSelection(selection, source?): void;
    // setSelection(selection, source?): void;
    // setSelection(selection, source?): void;
    // setSelection(selection, source?): void;
    // setSelections(selections, source?): void;
    setValue(newValue: string): void;
    // trigger(source, handlerId, payload): void;
    // updateOptions(newOptions): void;
    // writeScreenReaderContent(reason): void;
}
type BuiltinTheme = "vs" | "vs-dark" | "hc-black" | "hc-light"
type IColors= {
    [colorId: string]: string }
interface ITokenThemeRule {
    background?: string
    fontStyle?: string
    foreground?: string
    token: string }
interface IStandaloneThemeData {
    base: BuiltinTheme
    colors: IColors
    encodedTokensColors?: string[]
    inherit: boolean
    rules: ITokenThemeRule[] }
type MonacoEditor = {
    create: (domElement: HTMLElement, options?: IStandaloneEditorConstructionOptions, override?: IEditorOverrideServices) => IStandaloneCodeEditor
    defineTheme: (themeName: string, themeData: IStandaloneThemeData) => void
    setTheme: (themeName: string) => void }
type Monaco =  {
    languages: MonacoLanguages
    editor: MonacoEditor }
type MonacoLoader = {
    config: (x: { paths?: { vs?: string } }) => void } &
    ((e: string[], cb: (value: unknown) => void) => void)

declare const require: MonacoLoader
declare const monaco: Monaco