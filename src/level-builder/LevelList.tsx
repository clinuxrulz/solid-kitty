import {
    Accessor,
    Component,
    createEffect,
    createMemo,
    createResource,
    createSelector,
    For,
    JSX,
    on,
} from "solid-js";
import { AsyncResult, asyncSuccess } from "../AsyncResult";
import { createStore } from "solid-js/store";
import { levelComponentType } from "./components/LevelComponent";
import { EcsWorld } from "../ecs/EcsWorld";
import { ReactiveVirtualFileSystem } from "../ReactiveVirtualFileSystem";
import { AutomergeVirtualFileSystem, VfsFile } from "../AutomergeVirtualFileSystem";
import { makeDocumentProjection } from "automerge-repo-solid-primitives";

export class LevelList {
    readonly selectedLevelByFileId: Accessor<string | undefined>;
    readonly Render: Component<{
        style?: JSX.CSSProperties;
    }>;

    constructor(params: {
        vfs: AutomergeVirtualFileSystem;
        levelsFolderId: Accessor<AsyncResult<string>>;
    }) {
        let [state, setState] = createStore<{
            levelFiles: [string,VfsFile][];
            seletedLevelByFileId: string | undefined;
        }>({
            levelFiles: [],
            seletedLevelByFileId: undefined,
        });
        createEffect(
            on([params.levelsFolderId], async () => {
                let levelsFolderId = params.levelsFolderId();
                if (levelsFolderId.type != "Success") {
                    return;
                }
                let levelsFolderId2 = levelsFolderId.value;
                let filesAndFolders = params.vfs.readFolder(levelsFolderId2);
                let filesAndFolders2 = createMemo(() => {
                    let filesAndFolders3 = filesAndFolders();
                    if (filesAndFolders3.type != "Success") {
                        return filesAndFolders3;
                    }
                    return asyncSuccess(makeDocumentProjection(filesAndFolders3.value));
                });
                createEffect(() => {
                    let filesAndFolders3 = filesAndFolders2();
                    if (filesAndFolders3.type != "Success") {
                        return;
                    }
                    let filesAndFolders4 = filesAndFolders3.value;
                    let levelFiles = Object.entries(filesAndFolders4.contents).flatMap(
                        (x) => x[1].type == "File" ? [[x[0], x[1]] as [string, VfsFile]] : [],
                    );
                    setState("levelFiles", levelFiles);
                });
            }),
        );
        this.selectedLevelByFileId = () => state.seletedLevelByFileId;
        this.Render = (props) => {
            let addLevel = async () => {
                let levelsFolderId = params.levelsFolderId();
                if (levelsFolderId.type != "Success") {
                    return;
                }
                let levelsFolderId2 = levelsFolderId.value;
                let levelFilename = window.prompt("Enter name for level:");
                if (levelFilename == null) {
                    return;
                }
                levelFilename = levelFilename.trim();
                if (levelFilename == "") {
                    return;
                }
                levelFilename += ".json";
                let level = levelComponentType.create({
                    tileToShortIdTable: [],
                    mapData: Array(10)
                        .fill(undefined)
                        .map((_) =>
                            Array(10)
                                .fill(undefined)
                                .map((_) => 0),
                        ),
                });
                let world = new EcsWorld();
                world.createEntity([level]);
                let result = await params.vfs.createFile(
                    levelsFolderId2,
                    levelFilename,
                    world.toJson()
                );
                if (result.type == "Err") {
                    return;
                }
                let fileId = result.value;
                setState("levelFiles", (x) => [
                    ...x,
                    [levelFilename, {
                        type: "File",
                        docUrl: fileId,
                    }],
                ]);
                setState("seletedLevelByFileId", fileId);
            };
            let isSelected = createSelector(() => state.seletedLevelByFileId);
            let selectLevel = (levelFileId: string) => {
                setState("seletedLevelByFileId", levelFileId);
            };
            let removeLevel = async (levelFileId: string) => {
                let levelsFolderId = params.levelsFolderId();
                if (levelsFolderId.type != "Success") {
                    return;
                }
                let levelsFolderId2 = levelsFolderId.value;
                await params.vfs.removeFileOrFolder(
                    levelsFolderId2,
                    levelFileId
                );
                if (state.seletedLevelByFileId == levelFileId) {
                    setState("seletedLevelByFileId", undefined);
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
                            <b>Levels:</b>
                        </div>
                        <button class="btn" onClick={() => addLevel()}>
                            <i class="fa-solid fa-circle-plus"></i>
                        </button>
                    </div>
                    <div class="list-container-2">
                        <For each={state.levelFiles}>
                            {(levelFile) => (
                                <div
                                    role="button"
                                    class={
                                        isSelected(levelFile[1].docUrl)
                                            ? "list-item-selected"
                                            : "list-item"
                                    }
                                    onClick={() => {
                                        selectLevel(levelFile[1].docUrl);
                                    }}
                                >
                                    {levelFile[0]}
                                    <div class="list-item-button-container">
                                        <button
                                            class="list-item-button text-right"
                                            type="button"
                                            onClick={() => {
                                                removeLevel(levelFile[1].docUrl);
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
