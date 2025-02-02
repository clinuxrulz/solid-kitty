import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { Vec2 } from "../Vec2";
import { Component, createMemo, JSX, Show } from "solid-js";
import { TilesetList } from "./TilesetList";
import { Tileset } from "./Tileset";

type State = {
};

export class Tilesets {
    private state: Store<State>;
    private setState: SetStoreFunction<State>;
    private tilesetList: TilesetList;

    constructor() {
        let [ state, setState, ] = createStore<State>({
        });
        let tilesetList = new TilesetList();
        this.state = state;
        this.setState = setState;
        this.tilesetList = tilesetList;
    }

    readonly Render: Component<{
        style?: JSX.CSSProperties | string,
    }> = (props) => {
        let selectedTilesetImage = createMemo(() =>
            this.tilesetList.selectedTileset()?.image
        );
        let tileset = new Tileset({
            image: selectedTilesetImage,
        });
        return (
            <div style={props.style}>
                <div
                    style={{
                        "width": "100%",
                        "height": "100%",
                        "overflow": "hidden",
                        "display": "flex",
                        "flex-direction": "row",
                    }}
                >
                    <this.tilesetList.Render/>
                    {/* a visual divider */}
                    <div
                        style={{
                            "border-radius": "3px",
                            "width": "6px",
                            "height": "100%",
                            "background-color": "#bbb",
                        }}
                    />
                    {/* the current tileset content */}
                    <tileset.Render
                        style={{
                            "flex-grow": "1",
                        }}
                    />
                </div>
            </div>
        );
    };
}
