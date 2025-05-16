import { EcsComponentType } from '../ecs/EcsComponent';
import { Transform2D } from '../math/Transform2D';
export type Transform2DState = {
    transform: Transform2D;
};
export declare const transform2DComponentType: EcsComponentType<Transform2DState>;
