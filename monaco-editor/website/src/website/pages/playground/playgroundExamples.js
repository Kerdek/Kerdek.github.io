const descriptions = require.context("../../data/playground-samples", true, /json$/);
const files = require.context("!!raw-loader!../../data/playground-samples/", true, /(html|css|js)$/, "lazy");
let _cache = undefined;
export function getPlaygroundExamples() {
    if (_cache !== undefined) {
        return _cache;
    }
    const result = [];
    const chapterFileName = "chapter.json";
    for (const chapterKey of descriptions
        .keys()
        .filter((k) => k.endsWith(`/${chapterFileName}`))) {
        const chapterInfo = descriptions(chapterKey);
        const path = chapterKey.substring(0, chapterKey.length - chapterFileName.length);
        const sampleJsonFileName = "/sample.json";
        const examples = descriptions
            .keys()
            .filter((k) => k.startsWith(path) && k.endsWith(sampleJsonFileName))
            .map((key) => {
            const path = key.substring(0, key.length - sampleJsonFileName.length);
            const description = descriptions(key);
            return {
                title: description.title,
                id: path.replace("./", "").replaceAll("/", "-"),
                sortingKey: description.sortingKey || Number.MAX_SAFE_INTEGER,
                async load() {
                    const [css, js, html] = await Promise.all([
                        files(path + "/sample.css"),
                        files(path + "/sample.js"),
                        files(path + "/sample.html"),
                    ]);
                    return {
                        css: css.default,
                        html: html.default,
                        js: js.default,
                    };
                },
            };
        });
        examples.sort((a, b) => a.sortingKey - b.sortingKey);
        result.push({
            chapterTitle: chapterInfo.title,
            examples,
            sortingKey: chapterInfo.sortingKey || Number.MAX_SAFE_INTEGER,
        });
    }
    result.sort((a, b) => a.sortingKey - b.sortingKey);
    _cache = result;
    return result;
}
//# sourceMappingURL=playgroundExamples.js.map