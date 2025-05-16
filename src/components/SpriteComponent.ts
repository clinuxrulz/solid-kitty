import { EcsComponentType } from "../ecs/EcsComponent";

export type SpriteState = {
    textureAtlasFilename: string,
    frameName: string,
};

export const spriteComponentType = new EcsComponentType<SpriteState>({
    typeName: "Sprite",
    typeSchema: {
        type: "Object",
        properties: {
            textureAtlasFilename: "String",
            frameName: "String",
        },
    },
});

