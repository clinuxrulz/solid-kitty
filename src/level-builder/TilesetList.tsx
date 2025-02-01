import { Component, createUniqueId, For, JSX, onMount } from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore, produce, SetStoreFunction, Store } from "solid-js/store";

type State = {
    tilesets: {
        id: string,
        name: string,
        image: HTMLImageElement,
        blockTable: {
            name: string,
            pos: Vec2,
            size: Vec2,
        }[],
    }[],
};

export class TilesetList {
    private state: Store<State>;
    private setState: SetStoreFunction<State>;

    constructor() {
        let [ state, setState, ] = createStore<State>({
            tilesets: [],
        });
        this.state = state;
        this.setState = setState;
    }

    readonly Render: Component<{
        style?: JSX.CSSProperties | string,
    }> = (props) => {
        let addTilesetInput!: HTMLInputElement;
        let addTileset = () => {
            addTilesetInput.click();
            addTilesetInput.value = "";
        };
        let onAddTileset = (file: File) => {
            let url = URL.createObjectURL(file);
            let image = new Image();
            image.src = url;
            image.onerror = () => {
                URL.revokeObjectURL(url);
            };
            image.onload = () => {
                try {
                    this.setState(
                        "tilesets",
                        produce((tilesets) => {
                            tilesets.push({
                                id: createUniqueId(),
                                name: file.name,
                                image,
                                blockTable: [],
                            });
                        })
                    );
                } finally {
                    URL.revokeObjectURL(url);
                }
            };
        };
        let removeTileset = (tileset: (typeof this.state.tilesets)[0]) => {
            this.setState("tilesets", produce((tilesets) => {
                let idx = tilesets.findIndex((tileset2) => tileset2.id === tileset.id);
                if (idx == -1) {
                    return;
                }
                tilesets.splice(idx, 1);
            }));
        }
        //
        return (
            <div
                style={props.style}
            >
                <div
                    style={{
                        "display": "flex",
                        "flex-direction": "row",
                        "align-items": "flex-end",
                    }}
                >
                    <div
                        style={{
                            "flex-grow": "1",
                            "margin-bottom": "5px",
                        }}
                    >
                        <b>Tilesets:</b>
                    </div>
                    <button
                        class="btn"
                        onClick={addTileset}
                    >
                        <i class="fa-solid fa-circle-plus"></i>
                    </button>
                    <input
                        ref={addTilesetInput}
                        type="file"
                        hidden
                        accept="image/png"
                        onInput={(e) => {
                            if (addTilesetInput.files?.length != 1) {
                                return;
                            }
                            onAddTileset(addTilesetInput.files[0]);
                        }}
                    />
                </div>
                <div
                    class="list-container-2"
                >
                    <For each={this.state.tilesets}>
                        {(tileset) => (
                            <div
                                role="button"
                                class="list-item"
                            >
                                {tileset.name}
                                <div class="list-item-button-container">
                                    <button
                                        class="list-item-button text-right"
                                        type="button"
                                        onClick={() => {
                                            removeTileset(tileset);
                                        }}
                                    >
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </div>
        );
    };
}
