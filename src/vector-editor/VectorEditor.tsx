import { Component, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import { EcsWorld } from "../ecs/EcsWorld";
import { RenderSystem } from "./systems/RenderSystem";
import { ModeParams } from "./ModeParams";
import { Vec2 } from "../Vec2";
import { Mode } from "./Mode";
import { InsertCatmullRomSpline } from "./modes/InsertCatmullRomSpline";
import { IdleMode } from "./modes/IdleMode";

const VectorEditor: Component = () => {
    let [ state, setState ] = createStore<{
        mode:
            "Idle" |
            "Insert Catmull Rom Spline",
    }>({
        mode: "Idle",
    });
    let screenPtToWorldPt = (pt: Vec2) => pt.clone();
    let worldPtToScreenPt = (pt: Vec2) => pt.clone();
    let world = new EcsWorld();
    let renderSystem = new RenderSystem({
        world,
    });
    let modeParams: ModeParams = {
        screenPtToWorldPt,
        worldPtToScreenPt,
        world: () => world,
        onDone: () => setState("mode", "Idle"),
    };
    let mode = createMemo<Mode>(() => {
        switch (state.mode) {
            case "Idle":
                return new IdleMode(modeParams);
            case "Insert Catmull Rom Spline":
                return new InsertCatmullRomSpline(modeParams);
        }
    });
    let Instructions = () => (<>{mode().instructions?.({})}</>);
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
                    onClick={() => {
                        setState("mode", "Insert Catmull Rom Spline");
                    }}
                >
                    Catmull Rom Spline
                </button>
            </div>
            <div
                style={{
                    "flex-grow": "1",
                    "position": "relative",
                    "display": "flex",
                    "flex-direction": "column",
                }}
            >
                <svg
                    style={{
                        "flex-grow": "1",
                    }}
                >
                    <renderSystem.Render/>
                </svg>
                <div
                    style={{
                        "position": "absolute",
                        "left": "0",
                        "top": "0",
                    }}
                >
                    <Instructions/>
                </div>
            </div>
        </div>
    );
};

export default VectorEditor;
