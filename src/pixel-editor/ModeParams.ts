import { Accessor } from "solid-js";
import { Colour } from "./Colour";
import { Vec2 } from "../Vec2";

export type ModeParams = {
    snapDist: Accessor<number>,
    snapDistSquared: Accessor<number>,
    mousePos: Accessor<Vec2 | undefined>,
    screenPtToWorldPt(screenPt: Vec2): Vec2 | undefined,
    worldPtToScreenPt(worldPt: Vec2): Vec2 | undefined,
    writePixel(pt: Vec2, colour: Colour): void,
};
