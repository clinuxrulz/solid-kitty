import { Component, createSignal, onMount } from "solid-js";
import { editor } from "monaco-editor";

import jsonWorkerUrl from "monaco-editor/esm/vs/language/json/json.worker.js?url";
import cssWorkerUrl from "monaco-editor/esm/vs/language/css/css.worker.js?url";
import htmlWorkerUrl from "monaco-editor/esm/vs/language/html/html.worker.js?url";
import tsWorkerUrl from "monaco-editor/esm/vs/language/typescript/ts.worker.js?url";
import editorWorkerUrl from "monaco-editor/esm/vs/editor/editor.worker.js?url";


self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
		if (label === 'json') {
			return jsonWorkerUrl;
		}
		if (label === 'css' || label === 'scss' || label === 'less') {
			return cssWorkerUrl;
		}
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return htmlWorkerUrl;
		}
		if (label === 'typescript' || label === 'javascript') {
			return tsWorkerUrl;
		}
		return editorWorkerUrl;
	}
};

const isAndroid = navigator && /android/i.test(navigator.userAgent);

const ScriptEditor: Component = () => {
    let [ div, setDiv ] = createSignal<HTMLDivElement>();
    let [ editor2, setEditor2 ] = createSignal<editor.IStandaloneCodeEditor
    >();
    onMount(() => {
        let div2 = div();
        if (div2 == undefined) {
            return;
        }
        setEditor2(editor.create(
            div2,
            {
                language: "typescript",
                quickSuggestions: {
                    other: !isAndroid,
                    comments: !isAndroid,
                    strings: !isAndroid,
                  },
                  acceptSuggestionOnCommitCharacter: !isAndroid,
                  acceptSuggestionOnEnter: !isAndroid ? "on" : "off",
                  accessibilitySupport: !isAndroid ? "on" : "off",
            },
        ));
    });
    return (
        <div
            ref={setDiv}
            style={{
                "width": "100%",
                "height": "100%",
            }}
        >

        </div>
    );
};

export default ScriptEditor;
