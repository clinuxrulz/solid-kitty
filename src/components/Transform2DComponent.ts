import { EcsComponentType } from "../ecs/EcsComponent";
import { Complex } from "../math/Complex";
import { Transform2D } from "../math/Transform2D";
import { Vec2 } from "../math/Vec2";
import {
  makeInvariantTypeSchema,
  TypeSchema,
  vec2TypeSchema,
} from "../TypeSchema";

export type Transform2DState = {
  transform: Transform2D;
};

let complexTypeSchema: TypeSchema<Complex> = makeInvariantTypeSchema(
  (a: { x: number; y: number }) => new Complex(a.x, a.y),
  (a: Complex) => ({ x: a.x, y: a.y }),
  {
    type: "Object",
    properties: {
      x: "Number",
      y: "Number",
    },
  },
);

export const transform2DComponentType = new EcsComponentType<Transform2DState>({
  typeName: "Transform2D",
  typeSchema: {
    type: "Object",
    properties: {
      transform: makeInvariantTypeSchema(
        (a: { origin: Vec2; orientation: Complex }) =>
          Transform2D.create(a.origin, a.orientation),
        (a: Transform2D) => ({ origin: a.origin, orientation: a.orientation }),
        {
          type: "Object",
          properties: {
            origin: vec2TypeSchema,
            orientation: complexTypeSchema,
          },
        },
      ),
    },
  },
});
