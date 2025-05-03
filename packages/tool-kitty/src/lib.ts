export * from "./ecs/EcsComponent";
export * from "./ecs/EcsRegistry";
export * from "./ecs/EcsWorld";
export * from "./TypeSchema";

export const REQUIRED_FOR_KEEPING_MANUAL_CHUNKS = () => undefined;

export function launch() {
    let libUrl = import.meta.url;
    (window as any)["tool_kitty_url"] = libUrl;
    import("./index");
}

