import { Accessor } from "solid-js";
import { UndoManager } from "../../pixel-editor/UndoManager";
import { Vec2 } from "../../Vec2";
import { EcsWorld } from "../../ecs/EcsWorld";
import { PickingSystem } from "./systems/PickingSystem";
import { Mode } from "./Mode";

export type ModeParams = {
    undoManager: UndoManager;
    mousePos: Accessor<Vec2 | undefined>;
    screenSize: Accessor<Vec2 | undefined>;
    screenPtToWorldPt(screenPt: Vec2): Vec2 | undefined;
    worldPtToScreenPt(worldPt: Vec2): Vec2 | undefined;
    world: Accessor<EcsWorld>;
    pickingSystem: PickingSystem;
    onDone: () => void;
    setMode: (mkMode: () => Mode) => void;
};
