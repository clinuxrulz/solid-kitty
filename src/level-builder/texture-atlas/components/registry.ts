import { EcsRegistry } from "../../../ecs/EcsRegistry";
import { blockComponentType } from "./BlockComponent";

export const registry = new EcsRegistry([
    blockComponentType,
]);
