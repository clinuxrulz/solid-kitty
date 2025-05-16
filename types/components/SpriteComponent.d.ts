import { EcsComponentType } from '../ecs/EcsComponent';
export type SpriteState = {
    textureAtlasFilename: string;
    frameName: string;
};
export declare const spriteComponentType: EcsComponentType<SpriteState>;
