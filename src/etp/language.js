import { abstract_article } from './abstract.js';
import { article_tokens } from './article_tokens.js';
import { check_article } from './check.js';
import { empty_context } from './context.js';
import { article_messages } from './messages.js';
import { languages } from './monaco.js';
import { print_message_contents, text_format } from './print.js';
import { read_article } from './read.js';
import { token_kinds, tokenizer } from './tokenizer.js';
const model_data_map = new Map();
const read = (text) => read_article(tokenizer(text, { line: 1, col: 1 }));
const read_data = (version, source) => {
    const concrete = read(source), abstract = abstract_article(concrete), sm = article_messages(concrete), [, em] = check_article(abstract, empty_context()), messages = [...sm, ...em];
    return { version, source, concrete, abstract, messages };
};
export const get_model_data = (model) => {
    const mc = model_data_map.get(model.id);
    if (mc) {
        return mc;
    }
    model.onDidChangeLanguage(({ newLanguage }) => {
        if (newLanguage !== 'church') {
            model_data_map.delete(model.id);
        }
    });
    model.onWillDispose(() => {
        model_data_map.delete(model.id);
    });
    const read_model_data = (model) => {
        const data = read_data(model.getVersionId(), model.getValue());
        monaco.editor.setModelMarkers(model, 'syntax', data.messages.map(m => ({
            startLineNumber: 'begin' in m.w ? m.w.begin.line : m.w.line,
            startColumn: 'begin' in m.w ? m.w.begin.col : m.w.col,
            endLineNumber: 'end' in m.w ? m.w.end.line : m.w.line,
            endColumn: 'end' in m.w ? m.w.end.col : m.w.col,
            message: /* m.title + ': ' +  */ m.c.map(c => print_message_contents(text_format)(c)).join('\n'),
            severity: monaco.MarkerSeverity.Error
        })));
        return data;
    };
    const model_data = {
        cache: () => {
            if (cache_data.version === model.getVersionId()) {
                return cache_data;
            }
            cache_data = read_model_data(model);
            return cache_data;
        }
    };
    let cache_data = read_model_data(model);
    model_data_map.set(model.id, model_data);
    return model_data;
};
languages.register({ id: 'semity' });
languages.setLanguageConfiguration('semity', {
    comments: {
        lineComment: '--',
        blockComment: ['(*', '*)']
    },
    brackets: [
        ['(', ')'],
        ['[', ']']
    ],
    colorizedBracketPairs: [],
    autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '(*', close: '*)' }
    ],
    surroundingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '(*', close: '*)' }
    ],
    folding: { 'markers': { start: /\(/, end: /\)/ } }
});
languages.registerDocumentSemanticTokensProvider('semity', {
    getLegend: () => ({ tokenTypes: [...token_kinds], tokenModifiers: [] }),
    provideDocumentSemanticTokens: (model, _resultId, _token) => ({
        data: new Uint32Array(article_tokens(get_model_data(model).cache().concrete).reduce(([a, l, c], b) => (a.push(b.w.begin.line - l, b.w.begin.line === l ? b.w.begin.col - c : b.w.begin.col - 1, b.w.end.col - b.w.begin.col, token_kinds.indexOf(b.type), 0), [a, b.w.begin.line, b.w.begin.col]), [[], 1, 1])[0])
    }),
    releaseDocumentSemanticTokens(_resultId) { }
});
//# sourceMappingURL=language.js.map