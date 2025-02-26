import { EcsComponentType } from "../../ecs/EcsComponent";
import { ok } from "../../kitty-demo/Result";

export type TilesetState = {
    imageBase64Data: string;
    imageMimeType: string;
};

export const tilesetComponentType = new EcsComponentType<TilesetState>({
    typeName: "Tileset",
    toJson(value) {
        return {
            imageBase64Data: value.imageBase64Data,
            imageMimeType: value.imageMimeType,
        };
    },
    fromJson(x) {
        return ok({
            imageBase64Data: x.imageBase64Data,
            imageMimeType: x.imageMimeType,
        });
    },
});
