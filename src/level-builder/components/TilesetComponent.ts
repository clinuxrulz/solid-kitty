import { EcsComponentType } from "../../ecs/EcsComponent";

export type TilesetState = {
    imageRef: string; // path to image in vfs
    // frames are stored via children of entity
};

export const tilesetComponentType = new EcsComponentType<TilesetState>({
    typeName: "Tileset",
    typeSchema: {
        type: "Object",
        properties: {
            imageRef: "String",
        },
    },
});
