import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { Vec2 } from "../../../Vec2";
import { ModeParams } from "../ModeParams";

const ANCHOR_SIZE = 10.0;
const SNAP_DIST = 10.0;
const SNAP_DIST_SQUARED = SNAP_DIST * SNAP_DIST;

export class ResizeHelper {
    overlaySvgUI: Component;
    dragStart: () => void;
    dragEnd: () => void;

    constructor(params: {
        modeParams: ModeParams,
        rect: {
            pos: Accessor<Vec2>,
            size: Accessor<Vec2>,
            setPos: (x: Vec2) => void,
            setSize: (x: Vec2) => void,
        },
    }) {
        let modeParams = params.modeParams;
        let anchors: {
            xType: "Left" | "Centre" | "Right",
            yType: "Top" | "Centre" | "Bottom",
            pt: Accessor<Vec2>,
        }[] = [
            {
                xType: "Left" as const,
                yType: "Top" as const,
                pt: createMemo(() =>
                    params.rect.pos()
                ),
            },
            {
                xType: "Centre" as const,
                yType: "Top" as const,
                pt: createMemo(() =>
                    Vec2.create(
                        params.rect.pos().x + 0.5 * params.rect.size().x,
                        params.rect.pos().y,
                    )
                ),
            },
            {
                xType: "Right" as const,
                yType: "Top" as const,
                pt: createMemo(() =>
                    Vec2.create(
                        params.rect.pos().x + params.rect.size().x,
                        params.rect.pos().y,
                    )
                ),
            },
            {
                xType: "Left" as const,
                yType: "Centre" as const,
                pt: createMemo(() =>
                    Vec2.create(
                        params.rect.pos().x,
                        params.rect.pos().y + 0.5 * params.rect.size().y,
                    )
                ),
            },
            {
                xType: "Right" as const,
                yType: "Centre" as const,
                pt: createMemo(() =>
                    Vec2.create(
                        params.rect.pos().x + params.rect.size().x,
                        params.rect.pos().y + 0.5 * params.rect.size().y,
                    )
                ),
            },
            {
                xType: "Left" as const,
                yType: "Bottom" as const,
                pt: createMemo(() =>
                    Vec2.create(
                        params.rect.pos().x,
                        params.rect.pos().y + params.rect.size().y,
                    )
                ),
            },
            {
                xType: "Centre" as const,
                yType: "Bottom" as const,
                pt: createMemo(() =>
                    Vec2.create(
                        params.rect.pos().x + 0.5 * params.rect.size().x,
                        params.rect.pos().y + params.rect.size().y,
                    )
                ),
            },
            {
                xType: "Right" as const,
                yType: "Bottom" as const,
                pt: createMemo(() =>
                    Vec2.create(
                        params.rect.pos().x + params.rect.size().x,
                        params.rect.pos().y + params.rect.size().y,
                    )
                ),
            },
        ];
        //
        let workingPt = createMemo(() => {
            let mousePos = params.modeParams.mousePos();
            if (mousePos == undefined) {
                return undefined;
            }
            return modeParams.screenPtToWorldPt(mousePos);
        });
        let anchorUnderMouse = createMemo(() => {
            let mousePos = params.modeParams.mousePos();
            if (mousePos == undefined) {
                return undefined;
            }
            let pt = workingPt();
            if (pt == undefined) {
                return undefined;
            }
            let closest: (typeof anchors)[0] | undefined;
            let closestDist: number | undefined = undefined;
            for (let anchor of anchors) {
                let pt2 = params.modeParams.worldPtToScreenPt(anchor.pt());
                if (pt2 == undefined) {
                    continue;
                }
                let dist = pt2.distanceSquared(mousePos);
                if (dist > SNAP_DIST_SQUARED) {
                    continue;
                }
                if (closestDist == undefined || dist < closestDist) {
                    closestDist = dist;
                    closest = anchor;
                }
            }
            return closest;
        });
        //
        this.overlaySvgUI = () => (
            <For each={anchors}>
                {(anchor) => {
                    let pt = createMemo(() =>
                        modeParams.worldPtToScreenPt(anchor.pt())
                    );
                    return (
                        <Show when={pt()}>
                            {(pt2) => (
                                <rect
                                    x={pt2().x - 0.5 * ANCHOR_SIZE}
                                    y={pt2().y - 0.5 * ANCHOR_SIZE}
                                    width={ANCHOR_SIZE}
                                    height={ANCHOR_SIZE}
                                    stroke="black"
                                    stroke-width="2"
                                    fill="none"
                                />
                            )}
                        </Show>
                    );
                }}
            </For>
        );
        this.dragStart = () => {};
        this.dragEnd = () => {};
    }
}
