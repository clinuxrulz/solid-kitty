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
import { EcsWorld } from "../ecs/EcsWorld";
import { textureAtlasComponentType } from "./components/TextureAtlasComponent";
import { registry } from "./components/registry";
import { ReactiveVirtualFileSystem } from "../ReactiveVirtualFileSystem";
import { AutomergeVirtualFileSystem, VfsFile } from "../AutomergeVirtualFileSystem";
import { makeDocumentProjection } from "automerge-repo-solid-primitives";
import { mkAccessorToPromise, uint8ArrayToBase64 } from "../util";

type State = {
    textureAtlasFiles: [string, VfsFile][];
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
        vfs: AutomergeVirtualFileSystem;
        imagesFolderId: Accessor<AsyncResult<string>>;
        imageFiles: Accessor<AsyncResult<[string,VfsFile][]>>;
        textureAtlasesFolderId: Accessor<AsyncResult<string>>;
    }) {
        let [state, setState] = createStore<State>({
            selectedTextureAtlasByFileId: undefined,
            textureAtlasFiles: [],
        });
        //
        createEffect(
            on([params.textureAtlasesFolderId], () => {
                let textureAtlasesFolderId = params.textureAtlasesFolderId();
                if (textureAtlasesFolderId.type != "Success") {
                    return textureAtlasesFolderId;
                }
                let textureAtlasesFolderId2 = textureAtlasesFolderId.value;
                let filesAndFolders = params.vfs.readFolder(
                    textureAtlasesFolderId2,
                );
                createEffect(
                    on(filesAndFolders, () => {
                        let filesAndFolders2 = filesAndFolders();
                        if (filesAndFolders2.type != "Success") {
                            return;
                        }
                        let filesAndFolders3 = filesAndFolders2.value;
                        let filesAndFolders4 = makeDocumentProjection(filesAndFolders3);
                        let files = Object.entries(filesAndFolders4.contents)
                            .flatMap((x) =>
                                x[1].type == "File" ?
                                    [[x[0], x[1]] as [string, VfsFile]] :
                                    []
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
                let imageData = new Uint8Array(await imageFile.arrayBuffer());
                let r = await params.vfs.createFile(
                    imagesFolderId2,
                    imageFile.name,
                    {
                        mimeType: imageFile.type,
                        base64Data: uint8ArrayToBase64(imageData),
                    },
                );
                if (r.type == "Err") {
                    console.log(r.message);
                    return;
                }
                let result = await params.vfs.createFile(
                    textureAtlasesFolderId2,
                    textureAtlasName,
                    world.toJson(),
                );
                if (result.type == "Err") {
                    console.log(result.message);
                    return;
                }
                let fileId = result.value;
                //
                setState("textureAtlasFiles", (x) => [
                    ...x,
                    [
                        textureAtlasName,
                        {
                            type: "File",
                            docUrl: fileId,
                        }
                    ] as [string, VfsFile],
                ]);
                setState("selectedTextureAtlasByFileId", fileId);
            };
            //
            let selectTextureAtlasFile = (textureAtlasFileId: string) => {
                if (
                    !this.state.textureAtlasFiles.some(
                        (x) => x[1].docUrl == textureAtlasFileId,
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
                let textureAtlasesFolderId = params.textureAtlasesFolderId();
                if (textureAtlasesFolderId.type != "Success") {
                    return;
                }
                let textureAtlasesFolderId2 = textureAtlasesFolderId.value;
                let imagesFolderId = params.imagesFolderId();
                if (imagesFolderId.type != "Success") {
                    return;
                }
                let imagesFolderId2 = imagesFolderId.value;
                let textureAtlasData =
                    await mkAccessorToPromise(() => params.vfs.readFile(textureAtlasFileId));
                if (textureAtlasData.type == "Err") {
                    return;
                }
                let textureAtlasData2 = textureAtlasData.value.doc();
                let world = EcsWorld.fromJson(registry, textureAtlasData2);
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
                    await mkAccessorToPromise(() => params.vfs.readFolder(imagesFolderId2));
                if (filesAndFolders.type == "Err") {
                    return;
                }
                let filesAndFolders2 = filesAndFolders.value;
                let imageFileId: string | undefined = undefined;
                for (let x of Object.entries(filesAndFolders2)) {
                    if (x[1].type == "File" && x[0] == imageFilename) {
                        imageFileId = (x[1] as VfsFile).docUrl;
                        break;
                    }
                }
                if (imageFileId == undefined) {
                    return;
                }
                await params.vfs.removeFileOrFolder(imagesFolderId2, imageFilename);
                await params.vfs.removeFileOrFolder(textureAtlasesFolderId2, textureAtlasFileId);
                if (state.selectedTextureAtlasByFileId == textureAtlasFileId) {
                    setState("selectedTextureAtlasByFileId", undefined);
                }
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
                                        isSelectedV2(textureAtlasFile[1].docUrl)
                                            ? "list-item-selected"
                                            : "list-item"
                                    }
                                    onClick={() => {
                                        selectTextureAtlasFile(
                                            textureAtlasFile[1].docUrl,
                                        );
                                    }}
                                >
                                    {textureAtlasFile[0]}
                                    <div class="list-item-button-container">
                                        <button
                                            class="list-item-button text-right"
                                            type="button"
                                            onClick={() => {
                                                removeTextureAtlasFile(
                                                    textureAtlasFile[1].docUrl,
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
