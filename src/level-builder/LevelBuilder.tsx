import {
    Accessor,
    Component,
    createMemo,
    createResource,
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
    let vfs: Accessor<AsyncResult<VirtualFileSystem>>;
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
            return asyncSuccess(vfs2.value);
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
            let [result] = createResource(() =>
                vfs3.getFilesAndFolders(vfs3.rootFolderId),
            );
            return asyncSuccess(
                createMemo(() => {
                    let result2 = result();
                    if (result2 == undefined) {
                        return asyncPending();
                    }
                    if (result2.type == "Err") {
                        return asyncFailed(result2.message);
                    }
                    return asyncSuccess(result2.value);
                }),
            );
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
                })
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
                })
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
            let [result] = createResource(() =>
                vfs3.getFilesAndFolders(imageFolderId3),
            );
            return asyncSuccess(
                createMemo(() => {
                    let result2 = result();
                    if (result2 == undefined) {
                        return asyncPending();
                    }
                    if (result2.type == "Err") {
                        return asyncFailed(result2.message);
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
    let levels = new Levels({
        vfs,
        imagesFolderId,
        textureAtlasesFolderId,
        levelsFolderId,
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
    vfs: Accessor<AsyncResult<VirtualFileSystem>>,
    folderName: string,
}): Accessor<AsyncResult<string>> {
    let rootFilesAndFolders: Accessor<AsyncResult<VfsFileOrFolder[]>>;
    {
        let rootFilesAndFolders_ = createMemo(() => {
            let vfs = params.vfs();
            if (vfs.type != "Success") {
                return vfs;
            }
            let vfs2 = vfs.value;
            let [ filesAndFolders ] = createResource(() => vfs2.getFilesAndFolders(vfs2.rootFolderId));
            return asyncSuccess(createMemo(() => {
                let filesAndFolders2 = filesAndFolders();
                if (filesAndFolders2 == undefined) {
                    return asyncPending();
                }
                if (filesAndFolders2.type == "Err") {
                    return asyncFailed(filesAndFolders2.message);
                }
                return asyncSuccess(filesAndFolders2.value);
            }));
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
