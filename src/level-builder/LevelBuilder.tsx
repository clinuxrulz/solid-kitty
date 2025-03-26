import {
    Accessor,
    Component,
    createMemo,
    createResource,
    mapArray,
    Match,
    onCleanup,
    Switch,
} from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore } from "solid-js/store";
import { TextureAtlases } from "./TextureAtlases";
import { EcsWorld } from "../ecs/EcsWorld";
import {
    VfsFileOrFolder,
    VirtualFileSystem,
} from "./VirtualFileSystem";
import {
    asyncFailed,
    asyncPending,
    AsyncResult,
    asyncSuccess,
} from "../AsyncResult";
import { Levels } from "./Levels";
import { registry } from "./components/registry";
import {
    textureAtlasComponentType,
    TextureAtlasState,
} from "./components/TextureAtlasComponent";
import { err, ok, Result } from "../kitty-demo/Result";
import { frameComponentType, FrameState } from "./components/FrameComponent";
import { opToArr } from "../kitty-demo/util";
import { ReactiveVirtualFileSystem } from "../ReactiveVirtualFileSystem";
import { AutomergeVirtualFileSystem, VfsFile, VfsFolderContents } from "../AutomergeVirtualFileSystem";
import { makeDocumentProjection } from "automerge-repo-solid-primitives";
import { Doc } from "@automerge/automerge-repo";
import { base64ToUint8Array } from "../util";
import { EcsWorldAutomergeProjection } from "../ecs/EcsWorldAutomergeProjection";

type State = {
    selectedTab: "Texture Atlases" | "Levels";
};

const IMAGES_FOLDER_NAME = "images";
const TEXTURE_ALIASES_FOLDER_NAME = "texture_aliases";
const LEVELS_FOLDER_NAME = "levels";

