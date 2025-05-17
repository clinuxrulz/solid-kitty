import { EcsComponentType } from "../../ecs/EcsComponent";

export type TextureAtlasState = {
  imageRef: string; // path to image in vfs
  // frames are stored via children of entity
};

export const textureAtlasComponentType =
  new EcsComponentType<TextureAtlasState>({
    typeName: "TextureAtlas",
    typeSchema: {
      type: "Object",
      properties: {
        imageRef: "String",
      },
    },
  });
