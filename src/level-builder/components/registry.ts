import { EcsRegistry } from "../../ecs/EcsRegistry";
import { frameComponentType } from "./FrameComponent";
import { registry as baseRegistry } from "../../ecs/components/registry";
import { tilesetComponentType } from "./TilesetComponent";

export const registry = new EcsRegistry([
    ...baseRegistry.componentTypes,
    frameComponentType,
    tilesetComponentType,
]);
