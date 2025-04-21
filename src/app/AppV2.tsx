import { Component, createMemo, createResource, Match, onCleanup, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import LandingApp from "./LandingApp";
import { isValidAutomergeUrl, Repo } from "@automerge/automerge-repo";
import { NoTrack } from "../util";
import { createFileSystemExplorer } from "./FileSystemExplorer";
import { AutomergeVirtualFileSystem, AutomergeVirtualFileSystemState } from "solid-fs-automerge";
import { err } from "../kitty-demo/Result";
import { asyncFailed, asyncSuccess } from "../AsyncResult";
import PixelEditor from "../pixel-editor/PixelEditor";
import { TextureAtlas } from "../level-builder/texture-atlas/TextureAtlas";

const AppV2: Component<{
    vfs: AutomergeVirtualFileSystem,
    ConnectionManagementUi: Component,
}> = (props) => {
    let [ state, setState, ] = createStore<{
        overlayApp: NoTrack<{
            Title: Component,
            View: Component,
        }> | undefined,
    }>({
        overlayApp: undefined,
    });
    let fileSystemExplorer = createFileSystemExplorer({
        get vfs() {
            return props.vfs;
        }
    });
    let vfs = createMemo(() => asyncSuccess(props.vfs));
    let selectionCount = () => fileSystemExplorer.selectionCount();
    let contentFolderSelected = createMemo<
        "Images" |
        "Texture Atlases" |
        "Levels" |
        undefined
    >(() => {
        if (selectionCount() != 1) {
            return undefined;
        }
        if (fileSystemExplorer.isSelected("/images")) {
            return "Images";
        }
        if (fileSystemExplorer.isSelected("/texture_atlases")) {
            return "Texture Atlases";
        }
        if (fileSystemExplorer.isSelected("/levels")) {
            return "Levels";
        }
        return undefined;
    });
    let rootFolder_ = createMemo(() => {
        let vfs2 = vfs();
        if (vfs2.type != "Success") {
            return vfs2;
        }
        let vfs3 = vfs2.value;
        return asyncSuccess(vfs3.rootFolder());
    });
    let rootFolder = createMemo(() => {
        let tmp = rootFolder_();
        if (tmp.type != "Success") {
            return tmp;
        }
        return tmp.value();
    });
    let imagesFolder_ = createMemo(() => {
        let rootFolder2 = rootFolder();
        if (rootFolder2.type != "Success") {
            return rootFolder2;
        }
        let rootFolder3 = rootFolder2.value;
        let contents = rootFolder3.contents();
        let images = contents.find((x) => x.name == "images");
        if (images == undefined) {
            return asyncFailed("images folder not found");
        }
        let images2 = images;
        if (images2.type != "Folder") {
            return asyncFailed("expected images to be a folder");
        }
        let imagesFolderId = images2.id;
        return asyncSuccess(rootFolder3.openFolderById(imagesFolderId));
    });
    let imagesFolder = createMemo(() => {
        let tmp = imagesFolder_();
        if (tmp.type != "Success") {
            return tmp;
        }
        return tmp.value();
    });
    let textureAtlasesFolder_ = createMemo(() => {
        let rootFolder2 = rootFolder();
        if (rootFolder2.type != "Success") {
            return rootFolder2;
        }
        let rootFolder3 = rootFolder2.value;
        let contents = rootFolder3.contents();
        let textureAtlases = contents.find((x) => x.name == "texture_atlases");
        if (textureAtlases == undefined) {
            return asyncFailed("texture atlases folder not found");
        }
        let textureAtlases2 = textureAtlases;
        if (textureAtlases2.type != "Folder") {
            return asyncFailed("expected textureAtlases to be a folder");
        }
        let textureAtlasesFolderId = textureAtlases2.id;
        return asyncSuccess(rootFolder3.openFolderById(textureAtlasesFolderId));
    });
    let textureAtlasesFolder = createMemo(() => {
        let tmp = textureAtlasesFolder_();
        if (tmp.type != "Success") {
            return tmp;
        }
        return tmp.value();
    });
    let selectedImageFileById = createMemo(() => {
        if (selectionCount() != 1) {
            return undefined;
        }
        let imagesFolder2 = imagesFolder();
        if (imagesFolder2.type != "Success") {
            return undefined;
        }
        let imagesFolder3 = imagesFolder2.value;
        let contents = imagesFolder3.contents();
        for (let image of contents) {
            if (image.type != "File") {
                continue;
            }
            if (fileSystemExplorer.isSelected("/images/" + image.name)) {
                return image.id;
            }
        }
        return undefined;
    });
    let selectedTextureAtlasFileById = createMemo(() => {
        if (selectionCount() != 1) {
            return undefined;
        }
        let textureAtlasesFolder2 = textureAtlasesFolder();
        if (textureAtlasesFolder2.type != "Success") {
            return undefined;
        }
        let textureAtlasesFolder3 = textureAtlasesFolder2.value;
        let contents = textureAtlasesFolder3.contents();
        for (let textureAtlas of contents) {
            if (textureAtlas.type != "File") {
                continue;
            }
            if (fileSystemExplorer.isSelected("/texture_atlases/" + textureAtlas.name)) {
                return textureAtlas.id;
            }
        }
        return undefined;
    });
    const showConnectionManager = () => {
        setState(
            "overlayApp",
            new NoTrack({
                Title: () => (
                    <h3 class="text-lg font-bold">Connection Manager</h3>
                ),
                View: () => (
                    <props.ConnectionManagementUi/>
                ),
            }),
        );
    };
    const showFileExplorer = () => {
        setState(
            "overlayApp",
            new NoTrack({
                Title: () => (
                    <h3 class="text-lg font-bold">File Explorer</h3>
                ),
                View: () => (
                    <div
                        style={{
                            "flex-grow": "1",
                            "display": "flex",
                            "flex-direction": "column",
                        }}
                    >
                        <div style="margin-bottom: 5px;">
                            <button
                                class="btn btn-primary"
                                disabled={contentFolderSelected() == undefined}
                            >
                                New {(() => {
                                    let x = contentFolderSelected();
                                    if (x == undefined) {
                                        return undefined;
                                    }
                                    switch (x) {
                                        case "Images":
                                            return "Image";
                                        case "Texture Atlases":
                                            return "Texture Atlas";
                                        case "Levels":
                                            return "Level";
                                    }
                                })()}
                            </button>
                        </div>
                        <fileSystemExplorer.Render/>
                    </div>
                ),
            }),
        );
    };
    let selectedImageFile_ = createMemo(() => {
        let imagesFolder2 = imagesFolder();
        if (imagesFolder2.type != "Success") {
            return undefined;
        }
        let imagesFolder3 = imagesFolder2.value;
        let fileId = selectedImageFileById();
        if (fileId == undefined) {
            return undefined;
        }
        return imagesFolder3.openFileById<{
            mimeType: string,
            data: Uint8Array,
        }>(fileId);
    });
    let selectedImageFile = createMemo(() => {
        let tmp = selectedImageFile_();
        if (tmp == undefined) {
            return undefined;
        }
        let tmp2 = tmp();
        if (tmp2.type != "Success") {
            return undefined;
        }
        return tmp2.value;
    });
    let selectedImage_ = createMemo(() => {
        let file = selectedImageFile();
        if (file == undefined) {
            return undefined;
        }
        let mimeType: string = file.doc.mimeType;
        let data: Uint8Array = file.doc.data;
        let blob = new Blob([ data, ], { type: mimeType, });
        let imageUrl = URL.createObjectURL(blob);
        onCleanup(() => {
            URL.revokeObjectURL(imageUrl);
        });
        let [ image ] = createResource(() => new Promise<HTMLImageElement>((resolve, reject) => {
            let image = new Image();
            image.src = imageUrl;
            image.onload = (e) => {
                resolve(image);
            };
            image.onerror = (e) => {
                reject(e);
            };
        }));
        return image;
    });
    let selectedImage = createMemo(() =>
        selectedImage_()?.()
    );
    let subApp = createMemo(() => {
        let selectedImage2 = selectedImage();
        if (selectedImage2 != undefined) {
            return () => (
                <PixelEditor
                    initImage={selectedImage2}
                />
            );
        }
        let selectedTextureAtlasFileById2 = selectedTextureAtlasFileById();
        if (selectedTextureAtlasFileById2 != undefined) {
            let vfs2 = vfs();
            if (vfs2.type != "Success") {
                return LandingApp;
            }
            let vfs3 = vfs2.value;
            let textureAtlas = new TextureAtlas({
                vfs: vfs3,
                imagesFolder,
                textureAtlasesFolder,
                textureAtlasFileId: () => selectedTextureAtlasFileById2,
            });
            return (() =>
                <textureAtlas.Render
                    style={{
                        "flex-grow": "1",
                    }}
                />
            );
        }
        return LandingApp;
    });
    let SubApp: Component = () => (<>{subApp()({})}</>);
    return (
        <div style={{
            "flex-grow": "1",
            "overflow": "hidden",
            "display": "flex",
            "flex-direction": "column",
            "position": "relative",
        }}>
            {selectedImageFileById()}
            <ul class="menu menu-horizontal bg-base-200 rounded-box">
                <li
                    onClick={() => showConnectionManager()}
                >
                    <i class="fa-solid fa-network-wired"/>
                </li>
                <li
                    onClick={() => showFileExplorer()}
                >
                    <i class="fa-solid fa-folder-tree"/>
                </li>
            </ul>
            <div
                style={{
                    "flex-grow": "1",
                    "display": "flex",
                }}
            >
                <SubApp/>
            </div>
            <Show when={state.overlayApp?.value} keyed={true}>
                {(overlayApp) => (
                    <div
                        style={{
                            "position": "absolute",
                            "left": "0",
                            "top": "0",
                            "bottom": "0",
                            "right": "0",
                            "display": "flex",
                            "overflow": "hidden",
                        }}
                    >
                        <div
                            style={{
                                "flex-grow": "1",
                                "margin": "5%",
                                "display": "flex",
                                "flex-direction": "column",
                                "overflow": "hidden",
                            }}
                            class="bg-base-200 rounded-box"
                        >
                            <div
                                style={{
                                    "display": "flex",
                                    "flex-direction": "row",
                                    "padding": "10px",
                                }}
                                class="bg-base-300 rounded-box"
                            >
                                <div
                                    style={{
                                        "flex-grow": "1",
                                        "display": "flex",
                                        "flex-direction": "row",
                                        "align-items": "center",
                                        "overflow": "hidden",
                                    }}
                                >
                                    <overlayApp.Title/>
                                </div>
                                <button
                                    class="btn btn-primary"
                                    onClick={() => setState("overlayApp", undefined)}
                                >
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div
                                style={{
                                    "flex-grow": "1",
                                    "display": "flex",
                                    "padding": "10px",
                                    "overflow": "hidden",
                                }}
                            >
                                <overlayApp.View/>
                            </div>
                        </div>
                    </div>
                )}
            </Show>
        </div>
    );
};

export default AppV2;
