import { Component, createComputed, createMemo, createSignal, JSX, mergeProps, on, onCleanup } from "solid-js";
import { Vec2 } from "../Vec2";
import { createStore } from "solid-js/store";

const ColourPicker: Component = (props) => {
    let [ state, setState, ] = createStore<{
        brightness: number,
    }>({
        brightness: 255,
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
        return canvas;
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
    return (
        <div
            style={{
                "flex-grow": "1",
                "display": "flex",
                "flex-direction": "column",
            }}
        >
            zzz
            <div
                ref={setColourChartDiv}
                style={{
                    "flex-grow": "1",
                    "display": "flex",
                    "flex-direction": "column",
                }}
            >
                {canvas()}
            </div>
        </div>
    );
};

export default ColourPicker;