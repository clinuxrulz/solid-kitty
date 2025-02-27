import { EcsComponentType } from "../../ecs/EcsComponent";
import { Vec2 } from "../../Vec2";

export type NurbsState = {
    controlPoints: Vec2[];
    weights: number[];
    degree: number;
    closed: boolean;
};

export const nurbsComponentType = new EcsComponentType<NurbsState>({
    typeName: "Nurbs",
    toJson(value) {
        return {
            ...value,
            controlPoints: value.controlPoints.map((x) => ({ x: x.x, y: x.y })),
        };
    },
    fromJson(x) {
        return {
            ...x,
            controlPoints: x.controlPoints.map((x2: any) =>
                Vec2.create(x2.x, x2.y),
            ),
        };
    },
});
