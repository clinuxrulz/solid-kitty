import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { Vec2 } from "../Vec2";
import { Component, createMemo, JSX, Show } from "solid-js";
import { TextureAtlasList } from "./TextureAtlasList";
import { TextureAtlas } from "./TextureAtlas";

type State = {
};

export class TextureAtlases {
    private state: Store<State>;
    private setState: SetStoreFunction<State>;
    private tilesetList: TextureAtlasList;

    constructor() {
        let [ state, setState, ] = createStore<State>({
        });
        let tilesetList = new TextureAtlasList();
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
        let tileset = new TextureAtlas({
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
