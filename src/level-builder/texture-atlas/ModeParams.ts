import { Accessor } from "solid-js";
import { UndoManager } from "../../pixel-editor/UndoManager";
import { Vec2 } from "../../Vec2";
import { EcsWorld } from "../../ecs/EcsWorld";

export type ModeParams = {
    undoManager: UndoManager,
    mousePos: Accessor<Vec2 | undefined>,
    screenSize: Accessor<Vec2 | undefined>,
    screenPtToWorldPt(screenPt: Vec2): Vec2 | undefined,
    worldPtToScreenPt(worldPt: Vec2): Vec2 | undefined,
    world: Accessor<EcsWorld>,
};
