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
import { TextureAtlasList } from "./TextureAtlasList";
import { TextureAtlas } from "./texture-atlas/TextureAtlas";
import { AsyncResult } from "../AsyncResult";
import { VfsFile, VirtualFileSystem } from "./VirtualFileSystem";

type State = {
    showTextureAtlasList: boolean;
};

export class TextureAtlases {
    private state: Store<State>;
    private setState: SetStoreFunction<State>;
    private textureAtlasList: TextureAtlasList;
    private textureAtlas: TextureAtlas;
    readonly dispose: () => void;
    readonly Render: Component<{
        style?: JSX.CSSProperties;
    }>;

    constructor(params: {
        vfs: Accessor<AsyncResult<VirtualFileSystem>>;
        imagesFolderId: Accessor<AsyncResult<string>>;
        imageFiles: Accessor<AsyncResult<VfsFile[]>>;
        textureAtlasesFolderId: Accessor<AsyncResult<string>>;
    }) {
        let [state, setState] = createStore<State>({
            showTextureAtlasList: false,
        });
        let textureAtlasList = new TextureAtlasList({
            vfs: params.vfs,
            imagesFolderId: params.imagesFolderId,
            imageFiles: params.imageFiles,
            textureAtlasesFolderId: params.textureAtlasesFolderId,
        });
        let textureAtlas = new TextureAtlas({
            vfs: params.vfs,
            imagesFolderId: params.imagesFolderId,
            textureAtlasFileId: textureAtlasList.selectedTextureAtlasByFileId,
        });
        this.state = state;
        this.setState = setState;
        this.textureAtlasList = textureAtlasList;
        this.textureAtlas = textureAtlas;
        //
        this.dispose = () => {
        };
        this.Render = (props) => {
            let state = this.state;
            let setState = this.setState;
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
                    <this.textureAtlas.Render
                        style={{
                            "flex-grow": "1",
                        }}
                        onBurger={() => {
                            setState("showTextureAtlasList", true);
                        }}
                    />
                    <Show when={state.showTextureAtlasList}>
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
                                    <this.textureAtlasList.Render />
                                    <button
                                        class="btn"
                                        onClick={() =>
                                            setState(
                                                "showTextureAtlasList",
                                                false,
                                            )
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
