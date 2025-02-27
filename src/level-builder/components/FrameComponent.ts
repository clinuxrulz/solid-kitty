import { EcsComponentType } from "../../ecs/EcsComponent";
import { vec2TypeSchema } from "../../TypeSchema";
import { Vec2 } from "../../Vec2";

export type FrameState = {
    name: string;
    pos: Vec2;
    size: Vec2;
};

export const frameComponentType = new EcsComponentType<FrameState>({
    typeName: "FrameState",
    typeSchema: {
        type: "Object",
        properties: {
            name: "String",
            pos: vec2TypeSchema,
            size: vec2TypeSchema,
        },
    },
});
