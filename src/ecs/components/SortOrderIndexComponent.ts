import { ok } from "../../kitty-demo/Result";
import { EcsComponentType } from "../EcsComponent";

export type SortOrderIndexState = {
    orderIndex: number;
};

export const sortOrderIndexComponentType =
    new EcsComponentType<SortOrderIndexState>({
        typeName: "SortOrderIndex",
        typeSchema: {
            type: "Object",
            properties: {
                orderIndex: "Number",
            },
        },
    });
