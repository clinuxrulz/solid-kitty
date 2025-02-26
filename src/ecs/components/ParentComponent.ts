import { ok } from "../../kitty-demo/Result";
import { EcsComponentType } from "../EcsComponent";

export type ParentState = {
    parentId: string;
};

export const parentComponentType = new EcsComponentType<ParentState>({
    typeName: "Parent",
    toJson(value) {
        return {
            parentId: value.parentId,
        };
    },
    fromJson(x) {
        return ok({
            parentId: x.parentId,
        });
    },
});
