import { batch, Component, createComputed, createEffect, createMemo, createSignal, on, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { Vec2 } from "../Vec2";
import { KOOPA_TROOPA_1_HEIGHT } from "../SmSprites";

const PixelEditor: Component = () => {
    let [ state, setState, ] = createStore<{
        pan: Vec2,
        scale: number,
        mousePos: Vec2 | undefined,
        // panning states
        isPanning: boolean,
        panningFrom: Vec2 | undefined,
    }>({
        pan: new Vec2(-100, -100),
        scale: 30.0,
        mousePos: undefined,
        // panning states
        isPanning: false,
        panningFrom: undefined,
    });
    let screenPtToWorldPt = (screenPt: Vec2): Vec2 | undefined => {
        return screenPt.clone().multScalar(1.0 / state.scale).add(state.pan);
    };
    let worldPtToScreenPt = (worldPt: Vec2): Vec2 | undefined => {
        return worldPt.clone().sub(state.pan).multScalar(state.scale);
    };
    let [ canvas, setCanvas, ] = createSignal<HTMLCanvasElement>();
    createComputed(() => {
        let canvas2 = canvas();
        if (canvas2 == undefined) {
            return undefined;
        }
        let resizeObserver = new ResizeObserver(
            () => {
                let rect = canvas2.getBoundingClientRect();
                canvas2.width = rect.width;
                canvas2.height = rect.height;
                drawOnCanvas();
            },
        );
        resizeObserver.observe(canvas2);
        onCleanup(() => {
            resizeObserver.unobserve(canvas2);
            resizeObserver.disconnect();
        });
    });
    let ctx = createMemo(() => {
        let canvas2 = canvas();
        if (canvas2 == undefined) {
            return undefined;
        }
        return canvas2.getContext("2d");
    });
    let image = createMemo(() => {
        let ctx2 = ctx();
        if (ctx2 == undefined) {
            return undefined;
        }
        let imageData = new ImageData(10,10);
        let result = new OffscreenCanvas(10, 10);
        let data = imageData.data;
        let at = 0;
        for (let i = 0; i < 10; ++i) {
            for (let j = 0; j < 10; ++j) {
                data[at++] = i*20;
                data[at++] = 0;
                data[at++] = j*20;
                data[at++] = 255;
            }
        }
        let offCtx = result.getContext("2d");
        if (offCtx == undefined) {
            return undefined;
        }
        offCtx.putImageData(imageData, 0, 0);
        return result;
    });
    function drawOnCanvas() {
        let canvas2 = canvas();
        if (canvas2 == undefined) {
            return;
        }
        let ctx2 = ctx();
        if (ctx2 == undefined) {
            return;
        }
        let image2 = image();
        if (image2 == undefined) {
            return;
        }
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        ctx2.save();
        ctx2.imageSmoothingEnabled = false;
        ctx2.translate(-state.pan.x, -state.pan.y);
        ctx2.scale(state.scale, state.scale);
        ctx2.drawImage(image2, 0, 0, 10, 10);
        ctx2.restore();
    }
    let render = (() => {
        let rendering = false;
        return () => {
            if (rendering) {
                return;
            }
            rendering = true;
            requestAnimationFrame(() => {
                rendering = false;
                drawOnCanvas();
            });
        };
    })();
    createComputed(on(
        [
            () => state.pan,
            () => state.scale,
        ],
        () => {
            render();
        },
    ));
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
        let canvas2 = canvas();
        if (canvas2 == undefined) {
            return;
        }
        let rect = canvas2.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        setState("mousePos", new Vec2(x, y));
    };
    let onMouseOut = (e: MouseEvent) => {
        setState("mousePos", undefined);
    };
    return (
        <div
            style={{
                "flex-grow": "1",
                "display": "flex",
                "flex-direction": "column",
            }}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onMouseOut={onMouseOut}
        >
            <canvas
                style={{
                    "flex-grow": "1"
                }}
                ref={setCanvas}
            />
        </div>
    );
};

export default PixelEditor;
