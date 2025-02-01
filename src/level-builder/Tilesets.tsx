import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { Vec2 } from "../Vec2";
import { Component, JSX, Show } from "solid-js";
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
                    <div
                        style={{
                            "flex-grow": "1",
                        }}
                    >
                        <Show when={this.tilesetList.selectedTileset()}>
                            {(tileset) => {
                                let tileset2 = new Tileset({
                                    image: () => tileset().image
                                });
                                return (<tileset2.Render/>);
                            }}
                        </Show>
                    </div>
                </div>
            </div>
        );
    };
}
