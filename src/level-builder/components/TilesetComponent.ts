import { EcsComponentType } from "../../ecs/EcsComponent";

export type TilesetState = {
    imageBase64Data: string;
    imageMimeType: string;
};

export const tilesetComponentType = new EcsComponentType<TilesetState>({
    typeName: "Tileset",
    typeSchema: {
        type: "Object",
        properties: {
            imageBase64Data: "String",
            imageMimeType: "String",
        }
    },
});
