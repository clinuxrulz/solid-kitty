import { batch, Component, createComputed, createEffect, createMemo, createSignal, on, onCleanup, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Vec2 } from "../Vec2";
import { ModeParams } from "./ModeParams";
import { Colour } from "./Colour";
import { IdleMode } from "./modes/IdleMode";
import { DrawPixelsMode } from "./modes/DrawPixelsMode";
import { Mode } from "./Mode";
import { UndoManager } from "./UndoManager";

const PixelEditor: Component = () => {
    let [ state, setState, ] = createStore<{
        pan: Vec2,
        scale: number,
        mousePos: Vec2 | undefined,
        // panning states
        isPanning: boolean,
        panningFrom: Vec2 | undefined,
        //
        mode: "Idle" | "Draw Pixels",
    }>({
        pan: Vec2.create(-1, -1),
        scale: 30.0,
        mousePos: undefined,
        // panning states
        isPanning: false,
        panningFrom: undefined,
        //
        mode: "Idle",
    });
    const undoManager = new UndoManager();
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
        return {
            image: result,
            imageData,
            ctx: offCtx,
        };
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
        ctx2.scale(state.scale, state.scale);
        ctx2.translate(-state.pan.x, -state.pan.y);
        ctx2.drawImage(image2.image, 0, 0, 10, 10);
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
    const SNAP_DIST = 10;
    const SNAP_DIST_SQUARED = SNAP_DIST * SNAP_DIST;
    let modeParams: ModeParams = {
        undoManager,
        snapDist: () => SNAP_DIST,
        snapDistSquared: () => SNAP_DIST_SQUARED,
        mousePos: () => state.mousePos,
        screenPtToWorldPt,
        worldPtToScreenPt,
        readPixel(pt: Vec2): Colour | undefined {
            let image2 = image();
            if (image2 == undefined) {
                return undefined;
            }
            if (pt.x < 0 || pt.x >= image2.imageData.width) {
                return;
            }
            if (pt.y < 0 || pt.y >= image2.imageData.height) {
                return;
            }
            let data = image2.imageData.data;
            let offset = (image2.imageData.width * pt.y + pt.x) << 2;
            return new Colour(
                data[offset],
                data[offset+1],
                data[offset+2],
                data[offset+3],
            );
        },
        writePixel(pt: Vec2, colour: Colour): void {
            let image2 = image();
            if (image2 == undefined) {
                return;
            }
            if (pt.x < 0 || pt.x >= image2.imageData.width) {
                return;
            }
            if (pt.y < 0 || pt.y >= image2.imageData.height) {
                return;
            }
            let data = image2.imageData.data;
            let offset = (image2.imageData.width * pt.y + pt.x) << 2;
            data[offset] = colour.r;
            data[offset+1] = colour.g;
            data[offset+2] = colour.b;
            data[offset+3] = colour.a;
            image2.ctx.putImageData(image2.imageData, 0, 0, pt.x, pt.y, 1, 1);
            render();
        },
    };
    let mode = createMemo<Mode>(() => {
        switch (state.mode) {
            case "Idle": {
                return new IdleMode(modeParams);
            }
            case "Draw Pixels":
                return new DrawPixelsMode(modeParams);
        }
    });
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
    let onClick = (e: MouseEvent) => {
        mode().click?.();
    };
    let onKeyDown = (e: KeyboardEvent) => {
        if (e.key == "Escape") {
            setState("mode", "Idle");
        }
    };
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
        document.removeEventListener("keydown", onKeyDown);
    });
    return (
        <div
            style={{
                "flex-grow": "1",
                "display": "flex",
                "flex-direction": "row",
            }}
        >
            <div
                style={{
                    "display": "flex",
                    "flex-direction": "column",
                    "background-color": "black",
                }}
            >
                <button
                    style={{
                        "font-size": "20pt",
                        "padding": "5pt",
                    }}
                    disabled={!undoManager.canUndo()}
                    onClick={() => undoManager.undo()}
                >
                    <i class="fas fa-undo"></i>
                </button>
                <button
                    style={{
                        "font-size": "20pt",
                        "padding": "5pt",
                    }}
                    disabled={!undoManager.canRedo()}
                    onClick={() => undoManager.redo()}
                >
                    <i class="fas fa-redo"></i>
                </button>
                <button
                    style={{
                        "font-size": "20pt",
                        "padding": "5pt",
                        "background-color": state.mode == "Draw Pixels" ? "blue" : undefined,
                    }}
                    onClick={() => setState("mode", "Draw Pixels")}
                >
                    <i class="fa-solid fa-pencil"/>
                </button>
            </div>
            <div
                style={{
                    "position": "relative",
                    "flex-grow": "1",
                    "display": "flex",
                    "flex-direction": "column",
                }}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                onMouseOut={onMouseOut}
                onWheel={onWheel}
                onClick={onClick}
            >
                <canvas
                    style={{
                        "flex-grow": "1"
                    }}
                    ref={setCanvas}
                />
                {/* Debug stuff
                <div
                    style={{
                        "position": "absolute",
                        "left": "0",
                        "top": "0",
                    }}
                >
                    <Show when={state.mousePos}>
                        {(pt) => (<>{`${pt().x.toFixed(0)}, ${pt().y.toFixed(0)}`}<br/></>)}
                    </Show>
                    <Show when={state.mousePos != undefined ? screenPtToWorldPt(state.mousePos) : undefined}>
                        {(pt) => (<>{`${pt().x.toFixed(0)}, ${pt().y.toFixed(0)}`}</>)}
                    </Show>
                </div>
                */}
            </div>
        </div>
    );
};

export default PixelEditor;
