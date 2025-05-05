import { Application, Assets, Container, ContainerChild, Renderer, Sprite, Spritesheet, Texture, TextureStyle } from "pixi.js";
import { Accessor, batch, createComputed, createMemo, createResource, mapArray, on, onCleanup, Resource } from "solid-js";
import { Level, level1 } from "../kitty-demo/Level";
import { tilesetAtlasData } from "../kitty-demo/tileset";
import { EcsWorld } from "../ecs/EcsWorld";
import { levelComponentType } from "../level-builder/components/LevelComponent";
import { createStore } from "solid-js/store";
import { smSpriteAtlasData } from "../kitty-demo/SmSprites";
import { mmSpriteAtlasData } from "../kitty-demo/MmSprites";
import { atlasData } from "../kitty-demo/KittySprites";
import { Text } from "pixi.js";

TextureStyle.defaultOptions.scaleMode = "nearest";

await Promise.all([
    Assets.load(tilesetAtlasData.meta.image),
    //Assets.load(atlasData.meta.image),
    //Assets.load(smSpriteAtlasData.meta.image),
    //Assets.load(mmSpriteAtlasData.meta.image),
]);

/*
// Create the SpriteSheet from data and image
const spritesheet = new Spritesheet(
    Texture.from(atlasData.meta.image),
    atlasData,
);

// Generate all the Textures asynchronously
await spritesheet.parse();

const smSpritesheet = new Spritesheet(
    Texture.from(smSpriteAtlasData.meta.image),
    smSpriteAtlasData,
);

await smSpritesheet.parse();

const mmSpritesheet = new Spritesheet(
    Texture.from(mmSpriteAtlasData.meta.image),
    mmSpriteAtlasData,
);

await mmSpritesheet.parse();
*/

const tileset = new Spritesheet(
    Texture.from(tilesetAtlasData.meta.image),
    tilesetAtlasData,
);

await tileset.parse();

export class PixiRenderSystem {
    pixiApp: Accessor<Application<Renderer> | undefined>;

    constructor(params: {
        world: EcsWorld,
    }) {
        
        let [ state, setState, ] = createStore<{
            windowWidth: number,
            windowHeight: number,
        }>({
            windowWidth: window.screen.width,
            windowHeight: window.screen.height,
        });
        let onResize = () => {
            batch(() => {
                setState("windowWidth", window.screen.width);
                setState("windowHeight", window.screen.height);
            });
        };
        window.addEventListener("resize", onResize);
        onCleanup(() => {
            window.removeEventListener("resize", onResize);
        });
        let world = params.world;
        let pixiApp: Resource<Application<Renderer>>;
        {
            const app = new Application();
            [ pixiApp, ] = createResource(async () => {
                await app.init({ background: "#00f8f8", resizeTo: window });
                return app;
            });
            onCleanup(() => {
                app.destroy();
            });
        }
        let levelEntities = () => world.entitiesWithComponentType(levelComponentType);
        createComputed(on(
            pixiApp,
            (pixiApp) => {
                if (pixiApp == undefined) {
                    return;
                }
                /*
                let render = () => {
                    pixiApp.render();
                    requestAnimationFrame(render);
                };
                requestAnimationFrame(render);
                */
                {
                    let level = renderLevel({
                        windowSize: {
                            get width() {
                                return state.windowWidth;
                            },
                            get height() {
                                return state.windowHeight;
                            },
                        },
                        tileset,
                        cameraX: 100.0,
                        cameraY: 200.0,
                        level: new Level(level1),
                    });
                    pixiApp.stage.addChild(level);
                    onCleanup(() => {
                        pixiApp.stage.removeChild(level);
                    });
                }
                createComputed(
                    levelEntities,
                    (levelEntity: string) => {
                        let levelComponent = createMemo(() => world.getComponent(levelEntity, levelComponentType));
                        createComputed(() => {
                            let levelComponent2 = levelComponent();
                            if (levelComponent2 == undefined) {
                                return;
                            }
                            let levelComponent3 = levelComponent2;
                            let levelState = levelComponent3.state;
                            let level = renderLevel({
                                windowSize: {
                                    get width() {
                                        return state.windowWidth;
                                    },
                                    get height() {
                                        return state.windowHeight;
                                    },
                                },
                                tileset,
                                cameraX: 100.0,
                                cameraY: 200.0,
                                level: new Level(level1),
                            });
                            pixiApp.stage.addChild(level);
                            onCleanup(() => {
                                pixiApp.stage.removeChild(level);
                            });
                        });
                    },
                )
        
            }
        ));
        this.pixiApp = () => pixiApp();
    }
}

