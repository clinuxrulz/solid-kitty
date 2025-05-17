import {
  Application,
  Assets,
  Container,
  ContainerChild,
  Dict,
  Renderer,
  Sprite,
  Spritesheet,
  SpritesheetFrameData,
  Texture,
  TextureStyle,
} from "pixi.js";
import {
  Accessor,
  batch,
  createComputed,
  createMemo,
  createResource,
  createSignal,
  mapArray,
  on,
  onCleanup,
  Resource,
} from "solid-js";
import { Level, level1 } from "../kitty-demo/Level";
import { tilesetAtlasData } from "../kitty-demo/tileset";
import { EcsWorld } from "../ecs/EcsWorld";
import {
  levelComponentType,
  LevelState,
} from "../level-builder/components/LevelComponent";
import { createStore } from "solid-js/store";
import { smSpriteAtlasData } from "../kitty-demo/SmSprites";
import { mmSpriteAtlasData } from "../kitty-demo/MmSprites";
import { atlasData } from "../kitty-demo/KittySprites";
import { Transform2D } from "../math/Transform2D";
import { Text } from "pixi.js";
import {
  createGetLevelsFolder,
  createTextureAtlasWithImageAndFramesList,
  levelRefComponentType,
  spriteComponentType,
  transform2DComponentType,
} from "../lib";
import { EcsWorldAutomergeProjection } from "../ecs/EcsWorldAutomergeProjection";
import { registry } from "../level-builder/components/registry";
import { TextureAtlasState } from "../level-builder/components/TextureAtlasComponent";
import { FrameState } from "../level-builder/components/FrameComponent";
import { AsyncResult } from "control-flow-as-value";
import { ReactiveCache } from "reactive-cache";
import { scaleComponentType } from "../components/ScaleComponent";
import { Cont } from "../Cont";
import { AutomergeVfsFile, AutomergeVfsFolder } from "solid-fs-automerge";

TextureStyle.defaultOptions.scaleMode = "nearest";

