import { Component, Match, onCleanup, Switch } from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore } from "solid-js/store";
import { TextureAtlases } from "./TextureAtlases";

type State = {
    selectedTab: "Texture Atlases" | "Levels";
};

const LevelBuilder: Component = () => {
    let [state, setState] = createStore<State>({
        selectedTab: "Texture Atlases",
    });
    let textureAtlases = new TextureAtlases();
    onCleanup(() => {
        textureAtlases.dispose();
    });
    return (
        <div
            style={{
                "flex-grow": "1",
                display: "flex",
                "flex-direction": "column",
                overflow: "hidden",
            }}
        >
            <ul class="nav-tabs">
                <li class="nav-item">
                    <button
                        class={
                            state.selectedTab == "Texture Atlases"
                                ? "nav-link-selected"
                                : "nav-link"
                        }
                        onClick={() =>
                            setState("selectedTab", "Texture Atlases")
                        }
                    >
                        Texture Atlases
                    </button>
                </li>
                <li class="nav-item">
                    <button
                        class={
                            state.selectedTab == "Levels"
                                ? "nav-link-selected"
                                : "nav-link"
                        }
                        onClick={() => setState("selectedTab", "Levels")}
                    >
                        Levels
                    </button>
                </li>
            </ul>
            <Switch>
                <Match when={state.selectedTab == "Texture Atlases"}>
                    <textureAtlases.Render
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
