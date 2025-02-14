import { Component } from "solid-js";
import { createStore } from "solid-js/store";
import { EcsWorld } from "../ecs/EcsWorld";
import { RenderSystem } from "./systems/RenderSystem";

const VectorEditor: Component = () => {
    let [ state, setState ] = createStore<{
        mode:
            "Idle" |
            "Insert Catmull Rom Spline",
    }>({
        mode: "Idle",
    });
    let world = new EcsWorld();
    let renderSystem = new RenderSystem({
        world,
    });
    return (
        <div
            style={{
                "width": "100%",
                "height": "100%",
                "display": "flex",
                "flex-direction": "column",
            }}
        >
            <div>
                <button
                    class="btn"
                >
                    Catmull Rom Spline
                </button>
            </div>
            <svg
                style={{
                    "flex-grow": "1",
                }}
            >
                <renderSystem.Render/>
            </svg>
        </div>
    );
};

export default VectorEditor;
