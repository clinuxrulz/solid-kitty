import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { Vec2 } from "../../../Vec2";
import { ModeParams } from "../ModeParams";

const ANCHOR_SIZE = 8.0;

export class ResizeHelper {
    overlaySvgUI: Component;

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
                                    stroke-width="1"
                                    fill="none"
                                />
                            )}
                        </Show>
                    );
                }}
            </For>
        );
    }
}
