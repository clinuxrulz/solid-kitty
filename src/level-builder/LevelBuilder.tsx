import { Component, Switch } from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore } from "solid-js/store";

type State = {
    selectedTab: "Tilesets" | "Levels",
    tilesets: {
        name: string,
        image: HTMLImageElement,
        blockTable: {
            name: string,
            pos: Vec2,
            size: Vec2,
        }[],
    }[],
};

const LevelBuilder: Component = () => {
    let [ state, setState, ] = createStore<State>({
        selectedTab: "Tilesets",
        tilesets: [],
    });
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
                        class="nav-link-selected"
                    >
                        Tilesets
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link">
                        Levels
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default LevelBuilder;
