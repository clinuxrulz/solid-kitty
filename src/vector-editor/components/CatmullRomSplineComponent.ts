import { EcsComponentType } from "../../ecs/EcsComponent";
import { vec2TypeSchema } from "../../TypeSchema";
import { Vec2 } from "../../Vec2";

export type CatmullRomSplineState = {
    controlPoints: Vec2[];
    isClosed: boolean;
};

export const catmullRomSplineComponentType =
    new EcsComponentType<CatmullRomSplineState>({
        typeName: "CatmullRomSpline",
        typeSchema: {
            type: "Object",
            properties: {
                controlPoints: {
                    type: "Array",
                    element: vec2TypeSchema,
                },
                isClosed: "Boolean",
            },
        },
    });
