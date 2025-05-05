import { registry as baseRegistry } from "./ecs/components/registry";
import { EcsWorld } from "./lib";
import { EcsRegistry } from "./lib";

export * from "./ecs/EcsComponent";
export * from "./ecs/EcsRegistry";
export * from "./ecs/EcsWorld";
export * from "./TypeSchema";
export { PixiRenderSystem, } from "./systems/PixiRenderSystem";
export * from "solid-js";

export const REQUIRED_FOR_KEEPING_MANUAL_CHUNKS = () => undefined;

export function launch() {
    import("./index");
}

export const libUrl = import.meta.url;

export const world = new EcsWorld();

export const registry = new EcsRegistry([
    ...baseRegistry.componentTypes,
]);

export function fixRelativeUrl(relativeUrl: string): string {
    const libUrl_ = import.meta.url;
    if (true) {
        return "http://localhost:3000/" + relativeUrl;
    }
    let libBaseUrl = libUrl_.slice(0, libUrl_.lastIndexOf("/") + 1);
    return libBaseUrl + relativeUrl;
}
