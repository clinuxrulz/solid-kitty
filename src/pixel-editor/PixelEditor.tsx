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
    let image = createMemo(() => {
        let ctx2 = ctx();
        if (ctx2 == undefined) {
            return undefined;
        }
        let imageData = new ImageData(100,100);
        let result = new OffscreenCanvas(100, 100);
        let data = imageData.data;
        let at = 0;
        for (let i = 0; i < 100; ++i) {
            for (let j = 0; j < 100; ++j) {
                data[at++] = i;
                data[at++] = 0;
                data[at++] = j;
                data[at++] = 255;
            }
        }
        let offCtx = result.getContext("2d");
        offCtx.putImageData(imageData, 0, 0);
        return result;
    });
    function drawOnCanvas() {
        let ctx2 = ctx();
        if (ctx2 == undefined) {
            return;
        }
        let image2 = image();
        if (image2 == undefined) {
            return;
        }
        ctx2.drawImage(image2, 50, 50, 300, 300);
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
