import {
    Accessor,
    Component,
    createMemo,
    createResource,
    createSignal,
    onMount,
    Show,
} from "solid-js";
import { VirtualFileSystem as VFS } from "./VirtualFileSystem";

const VirtualFileSystemTest: Component = () => {
    let [vfs] = createResource(() => VFS.init());
    return (
        <Show when={vfs()} keyed fallback={<>Loading...</>}>
            {(vfs2) => {
                if (vfs2.type == "Err") {
                    return vfs2.message;
                }
                let vfs3 = vfs2.value;
                let filesAndFoldersUi = createFilesAndFoldersUI({
                    vfs: vfs3,
                    currentFolderId: () => vfs3.rootFolderId,
                });
                return (
                    <>
                        <filesAndFoldersUi.Render />
                    </>
                );
            }}
        </Show>
    );
};

const createFilesAndFoldersUI: (params: {
    vfs: VFS;
    currentFolderId: Accessor<string>;
}) => {
    refresh: () => void;
    Render: Component;
} = (params) => {
    let [contents, { refetch }] = createResource(
        params.currentFolderId,
        (source) => params.vfs.getFilesAndFolders(source),
    );
    return {
        refresh: () => refetch(),
        Render: () => (
            <Show when={contents()} keyed>
                {(contents2) => {
                    if (contents2.type == "Err") {
                        return contents2.message;
                    }
                    let contents3 = contents2.value;
                    /*
                    // Folder closed
                    <i class="fa-solid fa-folder"></i>
                    // Folder open
                    <i class="fa-solid fa-folder-open"></i>
                    // File
                    <i class="fa-solid fa-file"></i>
                    */
                    let ulElement!: HTMLDivElement;
                    let [lineSize, setLineSize] = createSignal<number>();
                    onMount(() => {
                        let rect = ulElement.getBoundingClientRect();
                        setLineSize(rect.height - 5);
                    });
                    let backgroundSize = createMemo(() => {
                        let lineSize2 = lineSize();
                        if (lineSize2 == undefined) {
                            return "5px 100%";
                        } else {
                            //return `5px ${lineSize2}px`;
                            return "5px 100%";
                        }
                    });
                    return (
                        <>
                            <div
                                ref={ulElement}
                                style={{
                                    "margin-left": "15px",
                                    "margin-top": "-6px",
                                    "padding-top": "6px",
                                    "padding-left": "20px",
                                    background:
                                        "linear-gradient(blue 0 0) 10px",
                                    "background-size": "5px calc(100% - 20px)",
                                    "background-position-y": "0",
                                    "background-repeat": "no-repeat",
                                }}
                            >
                                <ul>
                                    {contents3.map((entry) => (
                                        <>
                                            <li
                                                style={{
                                                    display: "flex",
                                                    "flex-direction": "row",
                                                    "align-items": "center",
                                                    "margin-left": "-20px",
                                                    "padding-left": "30px",
                                                    background:
                                                        "linear-gradient(blue 0 0) 10px",
                                                    "background-size":
                                                        "20px 5px",
                                                    "background-repeat":
                                                        "no-repeat",
                                                }}
                                            >
                                                <div style="font-size: 20pt; display: inline-block; margin-left: 5px; margin-right: 5px;">
                                                    {entry.type == "File" ? (
                                                        <i class="fa-solid fa-file"></i>
                                                    ) : (
                                                        <i class="fa-solid fa-folder-open"></i>
                                                    )}
                                                </div>
                                                {entry.name}
                                                <button
                                                    class="btn"
                                                    style="margin-left: 10px;"
                                                    onClick={async () => {
                                                        await params.vfs.delete(
                                                            entry.id,
                                                        );
                                                        refetch();
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </li>
                                            <Show when={entry.type == "Folder"}>
                                                {(() => {
                                                    let tmp =
                                                        createFilesAndFoldersUI(
                                                            {
                                                                vfs: params.vfs,
                                                                currentFolderId:
                                                                    () =>
                                                                        entry.id,
                                                            },
                                                        );
                                                    return <tmp.Render />;
                                                })()}
                                            </Show>
                                        </>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                Add File:
                                <input
                                    type="file"
                                    onChange={async (e) => {
                                        if (e.currentTarget.files == null) {
                                            return;
                                        }
                                        let files = e.currentTarget.files;
                                        for (let file of files) {
                                            await params.vfs.createFile(
                                                params.currentFolderId(),
                                                file.name,
                                                file,
                                            );
                                        }
                                        refetch();
                                    }}
                                />
                                <button
                                    class="btn"
                                    onClick={async () => {
                                        let folderName =
                                            window.prompt("Enter Folder Name:");
                                        if (folderName == null) {
                                            return;
                                        }
                                        folderName = folderName.trim();
                                        if (folderName.length == 0) {
                                            return;
                                        }
                                        await params.vfs.createFolder(
                                            params.currentFolderId(),
                                            folderName,
                                        );
                                        refetch();
                                    }}
                                >
                                    Add Folder
                                </button>
                            </div>
                        </>
                    );
                }}
            </Show>
        ),
    };
};

export default VirtualFileSystemTest;
