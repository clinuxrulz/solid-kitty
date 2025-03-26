import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { Vec2 } from "../Vec2";
import {
    Accessor,
    Component,
    createMemo,
    JSX,
    mergeProps,
    Show,
} from "solid-js";
import { AsyncResult } from "../AsyncResult";
import { LevelList } from "./LevelList";
import { Level } from "./level/Level";
import { TextureAtlasState } from "./components/TextureAtlasComponent";
import { FrameState } from "./components/FrameComponent";
import { ReactiveVirtualFileSystem } from "../ReactiveVirtualFileSystem";
import { AutomergeVirtualFileSystem } from "../AutomergeVirtualFileSystem";

type State = {
    showLevelList: boolean;
};

export class Levels {
    readonly Render: Component<{
        style?: JSX.CSSProperties;
    }>;

    constructor(params: {
        vfs: AutomergeVirtualFileSystem;
        imagesFolderId: Accessor<AsyncResult<string>>;
        textureAtlasesFolderId: Accessor<AsyncResult<string>>;
        levelsFolderId: Accessor<AsyncResult<string>>;
        textureAtlasWithImageAndFramesList: Accessor<
            AsyncResult<
                {
                    textureAtlasFilename: string;
                    textureAtlas: TextureAtlasState;
                    image: HTMLImageElement;
                    frames: FrameState[];
                }[]
            >
        >;
    }) {
        let [state, setState] = createStore<State>({
            showLevelList: false,
        });
        let levelList = new LevelList({
            vfs: params.vfs,
            levelsFolderId: params.levelsFolderId,
        });
        let level = new Level({
            vfs: params.vfs,
            imagesFolderId: params.imagesFolderId,
            textureAtlasesFolderId: params.textureAtlasesFolderId,
            levelFileId: levelList.selectedLevelByFileId,
            textureAtlasWithImageAndFramesList:
                params.textureAtlasWithImageAndFramesList,
        });
        //
        this.Render = (props) => {
            let styleProps = mergeProps<[JSX.CSSProperties, JSX.CSSProperties]>(
                props.style ?? {},
                {
                    display: "flex",
                    "flex-direction": "column",
                    position: "relative",
                },
            );
            return (
                <div style={styleProps}>
                    <level.Render
                        style={{
                            "flex-grow": "1",
                        }}
                        onBurger={() => {
                            setState("showLevelList", true);
                        }}
                    />
                    <Show when={state.showLevelList}>
                        <div
                            style={{
                                position: "absolute",
                                left: "0",
                                top: "0",
                                right: "0",
                                bottom: "0",
                                "background-color": "rgba(0,0,0,0.8)",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    "-webkit-transform": "translate(-50%,-50%)",
                                    transform: "translate(-50%,-50%)",
                                }}
                            >
                                <div>
                                    <levelList.Render />
                                    <button
                                        class="btn"
                                        onClick={() =>
                                            setState("showLevelList", false)
                                        }
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Show>
                </div>
            );
        };
    }
}
