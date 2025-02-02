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
        let startPan = () => {
            if (state.mousePos == undefined) {
                return;
            }
            let pt = screenPtToWorldPt(state.mousePos);
            if (pt == undefined) {
                return;
            }
            batch(() => {
                setState("isPanning", true);
                setState("panningFrom", pt);
            });
        };
        let stopPan = () => {
            batch(() => {
                setState("isPanning", false);
                setState("panningFrom", undefined);
            });
        };
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
            let mid = Vec2.zero();
            for (let touch of state.touches) {
                mid.add(touch.pos);
            }
            mid.multScalar(1.0 / state.touches.length);
            let initGap: number | undefined;
            if (state.touches.length != 2) {
                initGap = undefined;
            } else {
                initGap = state.touches[1].pos.clone().sub(state.touches[0].pos).length();
            }
            let pt = screenPtToWorldPt(mid);
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
        let onMouseDown = (e: MouseEvent) => {
            if (!state.isPanning) {
                startPan();
            }
        };
        let onMouseUp = (e: MouseEvent) => {
            if (state.isPanning) {
                stopPan();
            }
        };
        let onMouseMove = (e: MouseEvent) => {
            let svg2 = svg();
            if (svg2 == undefined) {
                return;
            }
            let rect = svg2.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            setState("mousePos", Vec2.create(x, y));
        };
        let onMouseOut = (e: MouseEvent) => {
            setState("mousePos", undefined);
        };
        let onWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) {
                zoomByFactor(1.0 / 1.1);
            } else if (e.deltaY < 0) {
                zoomByFactor(1.1 / 1.0);
            }
        };
        let onTouchStart = (e: TouchEvent) => {
            let svg2 = svg();
            if (svg2 == undefined) {
                return;
            }
            let rect = svg2.getBoundingClientRect();
            let touches: { id: number, pos: Vec2, }[] = [];
            if (e.targetTouches.length == 0) {
                return;
            }
            let avg = Vec2.zero();
            for (let touch of e.targetTouches) {
                let pos = Vec2.create(
                    touch.clientX - rect.left,
                    touch.clientY - rect.top,
                );
                touches.push({
                    id: touch.identifier,
                    pos,
                });
                avg = avg.add(pos);
            }
            avg = avg.multScalar(1.0 / e.targetTouches.length);
            if (state.isTouchPanZoom) {
                stopTouchPanZoom();
            }
            setState("touches", touches);
            setState("mousePos", avg);
            startTouchPanZoom();
            e.preventDefault();
        };
        let onTouchEnd = (e: TouchEvent) => {
            if (state.isTouchPanZoom) {
                stopTouchPanZoom()
            }
            setState("touches", []);
            e.preventDefault();
        };
        let onTouchMove = (e: TouchEvent) => {
            let svg2 = svg();
            if (svg2 == undefined) {
                return;
            }
            let rect = svg2.getBoundingClientRect();
            let touches: { id: number, pos: Vec2, }[] = [];
            let avg = Vec2.zero();
            for (let touch of e.targetTouches) {
                let pos = Vec2.create(
                    touch.clientX - rect.left,
                    touch.clientY - rect.top,
                );
                touches.push({
                    id: touch.identifier,
                    pos,
                });
                avg = avg.add(pos);
            }
            avg = avg.multScalar(1.0 / e.targetTouches.length);
            batch(() => {
                if (state.isTouchPanZoom && state.touches.length != 2 && touches.length == 2) {
                    let initGap = touches[1].pos.distance(touches[0].pos);
                    setState("touchPanZoomFrom", avg);
                    setState("touchPanZoomInitGap", initGap);
                    setState("touchPanZoomInitScale", state.scale);
                }
                setState("touches", touches);
                setState("mousePos", avg);
            });
            e.preventDefault();
        };
        //
        let transform = createMemo(() => `scale(${this.state.scale}) translate(${-this.state.pan.x} ${-this.state.pan.y})`);
        let style2 = mergeProps(
            {
                "background-color": "#DDD",
                "background-image": "linear-gradient(45deg, #FFFFFF 25%, transparent 25%), linear-gradient(-45deg, #FFFFFF 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #FFFFFF 75%), linear-gradient(-45deg, transparent 75%, #FFFFFF 75%)",
                "background-size": "20px 20px",
                "background-position": "0 0, 0 10px, 10px -10px, -10px 0px",
            },
            props.style,
        );
        return (
            <svg
                ref={setSvg}
                style={style2}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                onMouseOut={onMouseOut}
                onWheel={onWheel}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onTouchMove={onTouchMove}
            >
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
        );
    };
}
