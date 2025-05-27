import { type WorkerShape } from "@valtown/codemirror-ts/worker";
import * as Comlink from "comlink";
import { Component, onMount } from "solid-js";
import { EditorView } from "codemirror";
import { tsFacetWorker, tsSyncWorker, tsLinterWorker, tsHoverWorker, tsAutocompleteWorker } from "@valtown/codemirror-ts";
import { autocompletion } from "@codemirror/autocomplete";

const innerWorker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});
const worker = Comlink.wrap<WorkerShape>(innerWorker);
await worker.initialize();

const CodeMirror: Component = () => {
  const path = "index.ts";
  let div!: HTMLDivElement;
  onMount(() => {
    let editor = new EditorView({
      extensions: [
        tsFacetWorker.of({ worker, path }),
        tsSyncWorker(),
        tsLinterWorker(),
        autocompletion({
          override: [tsAutocompleteWorker()],
        }),
        tsHoverWorker(), 
      ],
      parent: div,
    });
  });
  return (
    <div
      ref={div}
    />
  );
};

export default CodeMirror;

