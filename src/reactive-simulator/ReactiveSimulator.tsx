import { Component, For } from "solid-js";
import { Node } from "./Node";
import { createStore } from "solid-js/store";

type State = {
    nodes: Node[],
    mode:
        "Idle" |
        "Add Node" |
        "Add Double Link" |
        "Add Single Link" |
        "Mark Dirty",
};

const ReactiveSimulator: Component = () => {
    let [ state, setState, ] = createStore<State>({
        nodes: [],
        mode: "Idle",
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
                    "margin-top": "5px",
                    "margin-bottom": "5px",
                }}
            >
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
                >
                    <i class="fa-solid fa-circle-plus"></i>
                </button>
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
                >
                    <i class="fa-solid fa-arrows-left-right"></i>
                </button>
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
                >
                    <i class="fa-solid fa-arrow-right-long"></i>
                </button>
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
                >
                    <i class="fa-solid fa-poo"></i>
                </button>
                <button
                    style={{
                        "font-size": "24pt",
                        "margin-left": "5px",
                    }}
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