const LevelBuilder: Component<{
    vfs: AutomergeVirtualFileSystem,
}> = (props) => {
    let [state, setState] = createStore<State>({
        selectedTab: "Texture Atlases",
    });
    let rootFolderFilesAndFolders: Accessor<AsyncResult<Doc<VfsFolderContents>>>;
    {
        let rootFolderFilesAndFolders_ = createMemo(() => {
            let rootFolderId = props.vfs.rootFolderId();
            if (rootFolderId.type != "Success") {
                return rootFolderId;
            }
            let rootFolderId2 = rootFolderId.value;
            let folderContents = props.vfs.readFolder(rootFolderId2);
            return asyncSuccess(createMemo(() => {
                let folderContents2 = folderContents();
                if (folderContents2.type != "Success") {
                    return folderContents2;
                }
                let folderContents3 = folderContents2.value;
                return asyncSuccess(makeDocumentProjection(folderContents3));
            }));
        });
        rootFolderFilesAndFolders = createMemo(() => {
            let tmp = rootFolderFilesAndFolders_();
            if (tmp.type != "Success") {
                return tmp;
            }
            return tmp.value();
        });
    }
    let imagesFolderId: Accessor<AsyncResult<string>> =
        createGetOrCreateRootFolderId({
            vfs: props.vfs,
            folderName: IMAGES_FOLDER_NAME,
        });
    let textureAtlasesFolderId: Accessor<AsyncResult<string>>;
    {
        let textureAtlasesFolderId_ = createMemo(() => {
            // Wait for image folder to be created first
            let imagesFolderId2 = imagesFolderId();
            if (imagesFolderId2.type != "Success") {
                return imagesFolderId2;
            }
            //
            return asyncSuccess(
                createGetOrCreateRootFolderId({
                    vfs: props.vfs,
                    folderName: TEXTURE_ALIASES_FOLDER_NAME,
                }),
            );
        });
        textureAtlasesFolderId = createMemo(() => {
            let tmp = textureAtlasesFolderId_();
            if (tmp.type != "Success") {
                return tmp;
            }
            return tmp.value();
        });
    }
    let levelsFolderId: Accessor<AsyncResult<string>>;
    {
        let levelsFolderId_ = createMemo(() => {
            // Wait for image folder and texture atlas folder to be created first
            let imagesFolderId2 = imagesFolderId();
            if (imagesFolderId2.type != "Success") {
                return imagesFolderId2;
            }
            let textureAtlasesFolderId2 = textureAtlasesFolderId();
            if (textureAtlasesFolderId2.type != "Success") {
                return textureAtlasesFolderId2;
            }
            //
            return asyncSuccess(
                createGetOrCreateRootFolderId({
                    vfs: props.vfs,
                    folderName: LEVELS_FOLDER_NAME,
                }),
            );
        });
        levelsFolderId = createMemo(() => {
            let tmp = levelsFolderId_();
            if (tmp.type != "Success") {
                return tmp;
            }
            return tmp.value();
        });
    }
    let imageFiles: Accessor<AsyncResult<[string,VfsFile][]>>;
    {
        let imageFiles_ = createMemo(() => {
            let imagesFolderId2 = imagesFolderId();
            if (imagesFolderId2.type != "Success") {
                return imagesFolderId2;
            }
            let imageFolderId3 = imagesFolderId2.value;
            let result = props.vfs.readFolder(imageFolderId3);
            return asyncSuccess(
                createMemo(() => {
                    let result2 = result();
                    if (result2.type != "Success") {
                        return result2;
                    }
                    let result3 = makeDocumentProjection(result2.value);
                    return asyncSuccess(
                        Object.entries(result3.contents).flatMap(
                            (x) => x[1].type == "File" ?
                                [[x[0], x[1]] as [string, VfsFile]] : []
                        ),
                    );
                }),
            );
        });
        imageFiles = createMemo(() => {
            let tmp = imageFiles_();
            if (tmp.type != "Success") {
                return tmp;
            }
            return tmp.value();
        });
    }
    let textureAtlases = new TextureAtlases({
        vfs: props.vfs,
        imagesFolderId,
        imageFiles,
        textureAtlasesFolderId,
    });
    onCleanup(() => {
        textureAtlases.dispose();
    });
    // Keep all tiles available for level creation
    let textureAtlasWithImageAndFramesList: Accessor<
        AsyncResult<
            {
                textureAtlasFilename: string;
                textureAtlas: TextureAtlasState;
                image: HTMLImageElement;
                frames: FrameState[];
            }[]
        >
    >;
    {
        let textureAtlasFiles_ = createMemo(() => {
            let textureAtlasesFolderId2 = textureAtlasesFolderId();
            if (textureAtlasesFolderId2.type != "Success") {
                return textureAtlasesFolderId2;
            }
            let textureAtlasesFolderId3 = textureAtlasesFolderId2.value;
            let filesAndFolders = props.vfs.readFolder(
                textureAtlasesFolderId3,
            );
            return asyncSuccess(
                createMemo(() => {
                    let filesAndFolders2 = filesAndFolders();
                    if (filesAndFolders2.type != "Success") {
                        return filesAndFolders2;
                    }
                    let filesAndFolders3 = makeDocumentProjection(filesAndFolders2.value);
                    return asyncSuccess(
                        Object.entries(filesAndFolders3.contents)
                            .flatMap((x) =>
                                x[1].type == "File" ?
                                    [[x[0], x[1]] as [ string, VfsFile, ]] :
                                    []
                            )
                    );
                }),
            );
        });
        let imageFilenameFileMap = createMemo(() => {
            let imageFiles2 = imageFiles();
            if (imageFiles2.type != "Success") {
                return imageFiles2;
            }
            let imageFiles3 = imageFiles2.value;
            let result: Map<string, VfsFile> = new Map();
            for (let imageFile of imageFiles3) {
                result.set(imageFile[0], imageFile[1]);
            }
            return asyncSuccess(result);
        });
        let textureAtlasFiles = createMemo(() => {
            let tmp = textureAtlasFiles_();
            if (tmp.type != "Success") {
                return tmp;
            }
            return tmp.value();
        });
        let textureAtlasFilesAsyncType = createMemo(
            () => textureAtlasFiles().type,
        );
        let textureAtlases_ = createMemo(() => {
            let imageFilenameFileMap2 = imageFilenameFileMap();
            if (imageFilenameFileMap2.type != "Success") {
                return imageFilenameFileMap2;
            }
            let imageFilenameFileMap3 = imageFilenameFileMap2.value;
            if (textureAtlasFilesAsyncType() != "Success") {
                return textureAtlasFiles() as AsyncResult<never>;
            }
            let textureAtlasFiles2 = createMemo(() => {
                let tmp = textureAtlasFiles();
                if (tmp.type != "Success") {
                    throw new Error("Unreachable");
                }
                return tmp.value;
            });
            return asyncSuccess(
                createMemo(
                    mapArray(textureAtlasFiles2, (textureAtlasFile) => {
                        let textureAtlasData = props.vfs.readFile(textureAtlasFile[1].docUrl);
                        return createMemo(() => {
                            let textureAtlasData2 = textureAtlasData();
                            if (textureAtlasData2.type != "Success") {
                                return textureAtlasData2;
                            }
                            let textureAtlasData3 = textureAtlasData2.value;
                            let r = EcsWorldAutomergeProjection.create(
                                registry,
                                textureAtlasData3,
                            );
                            if (r.type == "Err") {
                                return asyncFailed(r.message);
                            }
                            let textureAtlasWorld = r.value;
                            return asyncSuccess(
                                createMemo(() => {
                                    let world = textureAtlasWorld;
                                    let entities =
                                        world.entitiesWithComponentType(
                                            textureAtlasComponentType,
                                        );
                                    if (entities.length != 1) {
                                        return asyncFailed(
                                            "Expected expect exactly one texture atlas entity.",
                                        );
                                    }
                                    let entity = entities[0];
                                    let textureAtlas = world.getComponent(
                                        entity,
                                        textureAtlasComponentType,
                                    )?.state;
                                    if (textureAtlas == undefined) {
                                        return asyncFailed(
                                            "Texture atlas not found in texture atlas file.",
                                        );
                                    }
                                    let frameEntities =
                                        world.entitiesWithComponentType(
                                            frameComponentType,
                                        );
                                    let frames = frameEntities.flatMap(
                                        (frameEntity) =>
                                            opToArr(
                                                world.getComponent(
                                                    frameEntity,
                                                    frameComponentType,
                                                )?.state,
                                            ),
                                    );
                                    let textureAtlas2 = textureAtlas;
                                    let imageFilename = textureAtlas2.imageRef;
                                    let imageFile =
                                        imageFilenameFileMap3.get(
                                            imageFilename,
                                        );
                                    if (imageFile == undefined) {
                                        return asyncFailed(
                                            "Texture atlas referenced image not found.",
                                        );
                                    }
                                    let imageData = props.vfs.readFile<{
                                        mimeType: string,
                                        base64Data: string,
                                    }>(imageFile.docUrl);
                                    let imageData2 = createMemo(() => {
                                        let imageData3 = imageData();
                                        if (imageData3.type != "Success") {
                                            return imageData3;
                                        }
                                        return asyncSuccess(makeDocumentProjection(imageData3.value));
                                    });
                                    return asyncSuccess(
                                        createMemo(() => {
                                            let imageData3 = imageData2();
                                            if (imageData3.type != "Success") {
                                                return imageData3;
                                            }
                                            let imageData4 = imageData3.value;
                                            let blob = new Blob(
                                                [ base64ToUint8Array(imageData4.base64Data), ],
                                                { "type": imageData4.mimeType, }
                                            );
                                            let imageUrl =
                                                URL.createObjectURL(blob);
                                            onCleanup(() =>
                                                URL.revokeObjectURL(imageUrl),
                                            );
                                            let [image] = createResource(
                                                () =>
                                                    new Promise<
                                                        Result<HTMLImageElement>
                                                    >((resolve) => {
                                                        let image2 =
                                                            new Image();
                                                        image2.src = imageUrl;
                                                        image2.onerror = () => {
                                                            resolve(
                                                                err(
                                                                    "Failed to load image.",
                                                                ),
                                                            );
                                                        };
                                                        image2.onload = () => {
                                                            resolve(ok(image2));
                                                        };
                                                    }),
                                            );
                                            return asyncSuccess(
                                                createMemo(() => {
                                                    let image2 = image();
                                                    if (image2 == undefined) {
                                                        return asyncPending();
                                                    }
                                                    if (image2.type == "Err") {
                                                        return asyncFailed(
                                                            image2.message,
                                                        );
                                                    }
                                                    let image3 = image2.value;
                                                    return asyncSuccess({
                                                        textureAtlasFilename:
                                                            textureAtlasFile[0],
                                                        textureAtlas:
                                                            textureAtlas2,
                                                        image: image3,
                                                        frames,
                                                    });
                                                }),
                                            );
                                        }),
                                    );
                                }),
                            );
                        });
                    }),
                ),
            );
        });
        textureAtlasWithImageAndFramesList = createMemo(() => {
            let result: {
                textureAtlasFilename: string;
                textureAtlas: TextureAtlasState;
                image: HTMLImageElement;
                frames: FrameState[];
            }[] = [];
            let tmp = textureAtlases_();
            if (tmp.type != "Success") {
                return tmp;
            }
            let tmp2 = tmp.value();
            for (let tmp3 of tmp2) {
                let tmp4 = tmp3();
                if (tmp4.type != "Success") {
                    return tmp4;
                }
                let tmp5 = tmp4.value();
                if (tmp5.type != "Success") {
                    return tmp5;
                }
                let tmp6 = tmp5.value();
                if (tmp6.type != "Success") {
                    return tmp6;
                }
                let tmp7 = tmp6.value();
                if (tmp7.type != "Success") {
                    return tmp7;
                }
                let tmp8 = tmp7.value;
                result.push(tmp8);
            }
            return asyncSuccess(result);
        });
    }
    //
    let levels = new Levels({
        vfs: props.vfs,
        imagesFolderId,
        textureAtlasesFolderId,
        levelsFolderId,
        textureAtlasWithImageAndFramesList,
    });
    return (
        <div
            style={{
                "flex-grow": "1",
                display: "flex",
                "flex-direction": "column",
                overflow: "hidden",
            }}
        >
            <div role="tablist" class="tabs tabs-box">
                <a
                    role="tab"
                    classList={{
                        tab: true,
                        "tab-active": state.selectedTab == "Texture Atlases",
                    }}
                    onClick={() => setState("selectedTab", "Texture Atlases")}
                >
                    Texture Atlases
                </a>
                <a
                    role="tab"
                    classList={{
                        tab: true,
                        "tab-active": state.selectedTab == "Levels",
                    }}
                    onClick={() => setState("selectedTab", "Levels")}
                >
                    Levels
                </a>
            </div>
            <Switch>
                <Match when={state.selectedTab == "Texture Atlases"}>
                    <textureAtlases.Render
                        style={{
                            "flex-grow": "1",
                        }}
                    />
                </Match>
                <Match when={state.selectedTab == "Levels"}>
                    <levels.Render
                        style={{
                            "flex-grow": "1",
                        }}
                    />
                </Match>
            </Switch>
        </div>
    );
};

