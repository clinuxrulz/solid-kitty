import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { EcsWorld } from "../../../ecs/EcsWorld";
import { frameComponentType, FrameState } from "../components/FrameComponent";

export class RenderSystem {
    readonly Render: Component;

    constructor(params: {
        world: Accessor<EcsWorld>,
    }) {
        let frameEntityIds = createMemo(() =>
            params.world().entitiesWithComponentType(
                frameComponentType,
            )
        );
        this.Render = () => {
            return (
                <For each={frameEntityIds()}>
                    {(entityId) => {
                        let frameState = createMemo<FrameState | undefined>(() =>
                            params.world().getComponent(entityId, frameComponentType)?.state
                        );
                        return (
                            <Show when={frameState()}>
                                {(frameState2) => (
                                    <rect
                                        x={frameState2().pos.x}
                                        y={frameState2().pos.y}
                                        width={frameState2().size.x}
                                        height={frameState2().size.y}
                                        stroke="black"
                                        stroke-width="2"
                                        fill="none"
                                        pointer-events="none"
                                    />
                                )}
                            </Show>
                        );
                    }}
                </For>
            );
        };
    }
}
