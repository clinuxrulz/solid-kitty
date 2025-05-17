import { EcsComponentType } from "../ecs/EcsComponent";

export type AnimatedState = {
  animationName: string;
  frameIndex: number;
};

export const animatedComponentType = new EcsComponentType<AnimatedState>({
  typeName: "Animated",
  typeSchema: {
    type: "Object",
    properties: {
      animationName: "String",
      frameIndex: "Number",
    },
  },
});
