import { createStore } from "solid-js/store";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { Vec2 } from "../../Vec2";
import { Accessor, Component, createComputed, createMemo, onCleanup, Show } from "solid-js";
import { drawLine } from "../shapes";

export class DrawLinesMode implements Mode {
    overlaySvgUI: Component;
    dragStart: () => void;
    dragEnd: () => void;
    disableOneFingerPan: () => boolean = () => true;

    constructor(modeParams: ModeParams) {
        let [ state, setState, ] = createStore<{
            pt1: Vec2 | undefined,
        }>({
            /**
             * The first point of the line.
             * If pt1 is not undefined, then we are dragging.
             */
            pt1: undefined,
        });
        let workingPoint = createMemo(() => {
            let mousePos = modeParams.mousePos();
            if (mousePos == undefined) {
                return undefined;
            }
            let pt = modeParams.screenPtToWorldPt(mousePos);
            if (pt == undefined) {
                return undefined;
            }
            return Vec2.create(
                Math.floor(pt.x),
                Math.floor(pt.y),
            );
        });
        let wipLine = createMemo(() => {
            if (state.pt1 == undefined) {
                return undefined;
            }
            let pt2 = workingPoint();
            if (pt2 == undefined) {
                return undefined;
            }
            return { pt1: state.pt1, pt2, };
        });
        {
            let hasLine = createMemo(() => wipLine() != undefined);
            createComputed(() => {
                if (!hasLine()) {
                    return;
                }
                let wipLine2 = wipLine as Accessor<NonNullable<ReturnType<typeof wipLine>>>;
                let undoStack: (()=>void)[] = [];
                createComputed(() => {
                    let line = wipLine2();
                    drawLine(
                        line.pt1.x,
                        line.pt1.y,
                        line.pt2.x,
                        line.pt2.y,
                        (x, y) => {
                            let pos = Vec2.create(x, y);
                            let oldColour = modeParams.readPixel(pos);
                            if (oldColour == undefined) {
                                return;
                            }
                            let newColour = modeParams.currentColour();
                            if (
                                newColour.r == oldColour.r &&
                                newColour.g == oldColour.g &&
                                newColour.b == oldColour.b &&
                                newColour.a == oldColour.a
                            ) {
                                return;
                            }
                            modeParams.writePixel(pos, newColour);
                            undoStack.push(() => {
                                modeParams.writePixel(pos, oldColour);
                            });
                        },
                    );
                    onCleanup(() => {
                        while (true) {
                            let undo = undoStack.pop();
                            if (undo == undefined) {
                                break;
                            }
                            undo();
                        }
                    });
                });
            });
        }
        this.overlaySvgUI = () => {
            let pixelRect = createMemo(() => {
                let pt1 = workingPoint();
                if (pt1 == undefined) {
                    return undefined;
                }
                let pt2 = Vec2.create(1,1).add(pt1);
                let pt12 = modeParams.worldPtToScreenPt(pt1);
                if (pt12 == undefined) {
                    return undefined;
                }
                let pt22 = modeParams.worldPtToScreenPt(pt2);
                if (pt22 == undefined) {
                    return undefined;
                }
                return {
                    x: pt12.x - 1,
                    y: pt12.y - 1,
                    w: pt22.x - pt12.x + 2,
                    h: pt22.y - pt12.y + 2,
                };
            });
            return (
                <Show when={pixelRect()}>
                    {(pixelRect2) => (
                        <rect
                            x={pixelRect2().x}
                            y={pixelRect2().y}
                            width={pixelRect2().w}
                            height={pixelRect2().h}
                            stroke="black"
                            stroke-width={2}
                            fill="none"
                            pointer-events="none"
                        />
                    )}
                </Show>
            );
        };
        this.dragStart = () => {
            if (state.pt1 == undefined) {
                let pt = workingPoint();
                if (pt != undefined) {
                    setState("pt1", pt);
                }
                return;
            }
        };
        this.dragEnd = () => {
        };
    }
}
