import { Accessor, Component, createMemo, JSX, Show } from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore, SetStoreFunction, Store } from "solid-js/store";

type State = {
    mousePos: Vec2 | undefined,
    pan: Vec2,
    scale: number,
    //
    touches: {
        id: number,
        pos: Vec2,
    }[],
    // panning states
    isPanning: boolean,
    panningFrom: Vec2 | undefined,
    // panning/zoom states for touch screen
    isTouchPanZoom: boolean,
    touchPanZoomFrom: Vec2 | undefined,
    touchPanZoomInitScale: number | undefined,
    touchPanZoomInitGap: number | undefined,
    //
};

export class Tileset {
    private state: Store<State>;
    private setState: SetStoreFunction<State>;
    private image: Accessor<HTMLImageElement | undefined>;

    constructor(params: {
        image: Accessor<HTMLImageElement | undefined>,
    }) {
        let [ state, setState, ] = createStore<State>({
            mousePos: undefined,
            pan: Vec2.create(-1, -1),
            scale: 30.0,
            touches: [],
            isPanning: false,
            panningFrom: undefined,
            isTouchPanZoom: false,
            touchPanZoomFrom: undefined,
            touchPanZoomInitScale: undefined,
            touchPanZoomInitGap: undefined,
        });
        this.state = state;
        this.setState = setState;
        this.image = params.image;
    }

    Render: Component<{
        style?: JSX.CSSProperties | string,
    }> = (props) => {
        let transform = createMemo(() => `translate(${-this.state.pan.x} ${-this.state.pan.y}) scale(${this.state.scale})`);
        return (
            <svg
                style={props.style}
            >
                <g transform={transform()}>
                    <Show when={this.image()}>
                        {(image) => (
                            <foreignObject
                                width={image().width}
                                height={image().height}
                            >
                                {image()}
                            </foreignObject>
                        )}
                    </Show>
                </g>
            </svg>
        );
    };
}
