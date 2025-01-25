import { Component, createMemo, For, onCleanup } from "solid-js";
import { Node } from "./Node";
import { createStore } from "solid-js/store";
import { ModeParams } from "./ModeParams";
import { IdleMode } from "./modes/IdleMode";
import { AddNodeMode } from "./modes/AddNodeMode";
import { AddLinkMode } from "./modes/AddLinkMode";
import { MarkDirtyMode } from "./modes/MarkDirtyMode";
import { RunningMode } from "./modes/RunningMode";

type State = {
    nodes: Node[],
    mode:
        "Idle" |
        "Add Node" |
        "Add Double Link" |
        "Add Single Link" |
        "Mark Dirty" |
        "Running",
};

const ReactiveSimulator: Component = () => {
    let [ state, setState, ] = createStore<State>({
        nodes: [],
        mode: "Idle",
    });
    let keyDownListener = (e: KeyboardEvent) => {
        if (e.key == "Escape") {
            setState("mode", "Idle");
        }
    };
    document.addEventListener("keydown", keyDownListener);
    onCleanup(() => {
        document.removeEventListener("keydown", keyDownListener);
    });
    //
    let modeParams: ModeParams = {
        nodes: () => state.nodes,
        addNode: (node) => {
            setState("nodes", [ ...state.nodes, node, ]);
        },
        removeNode: (node) => {
            setState("nodes", state.nodes.filter((x) => x !== node));
        },
        onDone: () => {
            setState("mode", "Idle");
        },
    };
    //
    let mode = createMemo(() => {
        switch (state.mode) {
            case "Idle":
                return new IdleMode(modeParams);
            case "Add Node":
                return new AddNodeMode(modeParams);
            case "Add Double Link":
                return new AddLinkMode({ modeParams, type: "Double", });
            case "Add Single Link":
                return new AddLinkMode({ modeParams, type: "Single", });
            case "Mark Dirty":
                return new MarkDirtyMode(modeParams);
            case "Running":
                return new RunningMode(modeParams);
        }
    });
    //
    return (
        <div
            style={{
                "flex-grow": "1",
                "display": "flex",
                "flex-direction": "column",
            }}
        >
            { /* Toolbar */}
            <div
                style={{
                    "margin-top": "5px",
                    "margin-bottom": "5px",
                }}
            >
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
                    onClick={() => setState("mode", "Add Node")}
                >
                    <i class="fa-solid fa-circle-plus"></i>
                </button>
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
                    onClick={() => setState("mode", "Add Double Link")}
                >
                    <i class="fa-solid fa-arrows-left-right"></i>
                </button>
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
                    onClick={() => setState("mode", "Add Single Link")}
                >
                    <i class="fa-solid fa-arrow-right-long"></i>
                </button>
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
                    onClick={() => setState("mode", "Mark Dirty")}
                >
                    <i class="fa-solid fa-poo"></i>
                </button>
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
                    onClick={() => setState("mode", "Running")}
                >
                    <i class="fa-solid fa-person-running"></i>
                </button>
            </div>
            { /* Main View */}
            <svg
                style={{
                    "flex-grow": "1",
                    "background-color": "lightgrey",
                }}
            >
                <For each={state.nodes}>
                    {(node) => (<node.Render/>)}
                </For>
            </svg>
        </div>
    );
};

export default ReactiveSimulator;
