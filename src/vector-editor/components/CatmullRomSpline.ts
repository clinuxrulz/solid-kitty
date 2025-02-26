import { EcsComponentType } from "../../ecs/EcsComponent";
import { ok } from "../../kitty-demo/Result";
import { Vec2 } from "../../Vec2";

export type CatmullRomSplineState = {
    controlPoints: Vec2[];
    isClosed: boolean;
};

export const catmullRomSplineComponentType =
    new EcsComponentType<CatmullRomSplineState>({
        typeName: "CatmullRomSpline",
        toJson(value) {
            return {
                controlPoints: value.controlPoints.map((x) => ({
                    x: x.x,
                    y: x.y,
                })),
                isClosed: value.isClosed,
            };
        },
        fromJson(x) {
            return ok({
                controlPoints: (x.controlPoints as any[]).map((x2: any) =>
                    Vec2.create(x2.x, x2.y),
                ),
                isClosed: x.isClosed as boolean,
            });
        },
    });