function createGetOrCreateRootFolderId(params: {
    vfs: AutomergeVirtualFileSystem;
    folderName: string;
}): Accessor<AsyncResult<string>> {
    let rootFilesAndFolders: Accessor<AsyncResult<Doc<VfsFolderContents>>>;
    {
        let rootFolderFilesAndFolders_ = createMemo(() => {
            let rootFolderId = params.vfs.rootFolderId();
            if (rootFolderId.type != "Success") {
                return rootFolderId;
            }
            let rootFolderId2 = rootFolderId.value;
            let folderContents = params.vfs.readFolder(rootFolderId2);
            return asyncSuccess(createMemo(() => {
                let folderContents2 = folderContents();
                if (folderContents2.type != "Success") {
                    return folderContents2;
                }
                let folderContents3 = folderContents2.value;
                return asyncSuccess(makeDocumentProjection(folderContents3));
            }));
        });
        rootFilesAndFolders = createMemo(() => {
            let tmp = rootFolderFilesAndFolders_();
            if (tmp.type != "Success") {
                return tmp;
            }
            return tmp.value();
        });
    }
    let folderId: Accessor<AsyncResult<string>>;
    {
        let folderId_ = createMemo(() => {
            let rootFolderId = params.vfs.rootFolderId();
            if (rootFolderId.type != "Success") {
                return rootFolderId;
            }
            let rootFolderId2 = rootFolderId.value;
            let rootFilesAndFolders2 = rootFilesAndFolders();
            if (rootFilesAndFolders2.type != "Success") {
                return rootFilesAndFolders2;
            }
            let rootFilesAndFolders3 = rootFilesAndFolders2.value;
            let result = rootFilesAndFolders3.contents[params.folderName];
            if (result != undefined) {
                return asyncSuccess(() => asyncSuccess(result.docUrl));
            }
            let [result2] = createResource(() =>
                params.vfs.createFolder(rootFolderId2, params.folderName)
            );
            return asyncSuccess(
                createMemo(() => {
                    let result3 = result2();
                    if (result3 == undefined) {
                        return asyncPending();
                    }
                    if (result3.type == "Err") {
                        return asyncFailed(result3.message);
                    }
                    return asyncSuccess(result3.value);
                }),
            );
        });
        folderId = createMemo(() => {
            let tmp = folderId_();
            if (tmp.type != "Success") {
                return tmp;
            }
            return tmp.value();
        });
    }
    return folderId;
}

export default LevelBuilder;
