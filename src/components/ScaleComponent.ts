import { EcsComponentType } from "../ecs/EcsComponent";

export type ScaleState = {
  scale: number;
};

export const scaleComponentType = new EcsComponentType<ScaleState>({
  typeName: "Scale",
  typeSchema: {
    type: "Object",
    properties: {
      scale: "Number",
    },
  },
});
