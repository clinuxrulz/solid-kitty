import { EcsComponentType } from "../EcsComponent";

export type ParentState = {
  parentId: string;
};

export const parentComponentType = new EcsComponentType<ParentState>({
  typeName: "Parent",
  typeSchema: {
    type: "Object",
    properties: {
      parentId: "String",
    },
  },
});
