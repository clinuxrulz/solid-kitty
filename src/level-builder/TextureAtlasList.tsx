import {
    Accessor,
    batch,
    Component,
    createEffect,
    createMemo,
    createSelector,
    createUniqueId,
    For,
    JSX,
    onMount,
} from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore, produce, SetStoreFunction, Store } from "solid-js/store";
import { AsyncResult } from "../AsyncResult";
import { VfsFile, VirtualFileSystem } from "./VirtualFileSystem";

type State = {
    selectedTilesetById: string | undefined;
    tilesets: {
        id: string;
        name: string;
        imageRef: string;
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
    readonly selectedTileset: Accessor<State["tilesets"][0] | undefined>;
    readonly dispose: () => void;
    readonly Render: Component<{
        style?: JSX.CSSProperties | string;
    }>;

    constructor(params: {
        vfs: Accessor<AsyncResult<VirtualFileSystem>>,
        imagesFolderId: Accessor<AsyncResult<string>>,
        imageFiles: Accessor<AsyncResult<VfsFile[]>>,
    }) {
        let [state, setState] = createStore<State>({
            selectedTilesetById: undefined,
            tilesets: [],
        });
        //
        createEffect(() => {
            let vfs = params.vfs();
            if (vfs.type != "Success") {
                return;
            }
            let vfs2 = vfs.value;
            let imageFiles = params.imageFiles();
            if (imageFiles.type != "Success") {
                return;
            }
            let imageFiles2 = imageFiles.value;
            (async () => {
                let result: State["tilesets"] = [];
                for (let imageFile of imageFiles2) {
                    let fileData = await vfs2.readFile(imageFile.id);
                    if (fileData.type == "Err") {
                        console.log(fileData.message);
                        continue;
                    }
                    let fileData2 = fileData.value;
                    let url = URL.createObjectURL(fileData2);
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
                                    name: imageFile.name,
                                    imageRef: imageFile.name,
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
                }
                setState("tilesets", result);
            })();
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
        //
        this.dispose = () => {
            for (let textureAtlas of this.state.tilesets) {
                textureAtlas.dispose();
            }
        };
        //
        this.Render = (props) => {
            let addTilesetInput!: HTMLInputElement;
            let addTileset = () => {
                addTilesetInput.click();
                addTilesetInput.value = "";
            };
            let onAddTileset = async (file: File) => {
                // Save to vfs
                let vfs = params.vfs();
                if (vfs.type != "Success") {
                    return;
                }
                let vfs2 = vfs.value;
                let imagesFolderId = params.imagesFolderId();
                if (imagesFolderId.type != "Success") {
                    return;
                }
                let imagesFolderId2 = imagesFolderId.value;
                await vfs2.createFile(imagesFolderId2, file.name, file);
                //
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
                                imageRef: file.name,
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
            let removeTileset = async (tileset: (typeof this.state.tilesets)[0]) => {
                // delete from vfs
                let vfs = params.vfs();
                if (vfs.type != "Success") {
                    return;
                }
                let vfs2 = vfs.value;
                let imagesFolderId = params.imagesFolderId();
                if (imagesFolderId.type != "Success") {
                    return;
                }
                let imagesFolderId2 = imagesFolderId.value;
                let filesAndFolders = await vfs2.getFilesAndFolders(imagesFolderId2);
                if (filesAndFolders.type == "Err") {
                    console.log(filesAndFolders.message);
                    return;
                }
                let filesAndFolders2 = filesAndFolders.value;
                let imageFile = filesAndFolders2.find((x) => x.type == "File" && x.name == tileset.imageRef);
                if (imageFile == undefined) {
                    return;
                }
                await vfs2.deleteFile(imageFile.id);
                //
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
        }
    }
}
