import { Accessor } from 'solid-js';
import { EcsWorld } from './lib';
import { AutomergeVfsFolder, AutomergeVirtualFileSystem } from 'solid-fs-automerge';
import { AsyncResult } from 'control-flow-as-value';
import { TextureAtlasState } from './level-builder/components/TextureAtlasComponent';
import { FrameState } from './level-builder/components/FrameComponent';
export * from './ecs/EcsComponent';
export * from './ecs/EcsRegistry';
export * from './ecs/EcsWorld';
export * from './TypeSchema';
export { PixiRenderSystem, } from './systems/PixiRenderSystem';
export * from 'solid-js';
declare let systems: {
    PixiRenderSystem: (params: {
        world: EcsWorld;
    }) => void;
};
export type SystemName = keyof (typeof systems);
export declare function useSystem(systemName: SystemName): () => void;
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
export { type AnimatedState, animatedComponentType } from './components/AnimatedComponent';
export { type LevelRefState, levelRefComponentType } from './components/LevelRefComponent';
export { type SpriteState, spriteComponentType } from './components/SpriteComponent';
export { type Transform2DState, transform2DComponentType } from './components/Transform2DComponent';
export { registry } from './components/registry';
export { Complex } from './math/Complex';
export { Transform2D } from './math/Transform2D';
export { Vec2 } from './math/Vec2';
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
