import { Accessor, Component, createComputed, createMemo, createResource, createSignal, onCleanup, Show } from "solid-js";
import { FileTree } from "../solid-fs-components/file-tree";
import { AutomergeVfsFile, AutomergeVfsFolder, AutomergeVirtualFileSystem, AutomergeVirtualFileSystemState, createAutomergeFileSystem } from "../AutomergeVirtualFileSystem";
import { DocHandle, isValidAutomergeUrl, Repo } from "@automerge/automerge-repo";
import { asyncFailed, AsyncResult, asyncSuccess } from "../AsyncResult";
import { createRoot } from "solid-js";
import { DefaultIndentGuide } from "../solid-fs-components/file-tree-defaults";
import { DirEnt } from "../solid-fs-components/create-file-system";
import { err, Result } from "../kitty-demo/Result";
import { ReactiveMap } from "@solid-primitives/map";

export const createFileSystemExplorer: (props: {
    repo: Repo,
    docUrl: string,
	selected?: string,
	onSelect?(path: string): void,
}) => {
    fs: Accessor<Fs<Blob>>,
    isSelected: (path: string) => boolean,
    selectionCount: () => number,
    Render: Component,
} = (props) => {
    let fs  = createMemo(() => createAutomergeFs(props.repo, props.docUrl));
    let selectionMap = new ReactiveMap<string,Accessor<boolean>>();
    let isSelected = (path: string) => selectionMap.get(path)?.() ?? false;
    let [ selectionCount, setSelectionCount, ] = createSignal(0);
    let Render: Component = () => (
        <div
            style={{
                "width": "100%",
                "height": "100%",
            }}
        >
            <Show when={fs()}>
                {(fs2) => (
                    <FileTree
                        fs={fs2()}
                        style={{ display: "grid", height: "100vh", "align-content": "start" }}
                    >
                        {(dirEnt) => {
                            createComputed(() => {
                                let path = dirEnt.path;
                                let selected = () => dirEnt.selected;
                                createComputed(() => {
                                    if (!selected()) {
                                        return;
                                    }
                                    setSelectionCount((x) => x + 1);
                                    onCleanup(() => {
                                        setSelectionCount((x) => x - 1);
                                    });
                                });
                                selectionMap.set(path, selected);
                                onCleanup(() => {
                                    if (selectionMap.get(path) === selected) {
                                        selectionMap.delete(path)
                                    }
                                });
                            });
                            return (
                                <FileTree.DirEnt
                                    style={{
                                        "text-align": "left",
                                        display: "flex",
                                        margin: "0px",
                                        padding: "0px",
                                        border: "none",
                                        color: "white",
                                        background: dirEnt.selected ? "blue" : "none",
                                    }}
                                >
                                    <FileTree.IndentGuides
                                        guide={() => <DefaultIndentGuide color="white" width={15} />}
                                    />
                                    <FileTree.Opened
                                        closed="+"
                                        opened="-"
                                        style={{ width: "15px", "text-align": "center" }}
                                    />
                                    {dirEnt.name}
                                </FileTree.DirEnt>
                            );
                        }}
                    </FileTree>
                )}
            </Show>
        </div>
    );
    let element = Render({});
    let Render2: Component = () => element;
    return {
        fs,
        isSelected,
        selectionCount,
        Render: Render2,
    };
};

interface Fs<T> {
    exists(path: string): boolean;
    getType(path: string): DirEnt<T>["type"];
    readdir: {
        (path: string, options: {
            withFileTypes: true;
        }): Array<{
            type: "dir" | "file";
            path: string;
        }>;
        (path: string): Array<string>;
    };
    mkdir(path: string, options?: {
        recursive?: boolean;
    }): void;
    readFile(path: string): T;
    rename(previous: string, next: string): void;
    rm(path: string, options?: {
        force?: boolean;
        recursive?: boolean;
    }): void;
    writeFile(path: string, source: T): void;
};