function renderLevel(props: {
    windowSize: { width: number; height: number };
    tileset: Spritesheet<typeof tilesetAtlasData>;
    cameraX: number;
    cameraY: number;
    level: Level;
}): ContainerChild {
    const tileRenderWidth = () => 16 * 3;
    const tileRenderHeight = tileRenderWidth;
    const virtualTilesCountX = () =>
        Math.ceil(props.windowSize.width / tileRenderWidth()) + 1;
    const virtualTilesCountY = () =>
        Math.ceil(props.windowSize.height / tileRenderHeight()) + 1;
    const virtualWidth = () => tileRenderWidth() * virtualTilesCountX();
    const virtualHeight = () => tileRenderHeight() * virtualTilesCountY();
    let virtualTileXIndices = createMemo(() =>
        new Array(virtualTilesCountX()).fill(undefined).map((_, idx) => idx),
    );
    let virtualTileYIndices = createMemo(() =>
        new Array(virtualTilesCountY()).fill(undefined).map((_, idx) => idx),
    );
    let container: Container = new Container();
    createMemo(
        mapArray(virtualTileYIndices, (yIdx) => {
            let physicalY = createMemo(
                () => yIdx * tileRenderHeight() - props.cameraY,
            );
            let y = createMemo(
                () =>
                    magicMod(
                        physicalY() + tileRenderHeight(),
                        virtualHeight(),
                    ) - tileRenderHeight(),
            );
            let virtualYIdx = createMemo(
                () =>
                    Math.floor(
                        (virtualHeight() - physicalY() - tileRenderHeight()) /
                            virtualHeight(),
                    ) *
                        virtualTilesCountY() +
                    yIdx,
            );
            let rowContainer = new Container();
            //
            createMemo(
                mapArray(virtualTileXIndices, (idx) => {
                    let physicalX = createMemo(
                        () => idx * tileRenderWidth() - props.cameraX,
                    );
                    let x = createMemo(
                        () =>
                            magicMod(
                                physicalX() + tileRenderWidth(),
                                virtualWidth(),
                            ) - tileRenderWidth(),
                    );
                    let virtualXIdx = createMemo(
                        () =>
                            Math.floor(
                                (virtualWidth() -
                                    physicalX() -
                                    tileRenderWidth()) /
                                    virtualWidth(),
                            ) *
                                virtualTilesCountX() +
                            idx,
                    );
                    let cell = createMemo<
                        keyof (typeof props.tileset)["textures"] | undefined
                    >(() => {
                        let vxIdx = virtualXIdx();
                        let vyIdx = virtualYIdx();
                        return props.level.readTile(vxIdx, vyIdx);
                    });
                    // Debug stuff
                    //
                    /*
                    let text = new Text();
                    createMemo(() => {
                        text.text = `${virtualXIdx()}`;
                    });
                    createMemo(() => {
                        text.x = x();
                        text.y = y();
                    });
                    */
                    //
                    // Debug stuff
                    //
                    /*
                    let text = new Text();
                    createMemo(() => {
                        text.text = cell() ?? ""; //`${virtualXIdx().toString(16)},${virtualYIdx().toString(16)}`;
                    });
                    createMemo(() => {
                        text.x = x();
                        text.y = y();
                    });*/
                    //
                    //
                    let sprite = new Sprite();
                    sprite.scale = 3.0;
                    createMemo(() => {
                        let cell2 = cell();
                        if (cell2 == undefined) {
                            sprite.visible = false;
                        } else {
                            sprite.texture = props.tileset.textures[cell2];
                            sprite.visible = true;
                        }
                    });
                    createMemo(() => {
                        sprite.x = x();
                        sprite.y = y();
                    });
                    rowContainer.addChild(sprite);
                    onCleanup(() => {
                        rowContainer.removeChild(sprite);
                    });
                    // Debug stuff
                    //
                    /*
                    rowContainer.addChild(text);
                    onCleanup(() => {
                        rowContainer.removeChild(text);
                    });*/
                    //
                    //
                }),
            );
            //
            container.addChild(rowContainer);
            onCleanup(() => {
                container.removeChild(rowContainer);
            });
        }),
    );
    return container;
}

function magicMod(a: number, b: number): number {
    let x = a % b;
    if (x < 0) {
        x += b;
    }
    return x;
}
