import { EcsRegistry } from "../EcsRegistry";
import { childrenComponentType } from "./ChildrenComponent";
import { parentComponentType } from "./ParentComponent";

export const registry = new EcsRegistry([
    childrenComponentType,
    parentComponentType,
]);
