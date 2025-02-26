import { ok } from "../../kitty-demo/Result";
import { EcsComponentType } from "../EcsComponent";

export type ChildrenState = {
    childIds: string[];
};

export const childrenComponentType = new EcsComponentType<ChildrenState>({
    typeName: "Children",
    toJson(value) {
        return {
            childIds: value.childIds,
        };
    },
    fromJson(x) {
        return ok({
            childIds: x.childIds,
        });
    },
});
