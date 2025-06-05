import { EcsComponentType, Vec2, vec2TypeSchema } from "../lib";

export type Velocity2DState = {
  velocity: Vec2;
};

export const velocity2DComponentType = new EcsComponentType<Velocity2DState>({
  typeName: "Velocity2D",
  typeSchema: {
    type: "Object",
    properties: {
      velocity: vec2TypeSchema,
    },
  },
});
