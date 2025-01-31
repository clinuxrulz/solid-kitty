import { Accessor, batch, Component, createComputed, createEffect, createMemo, createResource, createSignal, on, onCleanup, onMount, Setter, Show, untrack } from "solid-js";
import { createStore } from "solid-js/store";
import { Vec2 } from "../Vec2";
import { ModeParams } from "./ModeParams";
import { Colour } from "../Colour";
import { IdleMode } from "./modes/IdleMode";
import { DrawPixelsMode } from "./modes/DrawPixelsMode";
import { Mode } from "./Mode";
import { UndoManager } from "./UndoManager";
import ColourPicker from "./ColourPicker";
import { EyeDropperMode } from "./modes/EyeDropperMode";
import { ErasePixelsMode } from "./modes/ErasePixelsMode";
import { StaticRouter } from "@solidjs/router";
import { Storage } from "./Storage";
import * as FileSaver from "file-saver";

const AUTO_SAVE_TIMEOUT = 2000;

const PixelEditor: Component = () => {
    let [ state, setState, ] = createStore<{
        minPt: Vec2,
        size: Vec2,
        //
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
        //
        isTouchPanZoom: boolean,
        touchPanZoomFrom: Vec2 | undefined,
        touchPanZoomInitScale: number | undefined,
        touchPanZoomInitGap: number | undefined,
        //
        mode:
            "Idle" |
            "Draw Pixels" |
            "Erase Pixels" |
            "Eye Dropper",
        //
        currentColour: Colour,
        showColourPicker: boolean,
        //
        isLoading: boolean,
        autoSaving: boolean,
    }>({
        minPt: Vec2.zero(),
        size: Vec2.create(10, 10),
        //
        mousePos: undefined,
        pan: Vec2.create(-1, -1),
        scale: 30.0,
        //
        touches: [],
        // panning states
        isPanning: false,
        panningFrom: undefined,
        //
        isTouchPanZoom: false,
        touchPanZoomFrom: undefined,
        touchPanZoomInitScale: undefined,
        touchPanZoomInitGap: undefined,
        //
        mode: "Idle",
        //
        currentColour: new Colour(0, 255, 0, 255),
        showColourPicker: false,
        //
        isLoading: false,
        autoSaving: false,
    });
    const undoManager = new UndoManager();
    let storage: Accessor<Storage | undefined>;
    {
        let [ storage_, ] = createResource(Storage.init);
        storage = createMemo(() => {
            let x = storage_();
            if (x == undefined) {
                return undefined;
            }
            if (x.type == "Err") {
                console.log("Load storage error: " + x.message);
                return undefined;
            }
            return x.value;
        });
    }
    let triggerAutoSave: () => void;
    {
        let isAutoSaving = false;
        let autoSaveTimerId: number | undefined = undefined;
        triggerAutoSave = () => {
            if (isAutoSaving) {
                return;
            }
            if (autoSaveTimerId != undefined) {
                clearTimeout(autoSaveTimerId);
            }
            setState("autoSaving", true);
            autoSaveTimerId = setTimeout(() => {
                isAutoSaving = true;
                let image2 = image();
                if (image2 == undefined) {
                    return;
                }
                let storage2 = storage();
                if (storage2 == undefined) {
                    return;
                }
                (async () => {
                    let blob = await image2.image.convertToBlob();
                    let r = await storage2.saveWork(blob);
                    if (r.type == "Err") {
                        console.log(r.message);
                    }
                    setState("autoSaving", false);
                    isAutoSaving = false;
                })();
            }, AUTO_SAVE_TIMEOUT);
        };
    }
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
        let offCtx = result.getContext("2d");
        if (offCtx == undefined) {
            return undefined;
        }
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
    let canvasLoaded = createMemo(() => image() != undefined);
    createComputed(() => {
        if (!canvasLoaded()) {
            return;
        }
        let image2 = untrack(() => image());
        if (image2 == undefined) {
            return;
        }
        let storage2 = storage();
        if (storage2 == undefined) {
            return;
        }
        setState("isLoading", true);
        let [ previousWork, ] = createResource(() => storage2.loadPreviousWork());
        createComputed(() => {
            let previousWork2 = previousWork();
            if (previousWork2 == undefined) {
                setState("isLoading", false);
                return;
            }
            if (previousWork2.type == "Err") {
                setState("isLoading", false);
                console.log(previousWork2.message);
                return;
            }
            let previousWork3 = previousWork2.value;
            if (previousWork3 == undefined) {
                setState("isLoading", false);
                return;
            }
            let url = URL.createObjectURL(previousWork3);
            let image3 = new Image();
            image3.src = url;
            image3.onerror = () => {
                setState("isLoading", false);
                console.log("Failed to load previous work");
            };
            image3.onload = () => {
                setState("isLoading", false);
                let x = resizeImage({
                    minPt: Vec2.zero(),
                    size: Vec2.create(
                        image3.width,
                        image3.height,
                    ),
                });
                if (x == undefined) {
                    return;
                }
                x.ctx.drawImage(image3, 0, 0);
                let imageData = x.ctx.getImageData(0, 0, image3.width, image3.height);
                setImage({
                    image: x.image,
                    imageData,
                    ctx: x.ctx,
                });
                render();
            };
        });
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
            let offset = (image2.imageData.width * (pt.y - state.minPt.y) + (pt.x - state.minPt.x)) << 2;
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
            triggerAutoSave();
        },
    };
    let mode = createMemo<Mode>(() => {
        switch (state.mode) {
            case "Idle":
                return new IdleMode(modeParams);
            case "Draw Pixels":
                return new DrawPixelsMode(modeParams);
            case "Erase Pixels":
                return new ErasePixelsMode(modeParams);
            case "Eye Dropper":
                return new EyeDropperMode(modeParams);

        }
    });
    let modeInstructions = createMemo(() => {
        return mode().instructions;
    });
    let modeOverlaySvgUI = createMemo(() => {
        return mode().overlaySvgUI;
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
    let onTouchStart = (e: TouchEvent) => {
        let canvas2 = canvas();
        if (canvas2 == undefined) {
            return;
        }
        let rect = canvas2.getBoundingClientRect();
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
        let canvas2 = canvas();
        if (canvas2 == undefined) {
            return;
        }
        let rect = canvas2.getBoundingClientRect();
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
    let onKeyDown = (e: KeyboardEvent) => {
        if (e.key == "Escape") {
            setState("mode", "Idle");
        }
    };
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
        document.removeEventListener("keydown", onKeyDown);
    });
    //
    let deleteDrawing = () => {
        if (!window.confirm("Are you sure you want to delete this drawing and start again?")) {
            return;
        }
        let initSize = Vec2.create(10, 10);
        let image2 = makeInitImage({ size: initSize, });
        if (image2 == undefined) {
            return;
        }
        batch(() => {
            setState("size", initSize);
            setImage(image2);
            undoManager.clear();
            render();
            triggerAutoSave();
        });
    };
    let saveDrawing = async () => {
        let image2 = image();
        if (image2 == undefined) {
            return;
        }
        let blob = await image2.image.convertToBlob({ type: "image/png", });
        FileSaver.saveAs(blob, "sprite-sheet.png");
    };
    //
    return (
        <div
            style={{
                "position": "relative",
                "flex-grow": "1",
                "display": "flex",
                "flex-direction": "row",
            }}
        >
            <div
                style={{
                    "background-color": "dimgray",
                }}
            >
                <div
                    style={{
                        "display": "grid",
                        "grid-template-columns": "auto auto",
                    }}
                >
                    <button
                        style={{
                            "font-size": "20pt",
                            "padding": "5pt",
                        }}
                        onClick={() => saveDrawing()}
                    >
                        <i class="fa-solid fa-floppy-disk"></i>
                    </button>
                    {(() => {
                        let fileInput!: HTMLInputElement;
                        return (<>
                            <button
                                style={{
                                    "font-size": "20pt",
                                    "padding": "5pt",
                                }}
                                onClick={() => {
                                    fileInput.click();
                                }}
                            >
                                <i class="fa-solid fa-folder-open"></i>
                            </button>
                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/png"
                                hidden
                                onInput={() => {
                                    if (fileInput.files?.length != 1) {
                                        return;
                                    }
                                    let file = fileInput.files[0];
                                    let url = URL.createObjectURL(file);
                                    let image2 = new Image();
                                    image2.src = url;
                                    image2.onerror = () => {
                                        URL.revokeObjectURL(url);
                                        console.log("Failed to load image.");
                                    };
                                    image2.onload = () => {
                                        let x = resizeImage({
                                            minPt: Vec2.zero(),
                                            size: Vec2.create(
                                                image2.width,
                                                image2.height,
                                            ),
                                        });
                                        if (x == undefined) {
                                            URL.revokeObjectURL(url);
                                            return;
                                        }
                                        x.ctx.drawImage(image2, 0, 0);
                                        let imageData = x.ctx.getImageData(0, 0, image2.width, image2.height);
                                        setImage({
                                            image: x.image,
                                            imageData,
                                            ctx: x.ctx,
                                        });
                                        render();
                                        undoManager.clear();
                                        triggerAutoSave();
                                        URL.revokeObjectURL(url);
                                    };
                                }}
                            />
                        </>);
                    })()}
                        {/*
                    <ion-button onclick="document.querySelector('#uploader').click()">pop file chooser</ion-button>
<input type="file" id="uploader" hidden>
                         */}
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
                        }}
                        onClick={() => deleteDrawing()}
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <button
                        style={{
                            "font-size": "20pt",
                            "padding": "5pt",
                            "background-color": state.mode == "Draw Pixels" ? "blue" : undefined,
                        }}
                        onClick={() => {
                            if (state.mode == "Draw Pixels") {
                                setState("mode", "Idle");
                            } else {
                                setState("mode", "Draw Pixels");
                            }
                        }}
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
                            "background-color": state.mode == "Erase Pixels" ? "blue" : undefined,
                        }}
                        onClick={() => {
                            if (state.mode == "Erase Pixels") {
                                setState("mode", "Idle");
                            } else {
                                setState("mode", "Erase Pixels");
                            }
                        }}
                    >
                        <i class="fa-solid fa-eraser"></i>
                    </button>
                    <button
                        style={{
                            "font-size": "20pt",
                            "padding": "5pt",
                            "background-color": state.mode == "Eye Dropper" ? "blue" : undefined,
                        }}
                        onClick={() => {
                            if (state.mode == "Eye Dropper") {
                                setState("mode", "Idle");
                            } else {
                                setState("mode", "Eye Dropper");
                            }
                        }}
                    >
                        <i class="fa-solid fa-eye-dropper"></i>
                    </button>
                </div>
            </div>
            <div
                style={{
                    "position": "relative",
                    "flex-grow": "1",
                    "display": "flex",
                    "flex-direction": "column",
                }}
            >
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
                    onWheel={onWheel}
                    onClick={onClick}
                    on:touchstart={{ passive: true, handleEvent: onTouchStart, }}
                    on:touchend={{ passive: true, handleEvent: onTouchEnd, }}
                    on:touchmove={{ passive: false, handleEvent: onTouchMove, }}
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
                        {state.isLoading ? <>Loading...<br/></> : undefined}
                        {state.autoSaving ? <>Saving...<br/></> : undefined}
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
                                    <Show when={modeOverlaySvgUI()}>
                                        {(moveOverlaySvgUI2) => (<>{
                                            moveOverlaySvgUI2()({})
                                        }</>)}
                                    </Show>
                                </svg>
                            );
                        })()}
                    </div>
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
            <Show when={state.showColourPicker}>
                <Show when={colourPickerButton()}>
                    {(btn) => {
                        let colourDiv!: HTMLDivElement;
                        let pt = createMemo(() => {
                            let btn2 = btn();
                            let rect = btn2.getBoundingClientRect();
                            return Vec2.create(rect.right, rect.top);
                        });
                        onMount(() => {
                            colourDiv.focus();
                        });
                        return (
                            <div
                                ref={colourDiv}
                                style={{
                                    "position": "absolute",
                                    "left": `${pt().x}px`,
                                    "top": `${pt().y}px`,
                                    "display": "flex",
                                    "flex-direction": "column",
                                    "width": "300px",
                                    "height": "300px",
                                    "background-color": "white",
                                    "padding": "20px",
                                    "border": "1px solid black",
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
        </div>
    );
};

export default PixelEditor;
