import { EcsComponentType } from "../../../ecs/EcsComponent";
import { Vec2 } from "../../../Vec2";

export type BlockState = {
    name: string,
    pos: Vec2,
    size: Vec2,
};

export const blockComponentType = new EcsComponentType<BlockState>({
    typeName: "BlockState",
});
