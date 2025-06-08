import { EcsComponentType } from '../ecs/EcsComponent';
export type TileCollisionState = {
    textureAtlasFilename: string;
    frameName: string;
    width: number;
    height: number;
    /** metaData is a json value */
    metaData: any;
};
export declare const tileCollisionComponentType: EcsComponentType<TileCollisionState>;
