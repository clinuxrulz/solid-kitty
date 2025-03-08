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
import { AsyncResult } from "../AsyncResult";
import { VfsFile, VirtualFileSystem } from "./VirtualFileSystem";
import { createStore } from "solid-js/store";
import { levelComponentType } from "./components/LevelComponent";
import { EcsWorld } from "../ecs/EcsWorld";
import { ReactiveVirtualFileSystem } from "../ReactiveVirtualFileSystem";

export class LevelList {
    readonly selectedLevelByFileId: Accessor<string | undefined>;
    readonly Render: Component<{
        style?: JSX.CSSProperties;
    }>;

    constructor(params: {
        vfs: Accessor<AsyncResult<ReactiveVirtualFileSystem>>;
        levelsFolderId: Accessor<AsyncResult<string>>;
    }) {
        let [state, setState] = createStore<{
            levelFiles: VfsFile[];
            seletedLevelByFileId: string | undefined;
        }>({
            levelFiles: [],
            seletedLevelByFileId: undefined,
        });
        createEffect(
            on([params.vfs, params.levelsFolderId], async () => {
                let vfs = params.vfs();
                if (vfs.type != "Success") {
                    return;
                }
                let vfs2 = vfs.value;
                let levelsFolderId = params.levelsFolderId();
                if (levelsFolderId.type != "Success") {
                    return;
                }
                let levelsFolderId2 = levelsFolderId.value;
                let filesAndFolders = vfs2.getFilesAndFolders(levelsFolderId2);
                createEffect(() => {
                    let filesAndFolders2 = filesAndFolders();
                    if (filesAndFolders2.type != "Success") {
                        return;
                    }
                    let filesAndFolders3 = filesAndFolders2.value;
                    let levelFiles = filesAndFolders3.filter(
                        (x) => x.type == "File",
                    );
                    setState("levelFiles", levelFiles);
                });
            }),
        );
        this.selectedLevelByFileId = () => state.seletedLevelByFileId;
        this.Render = (props) => {
            let addLevel = async () => {
                let vfs = params.vfs();
                if (vfs.type != "Success") {
                    return;
                }
                let vfs2 = vfs.value;
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
                let levelJson = JSON.stringify(world.toJson());
                let result = await vfs2.createFile(
                    levelsFolderId2,
                    levelFilename,
                    new Blob([levelJson], { type: "application/json" }),
                );
                if (result.type == "Err") {
                    return;
                }
                let { fileId } = result.value;
                setState("levelFiles", (x) => [
                    ...x,
                    {
                        id: fileId,
                        type: "File",
                        name: levelFilename,
                    },
                ]);
                setState("seletedLevelByFileId", fileId);
            };
            let isSelected = createSelector(() => state.seletedLevelByFileId);
            let selectLevel = (levelFileId: string) => {
                setState("seletedLevelByFileId", levelFileId);
            };
            let removeLevel = async (levelFileId: string) => {
                let vfs = params.vfs();
                if (vfs.type != "Success") {
                    return;
                }
                let vfs2 = vfs.value;
                await vfs2.delete(levelFileId);
                setState("seletedLevelByFileId", undefined);
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
                                        isSelected(levelFile.id)
                                            ? "list-item-selected"
                                            : "list-item"
                                    }
                                    onClick={() => {
                                        selectLevel(levelFile.id);
                                    }}
                                >
                                    {levelFile.name}
                                    <div class="list-item-button-container">
                                        <button
                                            class="list-item-button text-right"
                                            type="button"
                                            onClick={() => {
                                                removeLevel(levelFile.id);
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
