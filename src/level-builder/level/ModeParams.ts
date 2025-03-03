import { Accessor } from "solid-js";
import { UndoManager } from "../../pixel-editor/UndoManager";
import { Vec2 } from "../../Vec2";
import { EcsWorld } from "../../ecs/EcsWorld";
import { PickingSystem } from "./systems/PickingSystem";
import { Mode } from "./Mode";
import { AsyncResult } from "../../AsyncResult";
import { TextureAtlasState } from "../components/TextureAtlasComponent";
import { FrameState } from "../components/FrameComponent";
import { LevelState } from "../components/LevelComponent";

export type ModeParams = {
    undoManager: UndoManager;
    mousePos: Accessor<Vec2 | undefined>;
    screenSize: Accessor<Vec2 | undefined>;
    screenPtToWorldPt(screenPt: Vec2): Vec2 | undefined;
    worldPtToScreenPt(worldPt: Vec2): Vec2 | undefined;
    world: Accessor<EcsWorld>;
    tileWidth: Accessor<number>;
    tileHeight: Accessor<number>;
    level: Accessor<LevelState | undefined>;
    writeTile: (params: {
        xIdx: number, yIdx: number, textureAtlasRef: string, frameRef: string,
    }) => void;
    pickingSystem: PickingSystem;
    textureAtlases: Accessor<AsyncResult<{
        textureAtlasFilename: string;
        textureAtlas: TextureAtlasState;
        image: HTMLImageElement;
        frames: FrameState[];
    }[]>>;
    onDone: () => void;
    setMode: (mkMode: () => Mode) => void;
};
