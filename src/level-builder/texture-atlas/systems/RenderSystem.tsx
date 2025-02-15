import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { EcsWorld } from "../../../ecs/EcsWorld";
import { frameComponentType, FrameState } from "../components/FrameComponent";
import { Vec2 } from "../../../Vec2";
import { RenderParams } from "../RenderParams";

export class RenderSystem {
    readonly Render: Component;
    readonly RenderOverlay: Component;

    constructor(params: {
        renderParams: RenderParams,
        world: Accessor<EcsWorld>,
    }) {
        let frameEntityIds = createMemo(() =>
            params.world().entitiesWithComponentType(
                frameComponentType,
            )
        );
        this.Render = () => undefined;
        this.RenderOverlay = () => {
            return (
                <For each={frameEntityIds()}>
                    {(entityId) => {
                        let frameState = createMemo<FrameState | undefined>(() =>
                            params.world().getComponent(entityId, frameComponentType)?.state
                        );
                        return (
                            <Show when={frameState()}>{
                                (frameState2) =>
                                    <RenderFrame
                                        renderParams={params.renderParams}
                                        state={frameState2()}
                                    />
                            }</Show>
                        );
                    }}
                </For>
            );
        };
    }
}

const RenderFrame: Component<{
    renderParams: RenderParams,
    state: FrameState,
}> = (props) => {
    let screenRect = createMemo<{
        pos: Vec2,
        size: Vec2,
    } | undefined>(() => {
        let pt1 = props.renderParams.worldPtToScreenPt(props.state.pos);
        if (pt1 == undefined) {
            return undefined;
        }
        let pt2 = props.renderParams.worldPtToScreenPt(props.state.pos.clone().add(props.state.size));
        if (pt2 == undefined) {
            return undefined;
        }
        let minX = Math.min(pt1.x, pt2.x);
        let minY = Math.min(pt1.y, pt2.y);
        let maxX = Math.max(pt1.x, pt2.x);
        let maxY = Math.max(pt1.y, pt2.y);
        return {
            pos: Vec2.create(
                minX,
                minY,
            ),
            size: Vec2.create(
                maxX - minX,
                maxY - minY,
            ),
        };
    });
    return (
        <Show when={screenRect()}>
            {(screenRect2) => (
                <rect
                    x={screenRect2().pos.x}
                    y={screenRect2().pos.y}
                    width={screenRect2().size.x}
                    height={screenRect2().size.y}
                    stroke="black"
                    stroke-width="2"
                    fill="none"
                    pointer-events="none"
                />
            )}
        </Show>
    );
};
