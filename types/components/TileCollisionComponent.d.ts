import { EcsComponentType } from '../ecs/EcsComponent';
export type TileCollisionState = {
    textureAtlasFilename: string;
    frameName: string;
    width: number;
    height: number;
};
export declare const tileCollisionComponentType: EcsComponentType<TileCollisionState>;
