import { EcsRegistry } from "../../ecs/EcsRegistry";
import { frameComponentType } from "./FrameComponent";
import { registry as baseRegistry } from "../../ecs/components/registry";
import { textureAtlasComponentType } from "./TextureAtlasComponent";
import { levelComponentType } from "./LevelComponent";

export const registry = new EcsRegistry([
    ...baseRegistry.componentTypes,
    frameComponentType,
    levelComponentType,
    textureAtlasComponentType,
]);
