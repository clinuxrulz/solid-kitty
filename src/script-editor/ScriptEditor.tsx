import { Component, createComputed, createSignal, on, onCleanup, onMount } from "solid-js";
import type { editor } from "monaco-editor";

import loader from "@monaco-editor/loader";
import { AutomergeVfsFile } from "solid-fs-automerge";

let monaco = await loader.init();

const isAndroid = navigator && /android/i.test(navigator.userAgent);

const ScriptEditor: Component<{
    file?: AutomergeVfsFile<{ source: string, }>,
}> = (props) => {
    let [div, setDiv] = createSignal<HTMLDivElement>();
    let [editor2, setEditor2] = createSignal<editor.IStandaloneCodeEditor>();
    onMount(() => {
        let div2 = div();
        if (div2 == undefined) {
            return;
        }
        let editor =
            monaco.editor.create(div2, {
                language: "typescript",
                quickSuggestions: {
                    other: !isAndroid,
                    comments: !isAndroid,
                    strings: !isAndroid,
                },
                acceptSuggestionOnCommitCharacter: !isAndroid,
                acceptSuggestionOnEnter: !isAndroid ? "on" : "off",
                accessibilitySupport: !isAndroid ? "on" : "off",
                theme: "vs-dark",
            });
        setEditor2(editor);
        let model = editor.getModel();
        let skipIt = false;
        let changeHandler = () => {
            if (skipIt) {
                return;
            }
            let source = editor2()?.getModel()?.getValue();
            if (source == undefined) {
                return;
            }
            let file = props.file;
            if (file == undefined) {
                return;
            }
            file.docHandle.change((doc) => {
                doc.source = source;
            });
        };
        let dispose = model?.onDidChangeContent(changeHandler);
        onCleanup(() => {
            if (dispose != undefined) {
                dispose.dispose();
            }
        });
        createComputed(on(
            [
                () => props?.file?.doc?.source,
            ],
            () => {
                skipIt = true;
                try {
                    if (props.file == undefined) {
                        model?.setValue("");
                        return;
                    }
                    model?.setValue(props.file.doc.source);
                } finally {
                    skipIt = false;
                }
            },
        ));    
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
