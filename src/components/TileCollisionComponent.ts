import { EcsComponentType } from "../ecs/EcsComponent";

export type TileCollisionState = {
    textureAtlasFilename: string,
    frameName: string,
    width: number,
    height: number,
};

export const tileCollisionComponentType = new EcsComponentType<TileCollisionState>({
    typeName: "TileCollision",
    typeSchema: {
        type: "Object",
        properties: {
            textureAtlasFilename: "String",
            frameName: "String",
            width: "Number",
            height: "Number",
        },
    },
});