export function createAutomergeFs(
    repo: Repo,
    docUrl: string
): Fs<Blob> {
    if (!isValidAutomergeUrl(docUrl)) {
        throw new Error("Invalid automerge url.");
    }
    let [ docHandle, ] = createResource(() => repo.find<AutomergeVirtualFileSystemState>(docUrl));
    let vfs = new AutomergeVirtualFileSystem({
        repo,
        docHandle: () => docHandle(),
    });
    let accessCache: {
        [path: string]: {
            fileOrFolder: Accessor<AsyncResult<{
                type: "File",
                value: Accessor<AsyncResult<AutomergeVfsFile<any>>>,
            } | {
                type: "Folder",
                value: Accessor<AsyncResult<AutomergeVfsFolder>>,
            }>>,
            refCount: number,
            dispose: () => void,
        },
    } = {};;
    let navigate = (path: string): Accessor<AsyncResult<{
        type: "File",
        value: Accessor<AsyncResult<AutomergeVfsFile<any>>>,
    } | {
        type: "Folder",
        value: Accessor<AsyncResult<AutomergeVfsFolder>>,
    }>> => {
        path = path.trim();
        if (path.endsWith("/")) {
            path = path.slice(0, path.length-1);
        }
        path = path.trim();
        if (accessCache[path] != undefined) {
            let r = accessCache[path];
            r.refCount++;
            onCleanup(() => {
                r.refCount--;
                if (r.refCount == 0) {
                    r.dispose();
                }
            });
            return r.fileOrFolder;
        } else {
            if (path == "") {
                let { folder, dispose, } = createRoot((dispose) => {
                    let folder = vfs.rootFolder();
                    return {
                        folder,
                        dispose,
                    };
                });
                accessCache[path] = {
                    fileOrFolder: createMemo(() => asyncSuccess({
                        type: "Folder" as const,
                        value: folder,
                    })),
                    refCount: 1,
                    dispose,
                };
                let r = accessCache[path];
                onCleanup(() => {
                    r.refCount--;
                    if (r.refCount == 0) {
                        r.dispose();
                    }
                });
                return accessCache[path].fileOrFolder;
            }
            let tailIdx = path.lastIndexOf("/") ?? 0;
            let tail = path.slice(tailIdx+1);
            let pre = path.slice(0, tailIdx+1);
            let pre2 = navigate(pre);
            let { fileOrFolder, dispose, } = createRoot((dispose) => {
                let fileOrFolder = createMemo(() => {
                    let pre3 = pre2();
                    if (pre3.type != "Success") {
                        return pre3;
                    }
                    let pre4 = pre3.value;
                    if (pre4.type != "Folder") {
                        return asyncFailed("Tried to read a file like it was a folder");
                    }
                    let preFolder = pre4.value();
                    if (preFolder.type != "Success") {
                        return preFolder;
                    }
                    let preFolder2 = preFolder.value;
                    let contents = preFolder2.contents();
                    let fileOrFolderEntry = contents.find((entry) => entry.name == tail);
                    if (fileOrFolderEntry == undefined) {
                        return asyncFailed("File or folder not found");
                    }
                    let fileOrFolderEntry2 = fileOrFolderEntry;
                    let fileOrFolder: {
                        type: "File",
                        value: Accessor<AsyncResult<AutomergeVfsFile<unknown>>>,
                    } | {
                        type: "Folder",
                        value: Accessor<AsyncResult<AutomergeVfsFolder>>,
                    };
                    switch (fileOrFolderEntry2.type) {
                        case "File": {
                            fileOrFolder = {
                                type: "File",
                                value: preFolder2.openFileById(fileOrFolderEntry2.id),
                            };
                            break;
                        }
                        case "Folder": {
                            fileOrFolder = {
                                type: "Folder",
                                value: preFolder2.openFolderById(fileOrFolderEntry2.id),
                            };
                            break;
                        }
                    }
                    return asyncSuccess(fileOrFolder);
                });
                return { fileOrFolder, dispose, };
            });
            accessCache[path] = {
                fileOrFolder,
                refCount: 1,
                dispose,
            };
            let r = accessCache[path];
            onCleanup(() => {
                r.refCount--;
                if (r.refCount == 0) {
                    r.dispose();
                }
            });
            return accessCache[path].fileOrFolder;
        }
    }
    vfs.rootFolder();
    function readdir(
        path: string,
        options: { withFileTypes: true },
    ): Array<{ type: 'dir' | 'file'; path: string }>
    function readdir(path: string): Array<string>
    function readdir(path: string, options?: { withFileTypes?: boolean }) {
        let r = navigate(path)();
        if (r.type == "Pending") {
            if (options?.withFileTypes) {
                return [{type: "File", path: "Loading...",}];
            } else {
                return ["Loading..."];
            }
        } else if (r.type == "Failed") {
            if (options?.withFileTypes) {
                return [{type: "File", path: "Error",}];
            } else {
                return ["Error"];
            }
        }
        let r2 = r.value;
        if (r2.type != "Folder") {
            return [];
        }
        let r3 = r2.value();
        if (r3.type == "Pending") {
            if (options?.withFileTypes) {
                return [{type: "File", path: "Loading...",}];
            } else {
                return ["Loading..."];
            }
        } else if (r3.type == "Failed") {
            if (options?.withFileTypes) {
                return [{type: "File", path: "Error",}];
            } else {
                return ["Error"];
            }
        }
        let r4 = r3.value;
        let r5 = r4.contents();
        if (options?.withFileTypes) {
            return r5.map((x) => {
                let type2: "dir" | "file";
                switch (x.type) {
                    case "File":
                        type2 = "file";
                        break;
                    case "Folder":
                        type2 = "dir";
                        break;
                }
                return { type: type2, path: path + "/" + x.name, };
            });
        } else {
            return r5.map((x) => path + "/" + x.name);
        }
    }
    return {
        exists(path) {
            let r = navigate(path)();
            if (r.type != "Success") {
                return false;
            }
            return true;
        },
        getType(path) {
            let fileOrFolder = navigate(path);
            let r = fileOrFolder();
            if (r.type != "Success") {
                return "file";
            }
            let r2 = r.value;
            switch (r2.type) {
                case "File":
                    return "file";
                case "Folder":
                    return "dir";
            }
        },
        readdir,
        mkdir(path, options) {
            throw new Error("TODO");
        },
        readFile(path) {
            throw new Error("TODO");
        },
        rename(previous, next) {
            throw new Error("TODO");
        },
        rm(path, options) {
            throw new Error("TODO");
        },
        writeFile(path, source) {
            throw new Error("TODO");
        },
    };
}
