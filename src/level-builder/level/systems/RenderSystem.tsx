import { Accessor, Component, createMemo, For, Index, Show } from "solid-js";
import { EcsWorld } from "../../../ecs/EcsWorld";
import { RenderParams } from "../RenderParams";
import { levelComponentType, LevelState } from "../../components/LevelComponent";

export class RenderSystem {
    readonly Render: Component;
    readonly RenderOverlay: Component;

    constructor(params: {
        renderParams: RenderParams;
        world: Accessor<EcsWorld>;
        highlightedEntitiesSet: Accessor<Set<string>>;
        selectedEntitiesSet: Accessor<Set<string>>;
    }) {
        let tileWidth = () => 50;
        let tileHeight = () => 50;
        let level: Accessor<LevelState | undefined>;
        {
            let levelEntities = createMemo(() => params.world().entitiesWithComponentType(levelComponentType));
            level = createMemo(() => {
                let levelEntities2 = levelEntities();
                if (levelEntities2.length != 1) {
                    return undefined;
                }
                let levelEntity = levelEntities2[0];
                return params.world().getComponent(levelEntity, levelComponentType)?.state;
            });
        }
        //
        this.Render = () => (
            <Show when={level()}>
                {(level2) => (
                    <Index each={level2().mapData}>
                        {(row, i) => {
                            let posY = i * tileHeight();
                            return (
                                <Index each={row()}>
                                    {(cell, j) => {
                                        let posX = j * tileWidth();
                                        return (
                                            <>
                                                <rect
                                                    x={posX}
                                                    y={posY}
                                                    width={tileWidth()}
                                                    height={tileHeight()}
                                                    stroke="black"
                                                    stroke-width={2}
                                                    fill="none"
                                                />
                                                <text
                                                    x={posX + 0.5 * tileWidth()}
                                                    y={posY + 0.5 * tileHeight()}
                                                    text-anchor="middle"
                                                    dominant-baseline="middle"
                                                >
                                                    {cell()}
                                                </text>
                                            </>
                                        );
                                    }}
                                </Index>
                            );
                        }}
                    </Index>
                )}
            </Show>
        );
        this.RenderOverlay = () => undefined;
    }
}
