import { EcsRegistry } from "../ecs/EcsRegistry";
import { registry as baseRegistry } from "../ecs/components/registry";
import { animatedComponentType } from "./AnimatedComponent";
import { levelRefComponentType } from "./LevelRefComponent";
import { scaleComponentType } from "./ScaleComponent";
import { spriteComponentType } from "./SpriteComponent";
import { tileCollisionComponentType } from "./TileCollisionComponent";
import { transform2DComponentType } from "./Transform2DComponent";
import { velocity2DComponentType } from "./Velocity2DComponent";

export const registry = new EcsRegistry([
  ...baseRegistry.componentTypes,
  animatedComponentType,
  levelRefComponentType,
  scaleComponentType,
  spriteComponentType,
  tileCollisionComponentType,
  transform2DComponentType,
  velocity2DComponentType,
]);
