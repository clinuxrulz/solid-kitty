import { Accessor, batch, Component, createComputed, createEffect, createMemo, createSignal, on, onCleanup, onMount, Setter, Show, untrack } from "solid-js";
import { createStore } from "solid-js/store";
import { Vec2 } from "../Vec2";
import { ModeParams } from "./ModeParams";
import { Colour } from "./Colour";
import { IdleMode } from "./modes/IdleMode";
import { DrawPixelsMode } from "./modes/DrawPixelsMode";
import { Mode } from "./Mode";
import { UndoManager } from "./UndoManager";
import ColourPicker from "./ColourPicker";
import { EyeDropperMode } from "./modes/EyeDropperMode";

const PixelEditor: Component = () => {
    let [ state, setState, ] = createStore<{
        minPt: Vec2,
        size: Vec2,
        //
        mousePos: Vec2 | undefined,
        pan: Vec2,
        scale: number,
        // panning states
        isPanning: boolean,
        panningFrom: Vec2 | undefined,
        //
        mode: "Idle" | "Draw Pixels" | "Eye Dropper",
        //
        currentColour: Colour,
        showColourPicker: boolean,
    }>({
        minPt: Vec2.zero(),
        size: Vec2.create(10, 10),
        //
        mousePos: undefined,
        pan: Vec2.create(-1, -1),
        scale: 30.0,
        // panning states
        isPanning: false,
        panningFrom: undefined,
        //
        mode: "Idle",
        //
        currentColour: new Colour(0, 255, 0, 255),
        showColourPicker: false,
    });
    const undoManager = new UndoManager();
    let screenPtToWorldPt = (screenPt: Vec2): Vec2 | undefined => {
        return screenPt.clone().multScalar(1.0 / state.scale).add(state.pan);
    };
    let worldPtToScreenPt = (worldPt: Vec2): Vec2 | undefined => {
        return worldPt.clone().sub(state.pan).multScalar(state.scale);
    };
    let [ colourPickerButton, setColourPickerButton, ] = createSignal<HTMLButtonElement>();
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
    let makeInitImage = (params: { size: Vec2, }) => {
        let imageData = new ImageData(params.size.x, params.size.y);
        let result = new OffscreenCanvas(params.size.x, params.size.y);
        let data = imageData.data;
        let at = 0;
        for (let i = 0; i < params.size.y; ++i) {
            for (let j = 0; j < params.size.x; ++j) {
                data[at++] = (i*20) & 255;
                data[at++] = 0;
                data[at++] = (j*20) & 255;
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
    };
    let [ image, setImage ] = createSignal(untrack(() => makeInitImage({ size: state.size, })));
    let resizeImage = (params: {
        minPt: Vec2,
        size: Vec2,
    }): {
        image: OffscreenCanvas;
        imageData: ImageData;
        ctx: OffscreenCanvasRenderingContext2D;
    } | undefined => {
        let result = (() => {
            let lastImage = image();
            if (lastImage == undefined) {
                let newImage = makeInitImage({ size: params.size, });
                if (newImage != undefined) {
                    setImage(newImage);
                }
                return newImage;
            }
            let result = new OffscreenCanvas(params.size.x, params.size.y);
            let offCtx = result.getContext("2d");
            if (offCtx == undefined) {
                return undefined;
            }
            offCtx.putImageData(
                lastImage.imageData,
                state.minPt.x - params.minPt.x,
                state.minPt.y - params.minPt.y
            );
            let imageData = offCtx.getImageData(0, 0, result.width, result.height);
            return {
                image: result,
                imageData,
                ctx: offCtx,
            };
        })();
        batch(() => {
            setState("minPt", params.minPt);
            setState("size", params.size);
        });
        setImage(result);
        return result;
    }
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
        ctx2.drawImage(image2.image, state.minPt.x, state.minPt.y, state.size.x, state.size.y);
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
        currentColour: () => state.currentColour,
        setCurrentColour(colour) {
            setState("currentColour", colour);
        },
        readPixel(pt: Vec2): Colour | undefined {
            let image2 = image();
            if (image2 == undefined) {
                return undefined;
            }
            if (
                pt.x < state.minPt.x || pt.x >= state.minPt.x + image2.imageData.width ||
                pt.y < state.minPt.y || pt.y >= state.minPt.y + image2.imageData.height
            ) {
                return new Colour(0, 0, 0, 0);
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
            let minPt: Vec2;
            let size: Vec2;
            let image3: typeof image2 | undefined;
            if (
                pt.x < state.minPt.x || pt.x >= state.minPt.x + image2.imageData.width ||
                pt.y < state.minPt.y || pt.y >= state.minPt.y + image2.imageData.height
            ) {
                minPt = Vec2.create(
                    Math.min(state.minPt.x, pt.x),
                    Math.min(state.minPt.y, pt.y),
                );
                size = Vec2.create(
                    Math.max(
                        state.size.x + (state.minPt.x - minPt.x),
                        -state.minPt.x + pt.x + 1
                    ),
                    Math.max(
                        state.size.y + (state.minPt.y - minPt.y),
                        -state.minPt.y + pt.y + 1
                    ),
                );
                image3 = resizeImage({
                    minPt,
                    size,
                });
            } else {
                minPt = state.minPt;
                size = state.size;
                image3 = image2;
            }
            if (image3 == undefined) {
                return;
            }
            let data = image3.imageData.data;
            let offset = (image3.imageData.width * (pt.y - minPt.y) + (pt.x - minPt.x)) << 2;
            data[offset] = colour.r;
            data[offset+1] = colour.g;
            data[offset+2] = colour.b;
            data[offset+3] = colour.a;
            image3.ctx.putImageData(
                image3.imageData,
                0,
                0,
                pt.x - minPt.x,
                pt.y - minPt.y,
                1,
                1
            );
            render();
        },
    };
    let mode = createMemo<Mode>(() => {
        switch (state.mode) {
            case "Idle":
                return new IdleMode(modeParams);
            case "Draw Pixels":
                return new DrawPixelsMode(modeParams);
            case "Eye Dropper":
                return new EyeDropperMode(modeParams);

        }
    });
    let modeInstructions = createMemo(() => {
        return mode().instructions;
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
                <button
                    ref={setColourPickerButton}
                    style={{
                        "font-size": "20pt",
                        "padding": "5pt",
                        "background-color": state.showColourPicker ? "blue" : undefined,
                    }}
                    onClick={() => {
                        setState("showColourPicker", (x) => !x);
                    }}
                >
                    <i class="fa-solid fa-palette"></i>
                </button>
                <button
                    style={{
                        "font-size": "20pt",
                        "padding": "5pt",
                        "background-color": state.mode == "Eye Dropper" ? "blue" : undefined,
                    }}
                    onClick={() => {
                        setState("mode", "Eye Dropper");
                    }}
                >
                    <i class="fa-solid fa-eye-dropper"></i>
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
                <div
                    style={{
                        "position": "absolute",
                        "left": "0",
                        "top": "0",
                    }}
                >
                    {modeInstructions()?.({})}
                    {/* Debug stuff
                    <Show when={state.mousePos}>
                        {(pt) => (<>{`${pt().x.toFixed(0)}, ${pt().y.toFixed(0)}`}<br/></>)}
                    </Show>
                    <Show when={state.mousePos != undefined ? screenPtToWorldPt(state.mousePos) : undefined}>
                        {(pt) => (<>{`${pt().x.toFixed(0)}, ${pt().y.toFixed(0)}`}</>)}
                    </Show>
                    */}
                </div>
                <div
                    style={{
                        "position": "absolute",
                        "left": "0",
                        "top": "0",
                        "right": "0",
                        "bottom": "0",
                        "overflow": "hidden",
                    }}
                >
                    {(() => {
                        let [ svg, setSvg, ] = createSignal<SVGSVGElement>();
                        onMount(() => {
                            let svg2 = svg()!;
                            let parent = svg2?.parentElement!;
                            let resizeObserver = new ResizeObserver(() => {
                                let rect = parent.getBoundingClientRect();
                                svg2.setAttribute("width", `${rect.width}`);
                                svg2.setAttribute("height", `${rect.height}`);
                            });
                            resizeObserver.observe(parent);
                            onCleanup(() => {
                                resizeObserver.unobserve(parent);
                                resizeObserver.disconnect();
                            });
                        });
                        let pt1 = createMemo(() => worldPtToScreenPt(state.minPt));
                        let pt2 = createMemo(() => worldPtToScreenPt(state.minPt.clone().add(state.size)));
                        let rect = createMemo(() => {
                            let pt12 = pt1();
                            if (pt12 == undefined) {
                                return undefined;
                            }
                            let pt22 = pt2();
                            if (pt22 == undefined) {
                                return undefined;
                            }
                            return {
                                pt: pt12,
                                size: pt22.clone().sub(pt12),
                            };
                        });
                        return (
                            <svg
                                ref={setSvg}
                            >
                                <Show when={rect()}>
                                    {(rect2) => (
                                        <rect
                                            x={rect2().pt.x}
                                            y={rect2().pt.y}
                                            width={rect2().size.x}
                                            height={rect2().size.y}
                                            stroke="black"
                                            stroke-width={2}
                                            fill="none"
                                        />
                                    )}
                                </Show>
                            </svg>
                        );
                    })()}
                </div>
                <Show when={state.showColourPicker}>
                    <Show when={colourPickerButton()}>
                        {(btn) => {
                            let colourDiv!: HTMLDivElement;
                            let pt = createMemo(() => {
                                let btn2 = btn();
                                let rect = btn2.getBoundingClientRect();
                                return Vec2.create(rect.left, rect.top);
                            });
                            onMount(() => {
                                colourDiv.focus();
                            });
                            return (
                                <div
                                    ref={colourDiv}
                                    style={{
                                        "position": "absolute",
                                        "left": `${pt().x + 20}px`,
                                        "top": `${pt().y}px`,
                                        "display": "flex",
                                        "flex-direction": "column",
                                        "width": "300px",
                                        "height": "300px",
                                    }}
                                >
                                    <ColourPicker
                                        colour={state.currentColour}
                                        onColour={(c) => setState("currentColour", c)}
                                    />
                                </div>
                            );
                        }}
                    </Show>
                </Show>
                {/* // Debug colour picker
                <div
                    style={{
                        "position": "absolute",
                        "left": "200px",
                        "top": "200px",
                        "width": "300px",
                        "height": "300px",
                        "display": "flex",
                        "flex-direction": "column",
                    }}
                >
                    <ColourPicker/>
                </div>
                */}
            </div>
        </div>
    );
};

export default PixelEditor;
