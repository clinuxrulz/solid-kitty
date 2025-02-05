import { Accessor } from "solid-js";
import { UndoManager } from "../../pixel-editor/UndoManager";
import { Vec2 } from "../../Vec2";

export type ModeParams = {
    undoManager: UndoManager,
    mousePos: Accessor<Vec2 | undefined>,
    screenPtToWorldPt(screenPt: Vec2): Vec2 | undefined,
    worldPtToScreenPt(worldPt: Vec2): Vec2 | undefined,
};
