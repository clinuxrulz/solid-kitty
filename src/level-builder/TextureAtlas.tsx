import { Accessor, batch, Component, createComputed, createMemo, createSignal, JSX, mergeProps, on, Show } from "solid-js";
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

export class TextureAtlas {
    private state: Store<State>;
    private setState: SetStoreFunction<State>;
    private image: Accessor<HTMLImageElement | undefined>;
    private size: Accessor<Vec2 | undefined>;
    private screenPtToWorldPt: (screenPt: Vec2) => Vec2 | undefined;
    private worldPtToScreenPt: (worldPt: Vec2) => Vec2 | undefined;

    constructor(params: {
        image: Accessor<HTMLImageElement | undefined>,
        size: Accessor<Vec2 | undefined>,
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
        //
        let screenPtToWorldPt = (screenPt: Vec2): Vec2 | undefined => {
            return screenPt.clone().multScalar(1.0 / state.scale).add(state.pan);
        };
        let worldPtToScreenPt = (worldPt: Vec2): Vec2 | undefined => {
            return worldPt.clone().sub(state.pan).multScalar(state.scale);
        };
        //
        this.state = state;
        this.setState = setState;
        this.image = params.image;
        this.size = params.size;
        this.screenPtToWorldPt = screenPtToWorldPt;
        this.worldPtToScreenPt = worldPtToScreenPt;
    }

    Render: Component<{
        style?: JSX.CSSProperties | string,
    }> = (props) => {
        let state = this.state;
        let setState = this.setState;
        let screenPtToWorldPt = this.screenPtToWorldPt;
        let worldPtToScreenPt = this.worldPtToScreenPt;
        let [ svg, setSvg, ] = createSignal<SVGSVGElement>();
        //
        createComputed(on(
            [
                () => state.isPanning,
                () => state.panningFrom,
                () => state.mousePos,
            ],
            () => {
                if (!state.isPanning) {
                    return;
                }
                if (state.panningFrom == undefined) {
                    return;
                }
                if (state.mousePos == undefined) {
                    return;
                }
                let pt = screenPtToWorldPt(state.mousePos);
                if (pt == undefined) {
                    return;
                }
                let delta = state.panningFrom.clone().sub(pt);
                setState("pan", (pan) => pan.clone().add(delta));
            },
        ));
        let zoomByFactor = (factor: number) => {
            if (state.mousePos == undefined) {
                return;
            }
            let pt = screenPtToWorldPt(state.mousePos);
            if (pt == undefined) {
                return;
            }
            let newScale = state.scale * factor;
            let newPan = pt.clone()
                .sub(
                    state.mousePos
                        .clone()
                        .multScalar(1.0 / newScale)
                );
            batch(() => {
                setState("pan", newPan);
                setState("scale", state.scale * factor);
            });
        };
        createComputed(on(
            [
                () => state.isTouchPanZoom,
                () => state.touchPanZoomFrom,
                () => state.touchPanZoomInitGap,
                () => state.touchPanZoomInitScale,
                () => state.touches,
                () => state.mousePos,
            ],
            () => {
                if (!state.isTouchPanZoom) {
                    return;
                }
                if (state.touchPanZoomFrom == undefined) {
                    return;
                }
                if (state.mousePos == undefined) {
                    return;
                }
                if (state.touchPanZoomInitScale == undefined) {
                    return;
                }
                let pt = screenPtToWorldPt(state.mousePos);
                if (pt == undefined) {
                    return;
                }
                let gap: number | undefined;
                if (state.touches.length != 2) {
                    gap = undefined;
                } else {
                    gap = state.touches[1].pos.clone().sub(state.touches[0].pos).length();
                }
                let delta = state.touchPanZoomFrom.clone().sub(pt);
                let initScale = state.touchPanZoomInitScale;
                batch(() => {
                    setState("pan", (pan) => pan.clone().add(delta));
                    if (state.touchPanZoomInitGap != undefined && gap != undefined) {
                        let newScale = initScale * gap / state.touchPanZoomInitGap;
                        setState("scale", newScale);
                    }
                });
            },
        ));
        let startTouchPanZoom = () => {
            if (state.touches.length == 0) {
                return;
            }
            if (state.mousePos == undefined) {
                return;
            }
            let initGap: number | undefined;
            if (state.touches.length != 2) {
                initGap = undefined;
            } else {
                initGap = state.touches[1].pos.clone().sub(state.touches[0].pos).length();
            }
            let pt = screenPtToWorldPt(state.mousePos);
            if (pt == undefined) {
                return;
            }
            batch(() => {
                setState("isTouchPanZoom", true);
                setState("touchPanZoomFrom", pt);
                setState("touchPanZoomInitGap", initGap);
                setState("touchPanZoomInitScale", state.scale);
            });
        };
        let stopTouchPanZoom = () => {
            batch(() => {
                setState("isTouchPanZoom", false);
                setState("touchPanZoomFrom", undefined);
                setState("touchPanZoomInitGap", undefined);
                setState("touchPanZoomInitScale", undefined);
            });
        };
        let onWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) {
                zoomByFactor(1.0 / 1.1);
            } else if (e.deltaY < 0) {
                zoomByFactor(1.1 / 1.0);
            }
        };
        let onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            let svg2 = svg();
            if (svg2 == undefined) {
                return;
            }
            svg2.setPointerCapture(e.pointerId);
            let rect = svg2.getBoundingClientRect();
            let id = e.pointerId;
            let pos = Vec2.create(e.clientX - rect.left, e.clientY - rect.top);
            let newTouches = [
                ...state.touches,
                { id, pos, },
            ];
            batch(() => {
                setState("touches", newTouches);
                setState("mousePos", newTouches[0].pos);
            });
            startTouchPanZoom();
        };
        let onPointerUp =  (e: PointerEvent) => {
            e.preventDefault();
            let svg2 = svg();
            if (svg2 == undefined) {
                return;
            }
            svg2.releasePointerCapture(e.pointerId);
            let id = e.pointerId;
            let newTouches = state.touches.filter(({ id: id2 }) => id2 != id);
            batch(() => {
                setState("touches", newTouches);
                setState("mousePos", newTouches.length > 0 ? newTouches[0].pos : undefined);
            });
            if (newTouches.length == 0) {
                stopTouchPanZoom();
            }
        };
        let onPointerCanceled = (e: PointerEvent) => {
            onPointerUp(e);
        };
        let onPointerMove = (e: PointerEvent) => {
            e.preventDefault();
            let svg2 = svg();
            if (svg2 == undefined) {
                return;
            }
            let rect = svg2.getBoundingClientRect();
            let id = e.pointerId;
            let touchIdx = state.touches.findIndex(({ id: id2, }) => id2 == id);
            let pos = Vec2.create(e.clientX - rect.left, e.clientY - rect.top);
            if (touchIdx != -1) {
                setState("touches", touchIdx, "pos", (oldPos) => {
                    oldPos.dispose();
                    return pos;
                });
            }
            if (touchIdx == 0 || touchIdx == -1) {
                setState("mousePos", pos);
            }
        };
        let onPointerOut = (e: PointerEvent) => {
            e.preventDefault();
            if (state.touches.length == 0) {
                setState("mousePos", undefined);
            }
        };
        //
        let transform = createMemo(() => `scale(${this.state.scale}) translate(${-this.state.pan.x} ${-this.state.pan.y})`);
        let style2 = mergeProps(
            {
                "background-color": "#DDD",
                "background-image": "linear-gradient(45deg, #FFFFFF 25%, transparent 25%), linear-gradient(-45deg, #FFFFFF 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #FFFFFF 75%), linear-gradient(-45deg, transparent 75%, #FFFFFF 75%)",
                "background-size": "20px 20px",
                "background-position": "0 0, 0 10px, 10px -10px, -10px 0px",
                "touch-action": "none",
            },
            props.style,
        );
        return (<>
            <svg
                ref={setSvg}
                style={style2}
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCanceled}
                onPointerMove={onPointerMove}
                onPointerOut={onPointerOut}
                onContextMenu={(e) => { e.preventDefault(); return false; }}
            >
                <text
                    y="100"
                >{JSON.stringify(state.touches.length)}</text>
                <text
                    y="150"
                >{JSON.stringify(state.mousePos ?? null)}</text>
                <g transform={transform()}>
                    <Show when={this.size()}>
                        {(size) => (
                            <Show when={this.image()}>
                                {(image) => (
                                    <foreignObject
                                        width={size().x}
                                        height={size().y}
                                    >
                                        {image()}
                                    </foreignObject>
                                )}
                            </Show>
                        )}
                    </Show>
                </g>
            </svg>
        </>);
    };
}
