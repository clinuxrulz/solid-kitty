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
                list of tilesets
            </div>
        );
    };
}
