import { Accessor, createMemo } from "solid-js";
import { Vec2 } from "../../../Vec2";

export class ResizeHelper {
    constructor(params: {
        rect: {
            pos: Accessor<Vec2>,
            size: Accessor<Vec2>,
        },
        onStartResize: (
            xType: "Left" | "Centre" | "Right",
            yType: "Top" | "Centre" | "Bottom",
            pickupPt: Vec2,
        ) => void,
    }) {
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
    }
}
