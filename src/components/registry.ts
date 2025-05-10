import { EcsRegistry } from "../ecs/EcsRegistry";
import { registry as baseRegistry } from "../ecs/components/registry";
import { levelRefComponentType } from "./LevelRefComponent";

export const registry = new EcsRegistry([
    ...baseRegistry.componentTypes,
    levelRefComponentType,
]);
