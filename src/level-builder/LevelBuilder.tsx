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
    VfsFile,
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

type State = {
    selectedTab: "Texture Atlases" | "Levels";
};

const IMAGES_FOLDER_NAME = "images";
const TEXTURE_ALIASES_FOLDER_NAME = "texture_aliases";
const LEVELS_FOLDER_NAME = "levels";

const LevelBuilder: Component = () => {
    let [state, setState] = createStore<State>({
        selectedTab: "Texture Atlases",
    });
    let vfs: Accessor<AsyncResult<ReactiveVirtualFileSystem>>;
    {
        let [vfs_] = createResource(() => VirtualFileSystem.init());
        vfs = createMemo(() => {
            let vfs2 = vfs_();
            if (vfs2 == undefined) {
                return asyncPending();
            }
            if (vfs2.type == "Err") {
                console.log(vfs2.message);
                return asyncFailed(vfs2.message);
            }
            let vfs3 = vfs2.value;
            let vfs4 = new ReactiveVirtualFileSystem({ vfs: vfs3 });
            return asyncSuccess(vfs4);
        });
    }
    let rootFolderFilesAndFolders: Accessor<AsyncResult<VfsFileOrFolder[]>>;
    {
        let rootFolderFilesAndFolders_ = createMemo(() => {
            let vfs2 = vfs();
            if (vfs2.type != "Success") {
                return vfs2;
            }
            let vfs3 = vfs2.value;
            return asyncSuccess(vfs3.getFilesAndFolders(vfs3.rootFolderId));
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
            vfs,
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
                    vfs,
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
                    vfs,
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
    let imageFiles: Accessor<AsyncResult<VfsFile[]>>;
    {
        let imageFiles_ = createMemo(() => {
            let vfs2 = vfs();
            if (vfs2.type != "Success") {
                return vfs2;
            }
            let vfs3 = vfs2.value;
            let imagesFolderId2 = imagesFolderId();
            if (imagesFolderId2.type != "Success") {
                return imagesFolderId2;
            }
            let imageFolderId3 = imagesFolderId2.value;
            let result = vfs3.getFilesAndFolders(imageFolderId3);
            return asyncSuccess(
                createMemo(() => {
                    let result2 = result();
                    if (result2.type != "Success") {
                        return result2;
                    }
                    return asyncSuccess(
                        result2.value.filter((x) => x.type == "File"),
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
        vfs,
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
            let vfs2 = vfs();
            if (vfs2.type != "Success") {
                return vfs2;
            }
            let vfs3 = vfs2.value;
            let textureAtlasesFolderId2 = textureAtlasesFolderId();
            if (textureAtlasesFolderId2.type != "Success") {
                return textureAtlasesFolderId2;
            }
            let textureAtlasesFolderId3 = textureAtlasesFolderId2.value;
            let filesAndFolders = vfs3.getFilesAndFolders(
                textureAtlasesFolderId3,
            );
            return asyncSuccess(
                createMemo(() => {
                    let filesAndFolders2 = filesAndFolders();
                    if (filesAndFolders2.type != "Success") {
                        return filesAndFolders2;
                    }
                    let filesAndFolders3 = filesAndFolders2.value;
                    return asyncSuccess(
                        filesAndFolders3.filter((x) => x.type == "File"),
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
                result.set(imageFile.name, imageFile);
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
            let vfs2 = vfs();
            if (vfs2.type != "Success") {
                return vfs2;
            }
            let vfs3 = vfs2.value;
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
                        let textureAtlasData = vfs3.readFile(
                            textureAtlasFile.id,
                        );
                        return createMemo(() => {
                            let textureAtlasData2 = textureAtlasData();
                            if (textureAtlasData2.type != "Success") {
                                return textureAtlasData2;
                            }
                            let textureAtlasData3 = textureAtlasData2.value;
                            let [textureAtlasData4] = createResource(() =>
                                textureAtlasData3.text(),
                            );
                            return asyncSuccess(
                                createMemo(() => {
                                    let textureAtlasData5 = textureAtlasData4();
                                    if (textureAtlasData5 == undefined) {
                                        return asyncPending();
                                    }
                                    let textureAtlasData6 =
                                        JSON.parse(textureAtlasData5);
                                    let world = EcsWorld.fromJson(
                                        registry,
                                        textureAtlasData6,
                                    );
                                    if (world.type == "Err") {
                                        return asyncFailed(world.message);
                                    }
                                    let world2 = world.value;
                                    let entities =
                                        world2.entitiesWithComponentType(
                                            textureAtlasComponentType,
                                        );
                                    if (entities.length != 1) {
                                        return asyncFailed(
                                            "Expected expect exactly one texture atlas entity.",
                                        );
                                    }
                                    let entity = entities[0];
                                    let textureAtlas = world2.getComponent(
                                        entity,
                                        textureAtlasComponentType,
                                    )?.state;
                                    if (textureAtlas == undefined) {
                                        return asyncFailed(
                                            "Texture atlas not found in texture atlas file.",
                                        );
                                    }
                                    let frameEntities =
                                        world2.entitiesWithComponentType(
                                            frameComponentType,
                                        );
                                    let frames = frameEntities.flatMap(
                                        (frameEntity) =>
                                            opToArr(
                                                world2.getComponent(
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
                                    let imageData = vfs3.readFile(imageFile.id);
                                    return asyncSuccess(
                                        createMemo(() => {
                                            let imageData2 = imageData();
                                            if (imageData2.type != "Success") {
                                                return imageData2;
                                            }
                                            let imageData3 = imageData2.value;
                                            let imageUrl =
                                                URL.createObjectURL(imageData3);
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
                                                            textureAtlasFile.name,
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
        vfs,
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
            <ul class="nav-tabs">
                <li class="nav-item">
                    <button
                        class={
                            state.selectedTab == "Texture Atlases"
                                ? "nav-link-selected"
                                : "nav-link"
                        }
                        onClick={() =>
                            setState("selectedTab", "Texture Atlases")
                        }
                    >
                        Texture Atlases
                    </button>
                </li>
                <li class="nav-item">
                    <button
                        class={
                            state.selectedTab == "Levels"
                                ? "nav-link-selected"
                                : "nav-link"
                        }
                        onClick={() => setState("selectedTab", "Levels")}
                    >
                        Levels
                    </button>
                </li>
            </ul>
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
    vfs: Accessor<AsyncResult<ReactiveVirtualFileSystem>>;
    folderName: string;
}): Accessor<AsyncResult<string>> {
    let rootFilesAndFolders: Accessor<AsyncResult<VfsFileOrFolder[]>>;
    {
        let rootFilesAndFolders_ = createMemo(() => {
            let vfs = params.vfs();
            if (vfs.type != "Success") {
                return vfs;
            }
            let vfs2 = vfs.value;
            return asyncSuccess(vfs2.getFilesAndFolders(vfs2.rootFolderId));
        });
        rootFilesAndFolders = createMemo(() => {
            let tmp = rootFilesAndFolders_();
            if (tmp.type != "Success") {
                return tmp;
            }
            return tmp.value();
        });
    }
    let folderId: Accessor<AsyncResult<string>>;
    {
        let folderId_ = createMemo(() => {
            let vfs = params.vfs();
            if (vfs.type != "Success") {
                return vfs;
            }
            let vfs2 = vfs.value;
            let rootFilesAndFolders2 = rootFilesAndFolders();
            if (rootFilesAndFolders2.type != "Success") {
                return rootFilesAndFolders2;
            }
            let result = rootFilesAndFolders2.value.find(
                (x) => x.type == "Folder" && x.name == params.folderName,
            );
            if (result != undefined) {
                return asyncSuccess(() => asyncSuccess(result.id));
            }
            let [result2] = createResource(() =>
                vfs2.createFolder(vfs2.rootFolderId, params.folderName),
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
                    return asyncSuccess(result3.value.folderId);
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
