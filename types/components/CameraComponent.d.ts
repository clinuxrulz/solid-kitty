import { EcsComponentType } from '../lib';
export type CameraState = {
    targetEntity: string | undefined;
};
export declare const cameraComponentType: EcsComponentType<CameraState>;
