import {
    Accessor,
    Component,
    createEffect,
    createSelector,
    For,
    JSX,
    on,
} from "solid-js";
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { AsyncResult } from "../AsyncResult";
import { VfsFile, VirtualFileSystem } from "./VirtualFileSystem";
import { EcsWorld } from "../ecs/EcsWorld";
import { textureAtlasComponentType } from "./components/TextureAtlasComponent";
import { registry } from "./components/registry";
import { ReactiveVirtualFileSystem } from "../ReactiveVirtualFileSystem";

type State = {
    textureAtlasFiles: VfsFile[];
    selectedTextureAtlasByFileId: string | undefined;
};

export class TextureAtlasList {
    private state: Store<State>;
    private setState: SetStoreFunction<State>;
    readonly selectedTextureAtlasByFileId: Accessor<string | undefined>;
    readonly Render: Component<{
        style?: JSX.CSSProperties | string;
    }>;

    constructor(params: {
        vfs: Accessor<AsyncResult<ReactiveVirtualFileSystem>>;
        imagesFolderId: Accessor<AsyncResult<string>>;
        imageFiles: Accessor<AsyncResult<VfsFile[]>>;
        textureAtlasesFolderId: Accessor<AsyncResult<string>>;
    }) {
        let [state, setState] = createStore<State>({
            selectedTextureAtlasByFileId: undefined,
            textureAtlasFiles: [],
        });
        //
        createEffect(
            on([params.vfs, params.textureAtlasesFolderId], () => {
                let vfs = params.vfs();
                if (vfs.type != "Success") {
                    return;
                }
                let vfs2 = vfs.value;
                let textureAtlasesFolderId = params.textureAtlasesFolderId();
                if (textureAtlasesFolderId.type != "Success") {
                    return textureAtlasesFolderId;
                }
                let textureAtlasesFolderId2 = textureAtlasesFolderId.value;
                let filesAndFolders = vfs2.getFilesAndFolders(
                    textureAtlasesFolderId2,
                );
                createEffect(
                    on(filesAndFolders, () => {
                        let filesAndFolders2 = filesAndFolders();
                        if (filesAndFolders2.type != "Success") {
                            return;
                        }
                        let filesAndFolders3 = filesAndFolders2.value;
                        let files = filesAndFolders3.filter(
                            (x) => x.type == "File",
                        );
                        setState("textureAtlasFiles", files);
                    }),
                );
            }),
        );
        //
        this.state = state;
        this.setState = setState;
        this.selectedTextureAtlasByFileId = () =>
            state.selectedTextureAtlasByFileId;
        //
        this.Render = (props) => {
            let addTextureAtlasInput!: HTMLInputElement;
            let addTextureAtlas = () => {
                addTextureAtlasInput.click();
                addTextureAtlasInput.value = "";
            };
            let onAddTextureAtlas = async (imageFile: File) => {
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
                let textureAtlasesFolderId = params.textureAtlasesFolderId();
                if (textureAtlasesFolderId.type != "Success") {
                    return;
                }
                let textureAtlasesFolderId2 = textureAtlasesFolderId.value;
                let textureAtlasName = window.prompt(
                    "Enter filename for texture atlas",
                );
                if (textureAtlasName == null) {
                    return;
                }
                textureAtlasName = textureAtlasName.trim();
                if (textureAtlasName.length == 0) {
                    return;
                }
                if (!textureAtlasName.endsWith(".json")) {
                    textureAtlasName += ".json";
                }
                let world = new EcsWorld();
                world.createEntity([
                    textureAtlasComponentType.create({
                        imageRef: imageFile.name,
                    }),
                ]);
                let textureAtlasJson = JSON.stringify(world.toJson());
                await vfs2.createFile(
                    imagesFolderId2,
                    imageFile.name,
                    imageFile,
                );
                let result = await vfs2.createFile(
                    textureAtlasesFolderId2,
                    textureAtlasName,
                    new Blob([textureAtlasJson], { type: "application/json" }),
                );
                if (result.type == "Err") {
                    return;
                }
                let { fileId } = result.value;
                //
                setState("textureAtlasFiles", (x) => [
                    ...x,
                    {
                        type: "File",
                        id: fileId,
                        name: textureAtlasName,
                    },
                ]);
            };
            //
            let selectTextureAtlasFile = (textureAtlasFileId: string) => {
                if (
                    !this.state.textureAtlasFiles.some(
                        (x) => x.id == textureAtlasFileId,
                    )
                ) {
                    return;
                }
                setState("selectedTextureAtlasByFileId", textureAtlasFileId);
            };
            let isSelectedV2 = createSelector(
                () => this.state.selectedTextureAtlasByFileId,
            );
            let removeTextureAtlasFile = async (textureAtlasFileId: string) => {
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
                let textureAtlasData =
                    await vfs2.vfs.readFile(textureAtlasFileId);
                if (textureAtlasData.type == "Err") {
                    return;
                }
                let textureAtlasData2 = await textureAtlasData.value.text();
                let textureAtlasData3 = JSON.parse(textureAtlasData2);
                let world = EcsWorld.fromJson(registry, textureAtlasData3);
                if (world.type == "Err") {
                    console.log(world.message);
                    return;
                }
                let world2 = world.value;
                let entities = world2.entitiesWithComponentType(
                    textureAtlasComponentType,
                );
                if (entities.length != 1) {
                    return;
                }
                let entity = entities[0];
                let textureAtlas = world2.getComponent(
                    entity,
                    textureAtlasComponentType,
                )?.state;
                if (textureAtlas == undefined) {
                    return;
                }
                let imageFilename = textureAtlas.imageRef;
                let filesAndFolders =
                    await vfs2.vfs.getFilesAndFolders(imagesFolderId2);
                if (filesAndFolders.type == "Err") {
                    return;
                }
                let filesAndFolders2 = filesAndFolders.value;
                let imageFile = filesAndFolders2.find(
                    (x) => x.type == "File" && x.name == imageFilename,
                );
                if (imageFile == undefined) {
                    return;
                }
                await vfs2.delete(imageFile.id);
                await vfs2.delete(textureAtlasFileId);
            };
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
                        <button class="btn" onClick={() => addTextureAtlas()}>
                            <i class="fa-solid fa-circle-plus"></i>
                        </button>
                        <input
                            ref={addTextureAtlasInput}
                            type="file"
                            hidden
                            accept="image/png"
                            onInput={(e) => {
                                if (addTextureAtlasInput.files?.length != 1) {
                                    return;
                                }
                                onAddTextureAtlas(
                                    addTextureAtlasInput.files[0],
                                );
                            }}
                        />
                    </div>
                    <div class="list-container-2">
                        <For each={this.state.textureAtlasFiles}>
                            {(textureAtlasFile) => (
                                <div
                                    role="button"
                                    class={
                                        isSelectedV2(textureAtlasFile.id)
                                            ? "list-item-selected"
                                            : "list-item"
                                    }
                                    onClick={() => {
                                        selectTextureAtlasFile(
                                            textureAtlasFile.id,
                                        );
                                    }}
                                >
                                    {textureAtlasFile.name}
                                    <div class="list-item-button-container">
                                        <button
                                            class="list-item-button text-right"
                                            type="button"
                                            onClick={() => {
                                                removeTextureAtlasFile(
                                                    textureAtlasFile.id,
                                                );
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
}
