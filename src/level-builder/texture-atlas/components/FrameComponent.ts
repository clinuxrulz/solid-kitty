import { EcsComponentType } from "../../../ecs/EcsComponent";
import { Vec2 } from "../../../Vec2";

export type FrameState = {
    name: string,
    pos: Vec2,
    size: Vec2,
};

export const frameComponentType = new EcsComponentType<FrameState>({
    typeName: "FrameState",
});
