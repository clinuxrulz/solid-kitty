import { EcsRegistry } from "../../../ecs/EcsRegistry";
import { frameComponentType } from "./FrameComponent";

export const registry = new EcsRegistry([
    frameComponentType,
]);
