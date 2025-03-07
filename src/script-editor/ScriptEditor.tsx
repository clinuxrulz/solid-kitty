import { Component, createSignal, onMount } from "solid-js";
import { editor } from "monaco-editor";

import "./monaco-workers";

const isAndroid = navigator && /android/i.test(navigator.userAgent);

const ScriptEditor: Component = () => {
    let [div, setDiv] = createSignal<HTMLDivElement>();
    let [editor2, setEditor2] = createSignal<editor.IStandaloneCodeEditor>();
    onMount(() => {
        let div2 = div();
        if (div2 == undefined) {
            return;
        }
        setEditor2(
            editor.create(div2, {
                language: "typescript",
                quickSuggestions: {
                    other: !isAndroid,
                    comments: !isAndroid,
                    strings: !isAndroid,
                },
                acceptSuggestionOnCommitCharacter: !isAndroid,
                acceptSuggestionOnEnter: !isAndroid ? "on" : "off",
                accessibilitySupport: !isAndroid ? "on" : "off",
            }),
        );
    });
    return (
        <div
            ref={setDiv}
            style={{
                width: "100%",
                height: "100%",
            }}
        ></div>
    );
};

export default ScriptEditor;
