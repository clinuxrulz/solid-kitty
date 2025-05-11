import { EcsRegistry } from "../ecs/EcsRegistry";
import { registry as baseRegistry } from "../ecs/components/registry";
import { animatedComponentType } from "./AnimatedComponent";
import { levelRefComponentType } from "./LevelRefComponent";
import { spriteComponentType } from "./SpriteComponent";
import { transform2DComponentType } from "./Transform2DComponent";

export const registry = new EcsRegistry([
    ...baseRegistry.componentTypes,
    animatedComponentType,
    levelRefComponentType,
    spriteComponentType,
    transform2DComponentType,
]);
