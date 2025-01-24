import { batch, Component, createComputed, createEffect, createMemo, createSignal, JSX, mergeProps, on, onCleanup, untrack } from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore } from "solid-js/store";
import { Colour } from "./Colour";

const ColourPicker: Component<{
    colour?: Colour,
    onColour?: (colour: Colour) => void,
}> = (props) => {
    let [ state, setState, ] = createStore<{
        cursorPos: Vec2,
        chartMousePos: Vec2 | undefined,
        chartMouseDown: boolean,
        brightness: number,
        brightnessMousePos: Vec2 | undefined,
        brightnessMouseDown: boolean,
        userColour: Colour | undefined,
    }>({
        cursorPos: Vec2.zero(),
        chartMousePos: undefined,
        chartMouseDown: false,
        brightness: 255,
        brightnessMousePos: undefined,
        brightnessMouseDown: false,
        userColour: untrack(() => props.colour),
    });
    let [ colourChartDiv, setColourChartDiv, ] = createSignal<HTMLDivElement>();
    let [ colourChartSize, setColourChartSize, ] = createSignal<Vec2 | undefined>();
    createComputed(() => {
        let div = colourChartDiv();
        if (div == undefined) {
            return;
        }
        let resizeObserver = new ResizeObserver(
            () => {
                let rect = div.getBoundingClientRect();
                let tmp = colourChartSize();
                setColourChartSize(
                    Vec2.create(
                        rect.width,
                        rect.height,
                    )
                );
                if (tmp != undefined) {
                    tmp.dispose();
                }
            }
        );
        resizeObserver.observe(div);
        onCleanup(() => {
            resizeObserver.unobserve(div);
            resizeObserver.disconnect();
        });
    });
    let canvas = createMemo(() => {
        let size = colourChartSize();
        if (size == undefined) {
            return;
        }
        let canvas = document.createElement("canvas");
        canvas.setAttribute("width", `${size.x}`);
        canvas.setAttribute("height", `${size.y}`);
        canvas.style.setProperty("flex-grow", "1");
        let ctx = canvas.getContext("2d");
        if (ctx == null) {
            return;
        }
        let imageData = new ImageData(size.x, size.y);
        // Phases:
        // - red to yellow
        // - yellow to green
        // - green to cyan
        // - cyan to blue
        // - blue to purple
        // - purple to red
        let phaseMax = 256*6;
        for (let j = 0; j < size.x; ++j) {
            let r: number;
            let g: number;
            let b: number;
            let phaseIndex = Math.floor(j * phaseMax / size.x);
            if (phaseIndex < 256) {
                let idx = phaseIndex;
                r = 255;
                g = idx;
                b = 0;
            } else if (phaseIndex < 256*2) {
                let idx = phaseIndex - 256;
                r = 255-idx;
                g = 255;
                b = 0;
            } else if (phaseIndex < 256*3) {
                let idx = phaseIndex - 256*2;
                r = 0;
                g = 255;
                b = idx;
            } else if (phaseIndex < 256*4) {
                let idx = phaseIndex - 256*3;
                r = 0;
                g = 255-idx;
                b = 255;
            } else if (phaseIndex < 256*5) {
                let idx = phaseIndex - 256*4;
                r = idx;
                g = 0;
                b = 255;
            } else {
                let idx = phaseIndex - 256*5;
                r = 255;
                g = 0;
                b = 255-idx;
            }
            let offset = j << 2;
            for (let i = 0; i < size.y; ++i) {
                let r2 = r + Math.floor((256-r) * i / size.y);
                let g2 = g + Math.floor((256-g) * i / size.y);
                let b2 = b + Math.floor((256-b) * i / size.y);
                imageData.data[offset] = r2;
                imageData.data[offset+1] = g2;
                imageData.data[offset+2] = b2;
                imageData.data[offset+3] = 255;
                offset += size.x << 2;
            }
        }
        let brightnessImageData = new ImageData(size.x, size.y);
        createComputed(on(
            () => state.brightness,
            () => {
                let brightness = state.brightness;
                let dataSize = (size.x * size.y) << 2;
                for (let i = 0; i < dataSize; i += 4) {
                    let r = imageData.data[i];
                    let g = imageData.data[i+1];
                    let b = imageData.data[i+2];
                    let a = imageData.data[i+3];
                    let r2 = Math.floor(r * brightness / 255.0);
                    let g2 = Math.floor(g * brightness / 255.0);
                    let b2 = Math.floor(b * brightness / 255.0);
                    brightnessImageData.data[i] = r2;
                    brightnessImageData.data[i+1] = g2;
                    brightnessImageData.data[i+2] = b2;
                    brightnessImageData.data[i+3] = a;
                }
                ctx.putImageData(brightnessImageData, 0, 0);
            },
        ));
        let sliderCanvas = document.createElement("canvas");
        sliderCanvas.setAttribute("width", "1");
        sliderCanvas.setAttribute("height", `${size.y}`);
        sliderCanvas.style.setProperty("flex-grow", "1");
        let sliderCtx = sliderCanvas.getContext("2d");
        if (sliderCtx == null) {
            return;
        }
        let sliderImageData = new ImageData(1, size.y);
        createComputed(() => {
            let cursorPos = state.cursorPos;
            if (cursorPos == undefined) {
                return;
            }
            let offset = (imageData.width * cursorPos.y + cursorPos.x) << 2;
            let r = imageData.data[offset];
            let g = imageData.data[offset+1];
            let b = imageData.data[offset+2];
            for (let i = 0; i < size.y; ++i) {
                let offset = i<<2;
                let r2 = Math.floor(r * (size.y-1-i) / (size.y-1));
                let g2 = Math.floor(g * (size.y-1-i) / (size.y-1));
                let b2 = Math.floor(b * (size.y-1-i) / (size.y-1));
                sliderImageData.data[offset] = r2;
                sliderImageData.data[offset+1] = g2;
                sliderImageData.data[offset+2] = b2;
                sliderImageData.data[offset+3] = 255;
            }
            sliderCtx.putImageData(sliderImageData, 0, 0);
        });
        return { canvas, sliderCanvas, size, sliderImageData, };
    });
    /* Debug brightness changes
    let done = false;
    onCleanup(() => done = true);
    let brightnessAnimationUpdate = () => {
        if (done) {
            return;
        }
        setState("brightness", (x) => (x + 1) & 255);
        requestAnimationFrame(brightnessAnimationUpdate);
    };
    requestAnimationFrame(brightnessAnimationUpdate);
    */
    createEffect(() => {
        if (!state.chartMouseDown) {
            return;
        }
        let pt = state.chartMousePos;
        if (pt == undefined) {
            return;
        }
        setState("cursorPos", pt);
    });
    createEffect(() => {
        if (!state.brightnessMouseDown) {
            return;
        }
        let pt = state.brightnessMousePos;
        if (pt == undefined) {
            return;
        }
        let sizeY = canvas()?.size.y;
        if (sizeY == undefined) {
            return;
        }
        setState("brightness", Math.max(0, Math.min(255, Math.floor(256 * (sizeY - pt.y) / sizeY))));
    });
    let colourInCanvas = createMemo(on(
        [
            canvas,
            () => state.cursorPos,
            () => state.brightness,
        ],
        () => {
            let canvas2 = canvas();
            if (canvas2 == undefined) {
                return undefined;
            }
            let i = Math.max(0, Math.min(canvas2.size.y, Math.floor((255-state.brightness) * canvas2.size.y / 256)));
            let offset = i << 2;
            let r = canvas2.sliderImageData.data[offset];
            let g = canvas2.sliderImageData.data[offset+1];
            let b = canvas2.sliderImageData.data[offset+2];
            setState("userColour", undefined);
            return new Colour(r, g, b, 255);
        })
    );
    let currentColour = createMemo(() => {
        if (state.userColour != undefined) {
            return state.userColour;
        }
        return colourInCanvas();
    });
    createEffect(on(
        colourInCanvas,
        () => {
            let c = colourInCanvas();
            if (c != undefined) {
                props.onColour?.(c);
            }
        }
    ));
    /*
    createEffect(() => {
        let c = state.userColour;
        if (c == undefined) {
            return;
        }
        let mv = Math.max(c.r, c.g, c.b);
        let brightness = mv;
        batch(() => {
            setState("brightness", brightness);
        });
    });*/
    return (
        <div
            style={{
                "flex-grow": "1",
                "display": "flex",
                "flex-direction": "column",
            }}
        >
            <div
                style={{
                    "flex-grow": "1",
                    "display": "flex",
                    "flex-direction": "row",
                }}
            >
                <div
                    style={{
                        "position": "relative",
                        "flex-grow": "1",
                        "display": "flex",
                        "flex-direction": "column",
                    }}
                    onMouseMove={(e) => {
                        let rect = e.currentTarget.getBoundingClientRect();
                        let x = e.clientX - rect.left;
                        let y = e.clientY - rect.top;
                        setState("chartMousePos", Vec2.create(x, y));
                    }}
                    onMouseOut={(e) => {
                        setState("chartMousePos", undefined);
                    }}
                    onMouseDown={() => {
                        setState("chartMouseDown", true);
                    }}
                    onMouseUp={() => {
                        setState("chartMouseDown", false);
                    }}
                >
                    <div
                        ref={setColourChartDiv}
                        style={{
                            "flex-grow": "1",
                            "display": "flex",
                            "flex-direction": "column",
                        }}
                    >
                        {canvas()?.canvas}
                    </div>
                    <svg
                        width={canvas()?.size.x ?? 300}
                        height={canvas()?.size.y ?? 300}
                        style={{
                            "position": "absolute",
                            "left": "0",
                            "top": "0",
                            "right": "0",
                            "bottom": "0",
                        }}
                    >
                        <circle
                            cx={state.cursorPos.x}
                            cy={state.cursorPos.y}
                            r="5"
                            stroke="black"
                            stroke-width={2}
                            fill="none"
                        />
                    </svg>
                </div>
                <div
                    style={{
                        "position": "relative",
                        "display": "flex",
                        "flex-direction": "row",
                        "width": "25px",
                        "height": `${canvas()?.size.y ?? 0}px`,
                        "margin-left": "15px",
                        "overflow": "hidden",
                    }}
                    onMouseMove={(e) => {
                        let rect = e.currentTarget.getBoundingClientRect();
                        let x = e.clientX - rect.left;
                        let y = e.clientY - rect.top;
                        setState("brightnessMousePos", Vec2.create(x, y));
                    }}
                    onMouseOut={(e) => {
                        setState("brightnessMousePos", undefined);
                    }}
                    onMouseDown={() => {
                        setState("brightnessMouseDown", true);
                    }}
                    onMouseUp={() => {
                        setState("brightnessMouseDown", false);
                    }}
                >
                    {canvas()?.sliderCanvas}
                    <svg
                        width={25}
                        height={canvas()?.size.y ?? 0}
                        style={{
                            "position": "absolute",
                            "left": "0",
                            "top": "0",
                            "right": "0",
                            "bottom": "0",
                        }}
                    >
                        <rect
                            x={0}
                            y={(canvas()?.size.y ?? 0) - state.brightness * (canvas()?.size.y ?? 0) / 255 - 5}
                            width={24}
                            height={10}
                            fill="none"
                            stroke="black"
                            stroke-width={2}
                        />
                    </svg>
                </div>
            </div>
            <div
                style={{
                    "display": "flex",
                    "flex-direction": "row",
                }}
            >
                <div
                    style={{
                        "flex-grow": "1"
                    }}
                >
                    <table>
                        <thead/>
                        <tbody>
                            <tr>
                                <td>Red:</td>
                                <td>
                                    <input
                                        type="text"
                                        value={state.userColour?.r ?? colourInCanvas()?.r}
                                        onInput={(e) => {
                                            let value = Number.parseInt(e.currentTarget.value);
                                            if (!Number.isFinite(value)) {
                                                return;
                                            }
                                            if (value < 0 || value > 255) {
                                                return;
                                            }
                                            let c = currentColour();
                                            let c2 = new Colour(
                                                value,
                                                c?.g ?? 0,
                                                c?.b ?? 0,
                                                255
                                            );
                                            setState("userColour", c2);
                                        }}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>Green:</td>
                                <td>
                                    <input
                                        type="text"
                                        value={state.userColour?.g ?? colourInCanvas()?.g}
                                        onInput={(e) => {
                                            let value = Number.parseInt(e.currentTarget.value);
                                            if (!Number.isFinite(value)) {
                                                return;
                                            }
                                            if (value < 0 || value > 255) {
                                                return;
                                            }
                                            let c = currentColour();
                                            let c2 = new Colour(
                                                c?.r ?? 0,
                                                value,
                                                c?.b ?? 0,
                                                255
                                            );
                                            setState("userColour", c2);
                                        }}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>Blue:</td>
                                <td>
                                    <input
                                        type="text"
                                        value={state.userColour?.b ?? colourInCanvas()?.b}
                                        onInput={(e) => {
                                            let value = Number.parseInt(e.currentTarget.value);
                                            if (!Number.isFinite(value)) {
                                                return;
                                            }
                                            if (value < 0 || value > 255) {
                                                return;
                                            }
                                            let c = currentColour();
                                            let c2 = new Colour(
                                                c?.r ?? 0,
                                                c?.g ?? 0,
                                                value,
                                                255
                                            );
                                            setState("userColour", c2);
                                        }}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div
                    style={{
                        "width": "50px",
                        "height": "50px",
                        "background-color": (() => {
                            let c = currentColour();
                            if (c == undefined) {
                                return undefined;
                            }
                            return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`
                        })(),
                        "margin-top": "10px",
                    }}
                />
            </div>
        </div>
    );
};

export default ColourPicker;