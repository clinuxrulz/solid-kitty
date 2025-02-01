import { Component, Match, Switch } from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore } from "solid-js/store";
import { Tilesets } from "./Tilesets";

type State = {
    selectedTab: "Tilesets" | "Levels",
};

const LevelBuilder: Component = () => {
    let [ state, setState, ] = createStore<State>({
        selectedTab: "Tilesets",
    });
    let tilesets = new Tilesets();
    return (
        <div style={{
            "flex-grow": "1",
            "display": "flex",
            "flex-direction": "column",
            "overflow": "hidden",
        }}>
            <ul class="nav-tabs">
                <li class="nav-item">
                    <button
                        class={state.selectedTab == "Tilesets" ? "nav-link-selected" : "nav-link"}
                        onClick={() => setState("selectedTab", "Tilesets")}
                    >
                        Tilesets
                    </button>
                </li>
                <li class="nav-item">
                    <button
                        class={state.selectedTab == "Levels" ? "nav-link-selected" : "nav-link"}
                        onClick={() => setState("selectedTab", "Levels")}
                    >
                        Levels
                    </button>
                </li>
            </ul>
            <Switch>
                <Match when={state.selectedTab == "Tilesets"}>
                    <tilesets.Render
                        style={{
                            "flex-grow": "1",
                        }}
                    />
                </Match>
                <Match when={state.selectedTab == "Levels"}>
                    <></>
                </Match>
            </Switch>
        </div>
    );
};

export default LevelBuilder;
