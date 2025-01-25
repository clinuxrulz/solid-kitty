import { Component, For } from "solid-js";
import { Node } from "./Node";
import { createStore } from "solid-js/store";

type State = {
    nodes: Node[],
};

const ReactiveSimulator: Component = () => {
    let [ state, setState, ] = createStore<State>({
        nodes: [],
    });
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
                    "font-size": "24pt",
                }}
            >
                <button
                >
                    <i class="fa-solid fa-circle-plus"></i>
                </button>
                <button
                >
                    <i class="fa-solid fa-arrows-left-right"></i>
                </button>
                <button
                >
                    <i class="fa-solid fa-arrow-right-long"></i>
                </button>
            </div>
            { /* Main View */}
            <svg
                style={{
                    "flex-grow": "1",
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
