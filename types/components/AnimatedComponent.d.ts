import { EcsComponentType } from '../ecs/EcsComponent';
export type AnimatedState = {
    animationName: string;
    frameIndex: number;
};
export declare const animatedComponentType: EcsComponentType<AnimatedState>;
