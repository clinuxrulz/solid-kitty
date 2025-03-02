import { Accessor } from "solid-js";
import { Vec2 } from "../../Vec2";
import { AsyncResult } from "../../AsyncResult";
import { TextureAtlasState } from "../components/TextureAtlasComponent";
import { FrameState } from "../components/FrameComponent";

export interface RenderParams {
    worldPtToScreenPt: (pt: Vec2) => Vec2 | undefined;
    textureAtlases: Accessor<AsyncResult<{
        textureAtlasFilename: string;
        textureAtlas: TextureAtlasState;
        image: HTMLImageElement;
        frames: FrameState[];
    }[]>>;
}
