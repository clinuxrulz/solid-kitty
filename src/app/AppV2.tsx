import { Component, createMemo, Match, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import LandingApp from "./LandingApp";
import { Repo } from "@automerge/automerge-repo";
import { NoTrack } from "../util";
import { createFileSystemExplorer } from "./FileSystemExplorer";

const AppV2: Component<{
    repo: Repo,
    docUrl: string,
    ConnectionManagementUi: Component,
}> = (props) => {
    let [ state, setState, ] = createStore<{
        overlayApp: NoTrack<{
            Title: Component,
            View: Component,
        }> | undefined,
        SubApp: Component,
    }>({
        overlayApp: undefined,
        SubApp: LandingApp,
    });
    let fileSystemExplorer = createFileSystemExplorer({
        get repo() {
            return props.repo;
        },
        get docUrl() {
            return props.docUrl;
        }
    });
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
    return (
        <div style={{
            "flex-grow": "1",
            "overflow": "hidden",
            "display": "flex",
            "flex-direction": "column",
            "position": "relative",
        }}>
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
                <state.SubApp/>
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
