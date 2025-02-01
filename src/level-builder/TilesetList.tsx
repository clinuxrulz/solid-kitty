import { Component, JSX } from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore, SetStoreFunction, Store } from "solid-js/store";

type State = {
    tilesets: {
        name: string,
        image: HTMLImageElement,
        blockTable: {
            name: string,
            pos: Vec2,
            size: Vec2,
        }[],
    }[],
};

export class TilesetList {
    private state: Store<State>;
    private setState: SetStoreFunction<State>;

    constructor() {
        let [ state, setState, ] = createStore<State>({
            tilesets: [],
        });
        this.state = state;
        this.setState = setState;
    }

    readonly Render: Component<{
        style?: JSX.CSSProperties | string,
    }> = (props) => {
        return (
            <div
                style={props.style}
            >
                <b>Tilesets:</b>
                <div
                    class="list-container-1"
                >
                <nav
                    class="list-container-2"
                >
                    <div
                        role="button"
                        class="list-item-selected"
                    >
                        Tileset 1
                        <div
                            class="list-item-button-container"
                        >
                            <button
                                class="list-item-button"
                                type="button"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div
                        role="button"
                        class="list-item"
                    >
                        Tileset 2
                        <div
                            class="list-item-button-container"
                        >
                            <button
                                class="list-item-button"
                                type="button"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </nav>
                </div>
            </div>
        );
    };
}
