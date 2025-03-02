import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";

export class InsertTileMode implements Mode {
    overlayHtmlUI: Component;

    constructor(modeParams: ModeParams) {
        let textureAtlases = createMemo(() => {
            let textureAtlases2 = modeParams.textureAtlases();
            if (textureAtlases2.type != "Success") {
                return undefined;
            }
            return textureAtlases2.value;
        });
        const DISPLAY_TILE_SIZE = 200;
        this.overlayHtmlUI = () => {
            return (
                <div
                    style={{
                        "position": "absolute",
                        "left": "0",
                        "top": "0",
                        "bottom": "0",
                        "right": "0",
                        "background": "rgba(0,0,0,0.8)",
                        "display": "flex",
                        "flex-direction": "column",
                    }}
                >
                    <div>
                        Select a tile to insert:
                    </div>
                    <Show when={textureAtlases()}>
                        {(textureAtlases2) => (
                            <div
                                style={{
                                    "flex-grow": "1",
                                    "white-space": "normal",
                                    "overflow-y": "auto",
                                }}
                            >
                                <div
                                    style={{
                                        "display": "flex",
                                        "flex-wrap": "wrap",
                                        "flex-direction": "row",
                                    }}
                                >
                                    <For each={textureAtlases2()}>
                                        {(textureAtlas) => {
                                            let image = textureAtlas.image;
                                            let imageUrl = image.src;
                                            return (
                                                <For each={textureAtlas.frames}>
                                                    {(frame) => {
                                                        let scaleX = createMemo(() => DISPLAY_TILE_SIZE / frame.size.x);
                                                        let scaleY = createMemo(() => DISPLAY_TILE_SIZE / frame.size.y);
                                                        let backgroundWidth = createMemo(() =>  image.width * scaleX());
                                                        let backgroundHeight = createMemo(() =>  image.height * scaleY());
                                                        let [ highlightIt, setHighlightIt ] = createSignal(false);
                                                        let onMouseOver = () => {
                                                            setHighlightIt(true);
                                                        };
                                                        let onMouseOut = () => {
                                                            setHighlightIt(false);
                                                        };
                                                        return (
                                                            <div
                                                                onMouseOver={onMouseOver}
                                                                onMouseOut={onMouseOut}
                                                                style={{
                                                                    "background-image": `url(${imageUrl})`,
                                                                    "background-position-x": `${-frame.pos.x * scaleX()}px`,
                                                                    "background-position-y": `${-frame.pos.y * scaleY()}px`,
                                                                    "background-size": `${backgroundWidth()}px ${backgroundHeight()}px`,
                                                                    "background-color": highlightIt() ? "blue" : undefined,
                                                                    "background-blend-mode": highlightIt() ? "lighten" : undefined,
                                                                    "width": `${DISPLAY_TILE_SIZE}px`,
                                                                    "height": `${DISPLAY_TILE_SIZE}px`,
                                                                    "image-rendering": "pixelated",
                                                                    "margin-left": "20px",
                                                                    "margin-top": "20px",
                                                                }}
                                                            />
                                                        );
                                                    }}
                                                </For>
                                            );
                                        }}
                                    </For>
                                </div>
                            </div>
                        )}
                    </Show>
                </div>
            );
        };
    }
}
