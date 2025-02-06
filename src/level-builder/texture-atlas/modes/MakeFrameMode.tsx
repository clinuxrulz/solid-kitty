import { Component, createMemo, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { Vec2 } from "../../../Vec2";

export class MakeFrameMode implements Mode {
    overlaySvgUI: Component;
    dragStart: () => void;
    dragEnd: () => void;
    click: () => void;
    disableOneFingerPan = () => true;

    constructor(modeParams: ModeParams) {
        let [ state, setState, ] = createStore<{
            corner1: Vec2 | undefined,
            corner2: Vec2 | undefined,
        }>({
            corner1: undefined,
            corner2: undefined,
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
                Math.round(pt.x),
                Math.round(pt.y),
            );
        });
        //
        this.overlaySvgUI = () => {
            let pt = createMemo(() => {
                let pt2 = workingPoint();
                if (pt2 == undefined) {
                    return undefined;
                }
                return modeParams.worldPtToScreenPt(pt2);
            });
            return (
                <Show when={pt()}>
                    {(pt2) => (
                        <Show when={modeParams.screenSize()}>
                            {(screenSize) => (<>
                                <line
                                    x1="0"
                                    y1={pt2().y}
                                    x2={screenSize().x}
                                    y2={pt2().y}
                                    stroke="gray"
                                    stroke-width="2"
                                    pointer-events="none"
                                />
                                <line
                                    x1={pt2().x}
                                    y1="0"
                                    x2={pt2().x}
                                    y2={screenSize().y}
                                    stroke="gray"
                                    stroke-width="2"
                                    pointer-events="none"
                                />
                            </>)}
                        </Show>
                    )}
                </Show>
            );
        };
        this.dragStart = () => {
            if (state.corner1 == undefined) {
                let pt = workingPoint();
                if (pt != undefined) {
                    setState("corner1", pt);
                }
                return;
            }
        };
        this.dragEnd = () => {
            if (state.corner2 == undefined) {
                let pt = workingPoint();
                if (pt != undefined) {
                    setState("corner2", pt);
                }
                return;
            }
        };
        this.click = () => {
            if (state.corner1 == undefined) {
                let pt = workingPoint();
                if (pt != undefined) {
                    setState("corner1", pt);
                }
                return;
            }
            if (state.corner2 == undefined) {
                let pt = workingPoint();
                if (pt != undefined) {
                    setState("corner2", pt);
                }
                return;
            }
        };
    }
}
