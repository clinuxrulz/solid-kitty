import { Accessor, Component, createMemo, For, Index, Show } from "solid-js";
import { EcsWorld } from "../../../ecs/EcsWorld";
import { RenderParams } from "../RenderParams";
import { levelComponentType, LevelState } from "../../components/LevelComponent";
import { FrameState } from "../../components/FrameComponent";

export class RenderSystem {
    readonly Render: Component;
    readonly RenderOverlay: Component;

    constructor(params: {
        renderParams: RenderParams;
        world: Accessor<EcsWorld>;
        highlightedEntitiesSet: Accessor<Set<string>>;
        selectedEntitiesSet: Accessor<Set<string>>;
    }) {
        let tileWidth = params.renderParams.tileWidth;
        let tileHeight = params.renderParams.tileHeight;
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
        createMemo(() => {
            let textureAtlases = params.renderParams.textureAtlases();
            if (textureAtlases.type != "Success") {
                return undefined;
            }
            let result = new Map<string,Map<string,{
                image: HTMLImageElement,
                frame: FrameState,
            }>>();
            for (let x of textureAtlases.value) {
                let textureAtlasRef = x.textureAtlasFilename;
                let image = x.image;
                for (let frame of x.frames) {
                    let tmp = result.get(textureAtlasRef);
                    if (tmp == undefined) {
                        tmp = new Map<string,{
                            image: HTMLImageElement,
                            frame: FrameState,
                        }>();
                        result.set(textureAtlasRef, tmp);
                    }
                    tmp.set(frame.name, {
                        image,
                        frame,
                    });
                }
            }
            return result;
        });
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