await Promise.all([
  //Assets.load(tilesetAtlasData.meta.image),
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

/*
const tileset = new Spritesheet(
    Texture.from(tilesetAtlasData.meta.image),
    tilesetAtlasData,
);

await tileset.parse();
*/

export class PixiRenderSystem {
  pixiApp: Accessor<Application<Renderer> | undefined>;

  constructor(params: { world: EcsWorld }) {
    let textureAtlasWithImageAndFramesList =
      createTextureAtlasWithImageAndFramesList();
    let frameIdToFrameMap = createMemo(() => {
      let textureAtlasWithImageAndFramesList2 =
        textureAtlasWithImageAndFramesList();
      if (textureAtlasWithImageAndFramesList2.type != "Success") {
        return undefined;
      }
      let textureAtlasWithImageAndFramesList3 =
        textureAtlasWithImageAndFramesList2.value;
      let result = new Map<string, FrameState>();
      for (let entry of textureAtlasWithImageAndFramesList3) {
        for (let entry2 of entry.frames) {
          result.set(entry2.frameId, entry2.frame);
        }
      }
      return result;
    });
    let textureAtlasFilename_frameName_toFrameIdMap = createMemo(() => {
      let textureAtlasWithImageAndFramesList2 =
        textureAtlasWithImageAndFramesList();
      if (textureAtlasWithImageAndFramesList2.type != "Success") {
        return undefined;
      }
      let textureAtlasWithImageAndFramesList3 =
        textureAtlasWithImageAndFramesList2.value;
      let result = new Map<string, string>();
      for (let entry of textureAtlasWithImageAndFramesList3) {
        for (let entry2 of entry.frames) {
          result.set(
            entry.textureAtlasFilename() + "/" + entry2.frame.name,
            entry2.frameId,
          );
        }
      }
      return result;
    });
    let lookupFrameIdByTextureAtlasFilenameAndFrameName_ = new ReactiveCache<
      string | undefined
    >();
    let lookupFrameIdByTextureAtlasFilenameAndFrameName = (
      textureAtlasFilename: string,
      frameName: string,
    ) =>
      lookupFrameIdByTextureAtlasFilenameAndFrameName_.cached(
        textureAtlasFilename + "/" + frameName,
        () =>
          textureAtlasFilename_frameName_toFrameIdMap()?.get(
            textureAtlasFilename + "/" + frameName,
          ),
      );
    let lookupFrameById_ = new ReactiveCache<FrameState | undefined>();
    let lookupFrameById = (frameId: string) =>
      lookupFrameById_.cached(frameId, () => frameIdToFrameMap()?.get(frameId));
    let lookupSpriteSheetFromTextureAtlasRef_ = new ReactiveCache<
      | Spritesheet<{
          frames: Dict<SpritesheetFrameData>;
          meta: {
            image: string;
            scale: number;
          };
        }>
      | undefined
    >();
    let images = createMemo(() => {
      let textureAtlasWithImageAndFramesList2 =
        textureAtlasWithImageAndFramesList();
      if (textureAtlasWithImageAndFramesList2.type != "Success") {
        return [];
      }
      let textureAtlasWithImageAndFramesList3 =
        textureAtlasWithImageAndFramesList2.value;
      return textureAtlasWithImageAndFramesList3.map((entry) => entry.image);
    });
    let [imageLoadCount, setImageLoadCount] = createSignal(0);
    createComputed(
      mapArray(images, (image) => {
        Assets.load({
          src: image.src,
          format: "png",
          loadParser: "loadTextures",
        }).then(() => setImageLoadCount((x) => x + 1));
        onCleanup(() => {
          Assets.unload(image.src);
          setImageLoadCount((x) => x - 1);
        });
      }),
    );
    let areAllImagesLoaded = createMemo(() => {
      return (
        imageLoadCount() == images().length &&
        textureAtlasWithImageAndFramesList().type == "Success"
      );
    });
    let [state, setState] = createStore<{
      windowWidth: number;
      windowHeight: number;
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
      [pixiApp] = createResource(async () => {
        await app.init({ background: "#00f8f8", resizeTo: window });
        return app;
      });
      onCleanup(() => {
        app.destroy();
      });
    }
    Cont.of<{
      pixiApp: Application<Renderer>;
      levelsFolder: Accessor<AsyncResult<AutomergeVfsFolder>>;
      lookupSpriteSheetFromTextureAtlasRef: (textureAtlasRef: string) =>
        | Spritesheet<{
            frames: Dict<SpritesheetFrameData>;
            meta: {
              image: string;
              scale: number;
            };
          }>
        | undefined;
    }>((kontinue) => {
      createComputed(
        on([pixiApp, areAllImagesLoaded], ([pixiApp, areAllImagesLoaded]) => {
          if (pixiApp == undefined) {
            return;
          }
          if (!areAllImagesLoaded) {
            return;
          }
          {
            let scopeDone = false;
            onCleanup(() => {
              scopeDone = true;
            });
            let render = () => {
              if (scopeDone) {
                return;
              }
              pixiApp.render();
              requestAnimationFrame(render);
            };
            requestAnimationFrame(render);
          }
          let spriteSheets = createSpriteSheets({
            textureAtlasWithImageAndFramesList,
          });
          let lookupSpriteSheetFromTextureAtlasRef = (
            textureAtlasRef: string,
          ) =>
            lookupSpriteSheetFromTextureAtlasRef_.cached(
              textureAtlasRef,
              () => {
                for (let entry of spriteSheets()) {
                  if (entry.textureAtlasRef == textureAtlasRef) {
                    return entry.spritesheet;
                  }
                }
                return undefined;
              },
            );
          let levelsFolder = createGetLevelsFolder();
          kontinue({
            pixiApp,
            levelsFolder,
            lookupSpriteSheetFromTextureAtlasRef,
          });
        }),
      );
    })
      .thenCont<{
        pixiApp: Application<Renderer>;
        levelsFolder: AutomergeVfsFolder;
        lookupSpriteSheetFromTextureAtlasRef: (textureAtlasRef: string) =>
          | Spritesheet<{
              frames: Dict<SpritesheetFrameData>;
              meta: {
                image: string;
                scale: number;
              };
            }>
          | undefined;
        levelRefEntities: Accessor<string[]>;
      }>(
        (
          { pixiApp, levelsFolder, lookupSpriteSheetFromTextureAtlasRef },
          kontinue,
        ) => {
          createComputed(
            on([levelsFolder], ([levelsFolder]) => {
              if (levelsFolder.type != "Success") {
                return;
              }
              let levelsFolder2 = levelsFolder.value;
              let levelRefEntities = () =>
                world.entitiesWithComponentType(levelRefComponentType);
              kontinue({
                pixiApp,
                levelsFolder: levelsFolder2,
                lookupSpriteSheetFromTextureAtlasRef,
                levelRefEntities,
              });
            }),
          );
          Cont.of<{
            scale: Accessor<number | undefined>;
            space: Accessor<Transform2D | undefined>;
            spriteSheet: Accessor<
              | Spritesheet<{
                  frames: Dict<SpritesheetFrameData>;
                  meta: {
                    image: string;
                    scale: number;
                  };
                }>
              | undefined
            >;
            frameId: Accessor<string | undefined>;
            frame: Accessor<FrameState | undefined>;
            hasSpriteSheet: Accessor<boolean>;
            hasFrameId: Accessor<boolean>;
            hasFrame: Accessor<boolean>;
          }>((kontinue) => {
            let spriteEntities = () =>
              world.entitiesWithComponentType(spriteComponentType);
            createComputed(
              mapArray(spriteEntities, (entity) =>
                createComputed(() => {
                  let sprite = world.getComponent(
                    entity,
                    spriteComponentType,
                  )?.state;
                  let space = () =>
                    world.getComponent(entity, transform2DComponentType)?.state
                      ?.transform;
                  let scale = createMemo(
                    () =>
                      world.getComponent(entity, scaleComponentType)?.state
                        .scale,
                  );
                  if (sprite == undefined) {
                    return;
                  }
                  if (space == undefined) {
                    return;
                  }
                  let spriteSheet = () =>
                    lookupSpriteSheetFromTextureAtlasRef(
                      sprite.textureAtlasFilename,
                    );
                  let frameId = () =>
                    lookupFrameIdByTextureAtlasFilenameAndFrameName(
                      sprite.textureAtlasFilename,
                      sprite.frameName,
                    );
                  let frame = () => {
                    let frameId2 = frameId();
                    if (frameId2 == undefined) {
                      return undefined;
                    }
                    return lookupFrameById(frameId2);
                  };
                  let hasSpriteSheet = createMemo(
                    () => spriteSheet() != undefined,
                  );
                  let hasFrameId = createMemo(() => frameId() != undefined);
                  let hasFrame = createMemo(() => frame() != undefined);
                  kontinue({
                    scale,
                    space,
                    spriteSheet,
                    frameId,
                    frame,
                    hasSpriteSheet,
                    hasFrameId,
                    hasFrame,
                  });
                }),
              ),
            );
          })
            .thenCont(
              (
                {
                  scale,
                  space,
                  spriteSheet,
                  frameId,
                  frame,
                  hasSpriteSheet,
                  hasFrameId,
                  hasFrame,
                },
                _kontinue,
              ) => {
                createComputed(() => {
                  if (!hasSpriteSheet()) {
                    return;
                  }
                  if (!hasFrameId()) {
                    return;
                  }
                  if (!hasFrame()) {
                    return;
                  }
                  let spriteSheet2 = spriteSheet as Accessor<
                    NonNullable<ReturnType<typeof spriteSheet>>
                  >;
                  let frameId2 = frameId as Accessor<
                    NonNullable<ReturnType<typeof frameId>>
                  >;
                  let frame2 = frame as Accessor<
                    NonNullable<ReturnType<typeof frame>>
                  >;
                  let sprite = new Sprite();
                  createComputed(() => {
                    let scale2 = scale() ?? 1.0;
                    sprite.texture = spriteSheet2().textures[frameId2()];
                    sprite.width = frame2().size.x * scale2;
                    sprite.height = frame2().size.y * scale2;
                  });
                  createComputed(() => {
                    let space2 = space() ?? Transform2D.identity;
                    sprite.x = space2.origin.x;
                    sprite.y = space2.origin.y;
                  });
                  pixiApp.stage.addChild(sprite);
                  onCleanup(() => pixiApp.stage.removeChild(sprite));
                });
              },
            )
            .run();
        },
      )
      .thenCont<{
        pixiApp: Application<Renderer>;
        levelsFolder: AutomergeVfsFolder;
        lookupSpriteSheetFromTextureAtlasRef: (textureAtlasRef: string) =>
          | Spritesheet<{
              frames: Dict<SpritesheetFrameData>;
              meta: {
                image: string;
                scale: number;
              };
            }>
          | undefined;
        levelFileId: Accessor<string | undefined>;
      }>(
        (
          {
            pixiApp,
            levelsFolder,
            lookupSpriteSheetFromTextureAtlasRef,
            levelRefEntities,
          },
          kontinue,
        ) => {
          createComputed(
            mapArray(levelRefEntities, (levelRefEntity) =>
              createComputed(() => {
                let levelRef = world.getComponent(
                  levelRefEntity,
                  levelRefComponentType,
                )?.state;
                if (levelRef == undefined) {
                  return;
                }
                let levelFileId = createMemo(() => {
                  for (let entry of levelsFolder.contents) {
                    if (
                      entry.name == levelRef.levelFilename &&
                      entry.type == "File"
                    ) {
                      return entry.id;
                    }
                  }
                  return undefined;
                });
                kontinue({
                  pixiApp,
                  levelsFolder,
                  lookupSpriteSheetFromTextureAtlasRef,
                  levelFileId,
                });
              }),
            ),
          );
        },
      )
      .thenCont<{
        pixiApp: Application<Renderer>;
        levelFile: Accessor<AsyncResult<AutomergeVfsFile<unknown>>>;
        lookupSpriteSheetFromTextureAtlasRef: (textureAtlasRef: string) =>
          | Spritesheet<{
              frames: Dict<SpritesheetFrameData>;
              meta: {
                image: string;
                scale: number;
              };
            }>
          | undefined;
      }>(
        (
          {
            pixiApp,
            levelsFolder,
            lookupSpriteSheetFromTextureAtlasRef,
            levelFileId,
          },
          kontinue,
        ) => {
          createComputed(
            on(levelFileId, (levelFileId) => {
              if (levelFileId == undefined) {
                return;
              }
              let levelFile = levelsFolder.openFileById(levelFileId);
              kontinue({
                pixiApp,
                levelFile,
                lookupSpriteSheetFromTextureAtlasRef,
              });
            }),
          );
        },
      )
      .thenCont<{
        world: EcsWorldAutomergeProjection;
        pixiApp: Application<Renderer>;
        lookupSpriteSheetFromTextureAtlasRef: (textureAtlasRef: string) =>
          | Spritesheet<{
              frames: Dict<SpritesheetFrameData>;
              meta: {
                image: string;
                scale: number;
              };
            }>
          | undefined;
      }>(
        (
          { pixiApp, levelFile, lookupSpriteSheetFromTextureAtlasRef },
          kontinue,
        ) => {
          createComputed(
            on(levelFile, (levelFile) => {
              if (levelFile.type != "Success") {
                return;
              }
              let levelFile2 = levelFile.value;
              let r = EcsWorldAutomergeProjection.create(
                registry,
                levelFile2.docHandle,
              );
              if (r.type == "Err") {
                return;
              }
              let world = r.value;
              kontinue({
                world,
                pixiApp,
                lookupSpriteSheetFromTextureAtlasRef,
              });
            }),
          );
        },
      )
      .thenCont<{}>(
        (
          { world, pixiApp, lookupSpriteSheetFromTextureAtlasRef },
          _kontinue,
        ) => {
          createComputed(
            mapArray(
              () => world.entitiesWithComponentType(levelComponentType),
              (levelEntity) =>
                createComputed(() => {
                  let levelComponent = world.getComponent(
                    levelEntity,
                    levelComponentType,
                  );
                  if (levelComponent == undefined) {
                    return;
                  }
                  let levelComponent2 = levelComponent;
                  let levelState = levelComponent2.state;
                  let container = renderLevel({
                    windowSize: {
                      get width() {
                        return state.windowWidth;
                      },
                      get height() {
                        return state.windowHeight;
                      },
                    },
                    cameraX: 0.0,
                    cameraY: 0.0,
                    levelState,
                    lookupSpriteSheetFromTextureAtlasRef,
                    lookupFrameById,
                  });
                  pixiApp.stage.addChild(container);
                  onCleanup(() => {
                    pixiApp.stage.removeChild(container);
                  });
                }),
            ),
          );
        },
      )
      .run();
    this.pixiApp = () => pixiApp();
  }
}

function createSpriteSheets(params: {
  textureAtlasWithImageAndFramesList: Accessor<
    AsyncResult<
      {
        textureAtlasFilename: Accessor<string>;
        textureAtlas: TextureAtlasState;
        image: HTMLImageElement;
        frames: {
          frameId: string;
          frame: FrameState;
        }[];
      }[]
    >
  >;
}): Accessor<
  {
    /** This is the texture atlas filename for now. */
    textureAtlasRef: string;
    //
    imageRef: string;
    spritesheet: Spritesheet<{
      frames: Dict<SpritesheetFrameData>;
      meta: {
        image: string;
        scale: number;
      };
    }>;
  }[]
> {
  let textureAtlasWithImageAndFramesList = createMemo(
    on(
      params.textureAtlasWithImageAndFramesList,
      (textureAtlasWithImageAndFramesList2) => {
        if (textureAtlasWithImageAndFramesList2.type != "Success") {
          return [];
        }
        return textureAtlasWithImageAndFramesList2.value;
      },
    ),
  );
  let result_ = createMemo(
    mapArray(textureAtlasWithImageAndFramesList, (entry) =>
      createMemo(() => {
        let texture = Texture.from(entry.image.src);
        onCleanup(() => texture.destroy());
        let frames: Dict<SpritesheetFrameData> = {};
        for (let { frameId, frame } of entry.frames) {
          frames[frameId] = {
            frame: {
              x: frame.pos.x,
              y: frame.pos.y,
              w: frame.size.x,
              h: frame.size.y,
            },
            sourceSize: { w: frame.size.x, h: frame.size.y },
            spriteSourceSize: { x: 0, y: 0, w: frame.size.x, h: frame.size.y },
          };
        }
        let atlasData = {
          frames,
          meta: {
            image: entry.image.src,
            scale: 1.0,
          },
        };
        let spritesheet = new Spritesheet(texture, atlasData);
        spritesheet.parse();
        return {
          textureAtlasRef: entry.textureAtlasFilename(),
          imageRef: entry.textureAtlas.imageRef,
          spritesheet,
        };
      }),
    ),
  );
  return createMemo(() => result_().map((x) => x()));
}

function renderLevel(props: {
  windowSize: { width: number; height: number };
  cameraX: number;
  cameraY: number;
  levelState: LevelState;
  lookupSpriteSheetFromTextureAtlasRef: (textureAtlasRef: string) =>
    | Spritesheet<{
        frames: Dict<SpritesheetFrameData>;
        meta: {
          image: string;
          scale: number;
        };
      }>
    | undefined;
  lookupFrameById: (frameId: string) => FrameState | undefined;
}): ContainerChild {
  let shortIdToTextureAtlasRefAndFrameIdMap = createMemo(() => {
    let result = new Map<
      number,
      { textureAtlasRef: string; frameId: string }
    >();
    for (let entry of props.levelState.tileToShortIdTable) {
      for (let frame of entry.frames) {
        result.set(frame.shortId, {
          textureAtlasRef: entry.textureAtlasRef,
          frameId: frame.frameId,
        });
      }
    }
    return result;
  });
  let shortIdToTextureAtlasRefAndFrameId_ = new ReactiveCache<
    { textureAtlasRef: string; frameId: string } | undefined
  >();
  let shortIdToTextureAtlasRefAndFrameId = (shortId: number) =>
    shortIdToTextureAtlasRefAndFrameId_.cached(`${shortId}`, () =>
      shortIdToTextureAtlasRefAndFrameIdMap().get(shortId),
    );
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
          magicMod(physicalY() + tileRenderHeight(), virtualHeight()) -
          tileRenderHeight(),
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
              magicMod(physicalX() + tileRenderWidth(), virtualWidth()) -
              tileRenderWidth(),
          );
          let virtualXIdx = createMemo(
            () =>
              Math.floor(
                (virtualWidth() - physicalX() - tileRenderWidth()) /
                  virtualWidth(),
              ) *
                virtualTilesCountX() +
              idx,
          );
          let cell = createMemo<
            | {
                spritesheet: Spritesheet<{
                  frames: Dict<SpritesheetFrameData>;
                  meta: {
                    image: string;
                    scale: number;
                  };
                }>;
                frameId: string;
              }
            | undefined
          >(() => {
            let vxIdx = virtualXIdx();
            let vyIdx = virtualYIdx();
            if (vyIdx < 0 || vyIdx >= props.levelState.mapData.length) {
              return undefined;
            }
            let row = props.levelState.mapData[vyIdx];
            if (vxIdx < 0 || vxIdx >= row.length) {
              return undefined;
            }
            let shortId = row[vxIdx];
            let textureAtlasRef_frameId =
              shortIdToTextureAtlasRefAndFrameId(shortId);
            if (textureAtlasRef_frameId == undefined) {
              return undefined;
            }
            let { textureAtlasRef, frameId } = textureAtlasRef_frameId;
            let spritesheet =
              props.lookupSpriteSheetFromTextureAtlasRef(textureAtlasRef);
            if (spritesheet == undefined) {
              return undefined;
            }
            return {
              spritesheet,
              frameId,
            };
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
              let frameData = props.lookupFrameById(cell2.frameId);
              if (frameData != undefined) {
                sprite.width = tileRenderWidth() * frameData.numCells.x;
                sprite.height = tileRenderHeight() * frameData.numCells.y;
              }
              sprite.texture = cell2.spritesheet.textures[cell2.frameId];
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
