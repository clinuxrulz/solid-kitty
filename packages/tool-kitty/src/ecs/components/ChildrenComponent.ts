import { ok } from "../../kitty-demo/Result";
import { EcsComponentType } from "../EcsComponent";

export type ChildrenState = {
    childIds: string[];
};

export const childrenComponentType = new EcsComponentType<ChildrenState>({
    typeName: "Children",
    typeSchema: {
        type: "Object",
        properties: {
            childIds: {
                type: "Array",
                element: "String",
            },
        },
    },
});
