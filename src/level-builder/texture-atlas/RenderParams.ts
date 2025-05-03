import { Vec2 } from "../../Vec2";

export interface RenderParams {
    worldPtToScreenPt: (pt: Vec2) => Vec2 | undefined;
}
