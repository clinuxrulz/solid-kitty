import { EcsComponentType } from "../../ecs/EcsComponent";
import { Vec2 } from "../../Vec2";

type CatmullRomSplineState = {
    controlPoints: Vec2[],
    isClosed: boolean,
};

export const catmullRomSplineComponentType = new EcsComponentType<CatmullRomSplineState>({
    typeName: "CatmullRomSpline",
});
