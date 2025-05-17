import { EcsComponentType } from "../../ecs/EcsComponent";

export type LevelState = {
  tileToShortIdTable: {
    textureAtlasRef: string;
    frames: {
      frameId: string;
      shortId: number;
    }[];
  }[];
  /** 2D Array of short IDs */
  mapData: number[][];
};

export const levelComponentType: EcsComponentType<LevelState> =
  new EcsComponentType({
    typeName: "Level",
    typeSchema: {
      type: "Object",
      properties: {
        tileToShortIdTable: {
          type: "Array",
          element: {
            type: "Object",
            properties: {
              textureAtlasRef: "String",
              frames: {
                type: "Array",
                element: {
                  type: "Object",
                  properties: {
                    frameId: "String",
                    shortId: "Number",
                  },
                },
              },
            },
          },
        },
        mapData: {
          type: "Array",
          element: {
            type: "Array",
            element: "Number",
          },
        },
      },
    },
  });
