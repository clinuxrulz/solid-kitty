import { EcsComponentType } from "../lib";

export type CameraState = {
  targetEntity: string | undefined;
};

export const cameraComponentType = new EcsComponentType<CameraState>({
  typeName: "Camera",
  typeSchema: {
    type: "Object",
    properties: {
      targetEntity: {
        type: "MaybeUndefined",
        element: "String",
      },
    },
  },
});
