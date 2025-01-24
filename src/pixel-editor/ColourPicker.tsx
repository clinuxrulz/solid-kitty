import { Component, createComputed, createMemo, createSignal, JSX, mergeProps, onCleanup } from "solid-js";
import { Vec2 } from "../Vec2";

const ColourPicker: Component = (props) => {
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
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    });
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