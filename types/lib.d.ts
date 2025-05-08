import { Accessor } from 'solid-js';
import { EcsWorld, EcsRegistry } from './lib';
import { AutomergeVfsFolder, AutomergeVirtualFileSystem } from 'solid-fs-automerge';
import { AsyncResult } from 'control-flow-as-value';
import { TextureAtlasState } from './level-builder/components/TextureAtlasComponent';
import { FrameState } from './level-builder/components/FrameComponent';
import { EcsComponentType } from './ecs/EcsComponent';
export * from './ecs/EcsComponent';
export * from './ecs/EcsRegistry';
export * from './ecs/EcsWorld';
export * from './TypeSchema';
export { PixiRenderSystem, } from './systems/PixiRenderSystem';
export * from 'solid-js';
export declare const REQUIRED_FOR_KEEPING_MANUAL_CHUNKS: () => undefined;
export declare function launch(): void;
export declare const createAutomergeVfs: () => Accessor<{
    type: "Pending";
} | {
    type: "Failed";
    message: string;
} | {
    type: "Success";
    value: AutomergeVirtualFileSystem;
}>;
export declare const libUrl: string;
export declare const world: EcsWorld;
export type LevelRefState = {
    levelFilename: string;
};
export declare const levelRefComponentType: EcsComponentType<LevelRefState>;
export declare const registry: EcsRegistry;
export declare function fixRelativeUrl(relativeUrl: string): string;
export declare const createGetRootFolder: () => Accessor<AsyncResult<AutomergeVfsFolder>>;
export declare const createGetLevelsFolder: () => Accessor<AsyncResult<AutomergeVfsFolder>>;
export declare const createTextureAtlasWithImageAndFramesList: () => Accessor<AsyncResult<{
    textureAtlasFilename: Accessor<string>;
    textureAtlas: TextureAtlasState;
    image: HTMLImageElement;
    frames: {
        frameId: string;
        frame: FrameState;
    }[];
}[]>>;
