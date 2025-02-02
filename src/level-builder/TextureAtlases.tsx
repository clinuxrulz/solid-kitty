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
    private textureAtlasList: TextureAtlasList;
    private textureAtlas: TextureAtlas;

    constructor() {
        let [ state, setState, ] = createStore<State>({
        });
        let textureAtlasList = new TextureAtlasList();
        let selectedTilesetImage = createMemo(() =>
            textureAtlasList.selectedTileset()?.image
        );
        let textureAtlas = new TextureAtlas({
            image: selectedTilesetImage,
            size: createMemo(() => textureAtlasList.selectedTileset()?.size),
        });
        this.state = state;
        this.setState = setState;
        this.textureAtlasList = textureAtlasList;
        this.textureAtlas = textureAtlas;
    }

    dispose() {
        this.textureAtlasList.dispose();
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
                    <this.textureAtlasList.Render/>
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
                    <this.textureAtlas.Render
                        style={{
                            "flex-grow": "1",
                        }}
                    />
                </div>
            </div>
        );
    };
}
