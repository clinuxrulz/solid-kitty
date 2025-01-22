import { Component, createComputed, createEffect, createMemo, createSignal, onCleanup } from "solid-js";

const PixelEditor: Component = () => {
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
    let imageData = createMemo(() => {
        let ctx2 = ctx();
        if (ctx2 == undefined) {
            return undefined;
        }
        let result = ctx2.createImageData(100, 100);
        let at = 0;
        for (let i = 0; i < 100; ++i) {
            for (let j = 0; j < 100; ++j) {
                result.data[at++] = i;
                result.data[at++] = 0;
                result.data[at++] = j;
                result.data[at++] = 255;
            }
        }
        return result;
    });
    function drawOnCanvas() {
        let ctx2 = ctx();
        if (ctx2 == undefined) {
            return;
        }
        let imageData2 = imageData();
        if (imageData2 == undefined) {
            return;
        }
        ctx2.putImageData(imageData2, 100, 100);
    }
    return (
        <div
            style={{
                "flex-grow": "1",
                "display": "flex",
                "flex-direction": "column",
            }}
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
