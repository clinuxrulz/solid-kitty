import { ok } from "../../kitty-demo/Result";
import { EcsComponentType } from "../EcsComponent";

export type SortOrderIndexState = {
    orderIndex: number;
};

export const sortOrderIndexComponentType =
    new EcsComponentType<SortOrderIndexState>({
        typeName: "SortOrderIndex",
        toJson(value) {
            return { orderIndex: value };
        },
        fromJson(x) {
            return ok({ orderIndex: x.orderIndex });
        },
    });
