import { EcsComponentType } from "../../ecs/EcsComponent";
import {
  makeInvariantTypeSchema,
  TypeSchema,
  vec2TypeSchema,
} from "../../TypeSchema";
import { Vec2 } from "../../math/Vec2";

export type FrameState = {
  name: string;
  pos: Vec2;
  size: Vec2;
  numCells: Vec2;
  /** metaData is a json value */
  metaData: any;
};

const jsonTypeSchema: TypeSchema<any> = makeInvariantTypeSchema<any, string>(
  (a: string) => JSON.parse(a),
  (a: any) => JSON.stringify(a),
  "String",
);

export const frameComponentType = new EcsComponentType<FrameState>({
  typeName: "FrameState",
  typeSchema: {
    type: "Object",
    properties: {
      name: "String",
      pos: vec2TypeSchema,
      size: vec2TypeSchema,
      numCells: {
        type: "WithDefault",
        typeSchema: vec2TypeSchema,
        default_: Vec2.create(1, 1),
      } as any as TypeSchema<Vec2>,
      metaData: {
        type: "WithDefault",
        typeSchema: jsonTypeSchema,
        default_: null,
      } as any as TypeSchema<any>,
    },
  },
});
