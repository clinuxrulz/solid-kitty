import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { EcsWorld } from "../../../ecs/EcsWorld";
import {
    frameComponentType,
    FrameState,
} from "../../components/FrameComponent";
import { Vec2 } from "../../../Vec2";
import { RenderParams } from "../RenderParams";

export class RenderSystem {
    readonly Render: Component;
    readonly RenderOverlay: Component;

    constructor(params: {
        renderParams: RenderParams;
        world: Accessor<EcsWorld>;
        highlightedEntitiesSet: Accessor<Set<string>>;
        selectedEntitiesSet: Accessor<Set<string>>;
    }) {
        this.Render = () => undefined;
        this.RenderOverlay = () => undefined;
    }
}
