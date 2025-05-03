import { EcsComponentType } from "../../ecs/EcsComponent";
import { vec2TypeSchema } from "../../TypeSchema";
import { Vec2 } from "../../Vec2";

export type NurbsState = {
    controlPoints: Vec2[];
    weights: number[];
    degree: number;
    closed: boolean;
};

export const nurbsComponentType = new EcsComponentType<NurbsState>({
    typeName: "Nurbs",
    typeSchema: {
        type: "Object",
        properties: {
            controlPoints: {
                type: "Array",
                element: vec2TypeSchema,
            },
            weights: {
                type: "Array",
                element: "Number",
            },
            degree: "Number",
            closed: "Boolean",
        },
    },
});
