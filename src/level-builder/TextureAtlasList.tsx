import {
    Accessor,
    batch,
    Component,
    createMemo,
    createSelector,
    createUniqueId,
    For,
    JSX,
    onMount,
} from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore, produce, SetStoreFunction, Store } from "solid-js/store";

type State = {
    selectedTilesetById: string | undefined;
    tilesets: {
        id: string;
        name: string;
        image: HTMLImageElement;
        size: Vec2;
        blockTable: {
            name: string;
            pos: Vec2;
            size: Vec2;
        }[];
        dispose: () => void;
    }[];
};

export class TextureAtlasList {
    private state: Store<State>;
    private setState: SetStoreFunction<State>;
    selectedTileset: Accessor<State["tilesets"][0] | undefined>;

    constructor() {
        let [state, setState] = createStore<State>({
            selectedTilesetById: undefined,
            tilesets: [],
        });
        //
        let selectedTileset: Accessor<State["tilesets"][0] | undefined> =
            createMemo(() => {
                if (state.selectedTilesetById == undefined) {
                    return undefined;
                }
                return state.tilesets.find(
                    (x) => x.id === state.selectedTilesetById,
                );
            });
        //
        this.state = state;
        this.setState = setState;
        this.selectedTileset = selectedTileset;
    }

    dispose() {
        for (let textureAtlas of this.state.tilesets) {
            textureAtlas.dispose();
        }
    }

    readonly Render: Component<{
        style?: JSX.CSSProperties | string;
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
            image.style.setProperty("image-rendering", "pixelated");
            image.style.setProperty("pointer-events", "none");
            image.onerror = () => {
                URL.revokeObjectURL(url);
            };
            image.onload = () => {
                image.onload = null;
                let size = Vec2.create(image.width, image.height);
                this.setState(
                    "tilesets",
                    produce((tilesets) => {
                        tilesets.push({
                            id: createUniqueId(),
                            name: file.name,
                            image,
                            size,
                            blockTable: [],
                            dispose: () => {
                                URL.revokeObjectURL(url);
                            },
                        });
                    }),
                );
            };
        };
        let selectTileset = (tilesetId: string) => {
            if (!this.state.tilesets.some((x) => x.id == tilesetId)) {
                return;
            }
            this.setState("selectedTilesetById", tilesetId);
        };
        let removeTileset = (tileset: (typeof this.state.tilesets)[0]) => {
            batch(() => {
                if (this.state.selectedTilesetById == tileset.id) {
                    this.setState("selectedTilesetById", undefined);
                }
                this.setState(
                    "tilesets",
                    produce((tilesets) => {
                        let idx = tilesets.findIndex(
                            (tileset2) => tileset2.id === tileset.id,
                        );
                        if (idx == -1) {
                            return;
                        }
                        tilesets.splice(idx, 1);
                    }),
                );
            });
        };
        //
        let isSelected = createSelector(() => this.state.selectedTilesetById);
        return (
            <div style={props.style}>
                <div
                    style={{
                        display: "flex",
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
                        <b>Texture Atlases:</b>
                    </div>
                    <button class="btn" onClick={addTileset}>
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
                <div class="list-container-2">
                    <For each={this.state.tilesets}>
                        {(tileset) => (
                            <div
                                role="button"
                                class={
                                    isSelected(tileset.id)
                                        ? "list-item-selected"
                                        : "list-item"
                                }
                                onClick={() => {
                                    selectTileset(tileset.id);
                                }}
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
