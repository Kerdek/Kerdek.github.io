// import { lookup } from '../common/util/di.js'
import { lookup, tr } from '../common/util/di.js';
import { abstract_article } from './abstract.js';
import { article_tokens } from './article_tokens.js';
import { check_article, collect_article_exports } from './check.js';
import { look_up_proof, look_up_proposition, rho } from './context.js';
import { add_files_changed_listener, files } from './fs.js';
import { article_messages } from './messages.js';
import { languages } from './monaco.js';
import { position_from_monaco, range_to_monaco } from './monaco_range.js';
import { highlight_text_format, print_message_contents, print_proposition, text_format } from './print.js';
import { aka } from './proposition.js';
import { read_article } from './read.js';
import { empty_range } from './scanner.js';
import { select_statement } from './select.js';
import { token_kinds, tokenizer } from './tokenizer.js';
const read = (text) => read_article(tokenizer(text, { line: 1, col: 1 }));
const text_model_data_map = new Map();
const file_data_map = new Map();
const fresh_file_data = (dependents, source) => {
    const get_import = (name) => {
        if (dependents.includes(name)) {
            return null;
        }
        const data = get_file_data(dependents, name);
        if (!data) {
            return null;
        }
        dependencies.add(name);
        data.dependencies.forEach(d => dependencies.add(d));
        return data.context;
    }, concrete = read(source), abstract = abstract_article(concrete), dependencies = new Set(), context = { sigma: [], rho: [], pi: [] };
    collect_article_exports(abstract, get_import, context);
    return { context, dependencies };
};
const get_file_data = (dependents, name) => {
    let data = file_data_map.get(name);
    if (data) {
        return data;
    }
    const f = files[name];
    if (!f) {
        return null;
    }
    data = fresh_file_data([...dependents, name], f.contents);
    file_data_map.set(name, data);
    const dep = data.dependencies;
    if (dependents.some(x => dep.has(x))) {
        return null;
    }
    return data;
};
const fresh_text_model_data_cache = (model) => {
    const get_import = (name) => {
        const data = get_file_data([], name);
        if (!data) {
            return null;
        }
        dependencies.add(name);
        data.dependencies.forEach(d => dependencies.add(d));
        return data.context;
    }, version = model.getVersionId(), source = model.getValue(), concrete = read(source), abstract = abstract_article(concrete), dependencies = new Set(), messages = article_messages(concrete) || [], statement_transcript = [], proof_transcript = [];
    check_article(abstract, {
        sigma: [], pi: [], rho: []
    }, get_import, statement_transcript, proof_transcript, messages),
        monaco.editor.setModelMarkers(model, 'syntax', messages.map(m => ({
            startLineNumber: 'begin' in m.w ? m.w.begin.line : m.w.line,
            startColumn: 'begin' in m.w ? m.w.begin.col : m.w.col,
            endLineNumber: 'end' in m.w ? m.w.end.line : m.w.line,
            endColumn: 'end' in m.w ? m.w.end.col : m.w.col,
            message: /* m.title + ': ' +  */ m.c.map(c => print_message_contents(text_format)(c)).join('\n'),
            severity: monaco.MarkerSeverity.Error
        })));
    return { version, source, concrete, abstract, proof_transcript, statement_transcript, messages };
};
export const get_model_data = (model) => {
    let data = text_model_data_map.get(model.id);
    if (data) {
        return data;
    }
    let dispose = () => {
        dispose = () => { };
        text_model_data_map.delete(model.id);
    };
    model.onDidChangeLanguage(({ newLanguage }) => {
        if (newLanguage !== 'semity') {
            dispose();
        }
    });
    model.onWillDispose(() => {
        dispose();
    });
    data = {
        model,
        add_change_listener: h => {
            change_listeners.add(h);
        },
        remove_change_listener: h => {
            change_listeners.delete(h);
        },
        cache: b => {
            if (!b && cache.version === model.getVersionId()) {
                return cache;
            }
            cache = fresh_text_model_data_cache(model);
            change_listeners.forEach(h => h());
            return cache;
        }
    };
    const change_listeners = new Set();
    let cache = fresh_text_model_data_cache(model);
    text_model_data_map.set(model.id, data);
    return data;
};
add_files_changed_listener(() => {
    file_data_map.clear();
    text_model_data_map.forEach(({ cache }) => {
        cache(true);
    });
});
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
        data: new Uint32Array((article_tokens(get_model_data(model).cache().concrete) || []).reduce(([a, l, c], b) => (a.push(b.w.begin.line - l, b.w.begin.line === l ? b.w.begin.col - c : b.w.begin.col - 1, b.w.end.col - b.w.begin.col, token_kinds.indexOf(b.type), 0), [a, b.w.begin.line, b.w.begin.col]), [[], 1, 1])[0])
    }),
    releaseDocumentSemanticTokens(_resultId) { }
});
languages.registerHoverProvider('semity', {
    provideHover: (model, position) => {
        const p = print_proposition(highlight_text_format), c = get_model_data(model).cache(), wp = position_from_monaco(position), s = c.abstract && select_statement(wp, false)(c.abstract);
        return s && {
            range: range_to_monaco(s.k === 'statement' ? s.n.w :
                s.k === 'proof' ? s.e.w :
                    s.k === 'proposition' ? s.t.w :
                        s.k === 'binding' ? s.w :
                            empty_range(wp)),
            contents: (s.k === 'proof' &&
                tr(lookup(c.proof_transcript, s.e), g => !g.found ? [
                    `(proof) ${p(g.tau).join('')}`
                ] : [
                    `(proof) ${p(g.found).join('')}`,
                    `(expected) ${p(g.tau).join('')}`
                ]) ||
                s.k === 'proposition' &&
                    tr(s.e ? lookup(c.proof_transcript, s.e) :
                        lookup(c.statement_transcript, s.n), g => [
                        `(proposition) ${p(aka(s.t, rho(g))).join('')}`
                    ]) ||
                s.k === 'binding' &&
                    tr(s.e ? lookup(c.proof_transcript, s.e) :
                        lookup(c.statement_transcript, s.n), g => tr(look_up_proof(s.i, g), j => [
                        `(binding) ${p(j.t).join('')}`
                    ])) ||
                []).map(value => ({ supportHtml: true, value }))
        };
    }
});
languages.registerDefinitionProvider('semity', {
    provideDefinition: (model, position) => {
        const c = get_model_data(model).cache(), s = c.abstract && select_statement(position_from_monaco(position), true)(c.abstract), to_monaco = ({ wi }) => wi.begin.line === 0 ? null : {
            uri: model.uri,
            range: range_to_monaco(wi)
        };
        return !s || s.k === 'binding' ?
            null :
            tr('e' in s ? lookup(c.proof_transcript, s.e) : lookup(c.statement_transcript, s.n), g => s.k === 'proposition' && s.t.k === 'ref' ?
                tr(look_up_proposition(s.t.i, g), to_monaco) :
                s.k === 'proof' && s.e.k === 'ref' ?
                    tr(look_up_proof(s.e.i, g), to_monaco) :
                    null);
    }
});
//# sourceMappingURL=language_server.js.map