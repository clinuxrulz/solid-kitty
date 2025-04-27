import {
    createFileSystem,
    isUrl,
    parseHtml,
    resolvePath,
    Transform,
    transformModulePaths
} from '@bigmistqke/repl'
import ts from 'typescript'
import { AutomergeVirtualFileSystem } from "solid-fs-automerge";
import { Component } from "solid-js";

import preludeIndex from "./prelude/index.html?raw";

function createRepl() {
    const transformJs: Transform = ({ path, source, executables }) => {
        return transformModulePaths(source, modulePath => {
            if (modulePath.startsWith('.')) {
                // Swap relative module-path out with their respective module-url
                const url = executables.get(resolvePath(path, modulePath))
                if (!url) throw 'url is undefined'
                return url
            } else if (isUrl(modulePath)) {
                // Return url directly
                return modulePath
            } else {
                // Wrap external modules with esm.sh
                return `https://esm.sh/${modulePath}`
            }
        })!
    }

    return createFileSystem({
        css: { type: 'css' },
        js: {
            type: 'javascript',
            transform: transformJs,
        },
        ts: {
            type: 'javascript',
            transform({ path, source, executables }) {
                return transformJs({ path, source: ts.transpile(source), executables })
            },
        },
        html: {
            type: 'html',
            transform(config) {
                return (
                    parseHtml(config)
                        // Transform content of all `<script type="module" />` elements
                        .transformModuleScriptContent(transformJs)
                        // Bind relative `src`-attribute of all `<script />` elements
                        .bindScriptSrc()
                        // Bind relative `href`-attribute of all `<link />` elements
                        .bindLinkHref()
                        .toString()
                )
            },
        },
    })
}


const Game: Component<{
    vfs: AutomergeVirtualFileSystem
}> = (props) => {
    let repl = createRepl();
    repl.writeFile("index.html", preludeIndex);
    return (
        <iframe
            src={repl.getExecutable("index.html")}
            style="flex-grow: 1;"
        />
    );
};

export default Game;
