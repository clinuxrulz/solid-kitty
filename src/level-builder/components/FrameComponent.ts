import { EcsComponentType } from "../../ecs/EcsComponent";
import { ok } from "../../kitty-demo/Result";
import { Vec2 } from "../../Vec2";

export type FrameState = {
    name: string;
    pos: Vec2;
    size: Vec2;
};

export const frameComponentType = new EcsComponentType<FrameState>({
    typeName: "FrameState",
    toJson(value) {
        let pos = value.pos;
        let size = value.size;
        return {
            name: value.name,
            pos: { x: pos.x, y: pos.y },
            size: { x: size.x, y: size.y },
        };
    },
    fromJson(x) {
        let pos = x.pos;
        let size = x.size;
        return ok({
            name: x.name,
            pos: Vec2.create(pos.x, pos.y),
            size: Vec2.create(size.x, size.y),
        });
    },
});
