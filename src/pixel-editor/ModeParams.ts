import { Accessor } from "solid-js";
import { Colour } from "./Colour";
import { Vec2 } from "../Vec2";
import { UndoManager } from "./UndoManager";

export type ModeParams = {
    undoManager: UndoManager,
    snapDist: Accessor<number>,
    snapDistSquared: Accessor<number>,
    mousePos: Accessor<Vec2 | undefined>,
    screenPtToWorldPt(screenPt: Vec2): Vec2 | undefined,
    worldPtToScreenPt(worldPt: Vec2): Vec2 | undefined,
    currentColour: Accessor<Colour>,
    readPixel(pt: Vec2): Colour | undefined,
    writePixel(pt: Vec2, colour: Colour): void,
};
