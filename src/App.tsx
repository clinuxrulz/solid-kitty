import { AnimatedSprite, Application, Assets, Container, ContainerChild, Graphics, Sprite, Spritesheet, Text, Texture, TextureStyle } from "pixi.js";
import { batch, Component, createEffect, createMemo, createResource, createSignal, For, Index, JSX, mapArray, on, onCleanup, Show, untrack } from 'solid-js';
import { atlasData, KITTY_SPRITES } from './KittySprites';
import { World } from './World';
import { Kitty } from './Kitty';
import { createStore } from 'solid-js/store';
import { IsActor } from "./Actor";
import { tilesetAtlasData } from "./tileset";
import { Level } from "./Level";

TextureStyle.defaultOptions.scaleMode = "nearest";

const TEST_SPRITES = false;

await Assets.load(tilesetAtlasData.meta.image);
await Assets.load(atlasData.meta.image);

// Create the SpriteSheet from data and image
const spritesheet = new Spritesheet(
	Texture.from(atlasData.meta.image),
	atlasData
);

// Generate all the Textures asynchronously
await spritesheet.parse();

const tileset = new Spritesheet(
  Texture.from(tilesetAtlasData.meta.image),
  tilesetAtlasData,
);

await tileset.parse();

const App: Component = () => {
  let [ windowSize, setWindowSize, ] = createStore<{
    width: number,
    height: number,
  }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  let resizeListener = (e: Event) => {
    batch(() => {
      setWindowSize("width", window.innerWidth);
      setWindowSize("height", window.innerHeight);
    });
  };
  window.addEventListener("resize", resizeListener);
  onCleanup(() => {
    window.removeEventListener("resize", resizeListener);
  });
  let [ input, setInput ] = createStore<{
    leftPressed: boolean,
    rightPressed: boolean,
    jumpPressed: boolean,
  }>({
    leftPressed: false,
    rightPressed: false,
    jumpPressed: false,
  });
  let world = new World();
  const LEFT_KEY = "ArrowLeft";
  const RIGHT_KEY = "ArrowRight";
  const JUMP_KEY = " ";
  let keyDownListener = (e: KeyboardEvent) => {
    if (e.key == LEFT_KEY) {
      setInput("leftPressed", true);
    } else if (e.key == RIGHT_KEY) {
      setInput("rightPressed", true);
    } else if (e.key == JUMP_KEY) {
      setInput("jumpPressed", true);
    }
  };
  let keyUpListener = (e: KeyboardEvent) => {
    if (e.key == LEFT_KEY) {
      setInput("leftPressed", false);
    } else if (e.key == RIGHT_KEY) {
      setInput("rightPressed", false);
    } else if (e.key == JUMP_KEY) {
      setInput("jumpPressed", false);
    }
  };
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
  onCleanup(() => {
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("keyup", keyUpListener);
  });
  let update = () => {
    batch(() => {
      world.update({
        windowSize,
        leftPressed: input.leftPressed,
        rightPressed: input.rightPressed,
        jumpPressed: input.jumpPressed,
      });
    });
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
  const app = new Application();
  let [ app2, ] = createResource(async () => {
    await app.init({ background: "#1099bb", resizeTo: window, });
    return app;
  });
  onCleanup(() => {
    app.destroy();
  });
  return (
    <Show when={app2()}>
      {(_) => {
        /*
        app.stage.addChild(
          new Sprite({
            texture: Texture.from(tilesetAtlasData.meta.image),
            scale: 3.0,
            x: 100,
            y: -586,
          }),
        );*/
        app.stage.addChild(
          RenderWorld({
            windowSize,
            tileset,
            spritesheet,
            world,
          })
        );
        return app.canvas;
      }}
    </Show>
  );
};

function RenderWorld(props: {
  windowSize: { width: number, height: number },
  tileset: Spritesheet<typeof tilesetAtlasData>,
  spritesheet: Spritesheet,
  world: World,
}): ContainerChild {
  let cameraX = createMemo(() => {
    return props.world.state.camera.pos.x;
  });
  let cameraY = createMemo(() => {
    return props.world.state.camera.pos.y;
  });
  let forEachCallback = (actor: IsActor): ContainerChild | undefined => {
    let spritesheet = untrack(() => props.spritesheet);
    if (actor instanceof Kitty) {
      let actor2 = actor.actor.state;
      let animation = actor.animation;
      let textures = createMemo(() => spritesheet.animations[animation()]);
      let animatedSprite = new AnimatedSprite(
        untrack(textures),
      );
      createMemo(() => {
        animatedSprite.x = actor2.pos.x - cameraX();
        animatedSprite.y = actor2.pos.y - cameraY();
      });
      createMemo(on(
        textures,
        () => {
          animatedSprite.textures = textures();
          animatedSprite.play();
        },
        { defer: true, },
      ));
      animatedSprite.animationSpeed = 0.3;
      animatedSprite.scale = 5.0;
      createMemo(() => {
        if (actor.flipX()) {
          animatedSprite.scale.set(-5.0, 5.0);
          animatedSprite.pivot.set(12.0, 0.0);
        } else {
          animatedSprite.scale = 5.0;
          animatedSprite.pivot.set(0.0, 0.0);
        }
      });
      animatedSprite.play();
      return animatedSprite;
    }
    return undefined;
  };
  let container: Container = new Container();
  createMemo(mapArray(
    () => props.world.state.actors,
    (actor, idx) => {
      let toAdd = forEachCallback(actor);
      if (toAdd == undefined) {
        return;
      }
      container.addChild(toAdd);
      onCleanup(() => {
        container.removeChild(toAdd);
      });
    },
  ));
  container.addChild(RenderLevel({
    get windowSize() {
      return props.windowSize;
    },
    get tileset() {
      return props.tileset;
    },
    get cameraX() {
      return cameraX();
    },
    get cameraY() {
      return cameraY();
    },
    get level() {
      return props.world.state.level;
    },
  }));
  return container;
}

function magicMod(a: number, b: number): number {
  let x = a % b;
  if (x < 0) {
    x += b;
  }
  return x;
}

function RenderLevel(props: {
  windowSize: { width: number, height: number },
  tileset: Spritesheet<typeof tilesetAtlasData>,
  cameraX: number,
  cameraY: number,
  level: Level
}): ContainerChild {
  const tileRenderWidth = () => 16 * 3;
  const tileRenderHeight = tileRenderWidth;
  const virtualTilesCountX = () => Math.ceil(props.windowSize.width / tileRenderWidth()) + 1;
  const virtualTilesCountY = () => Math.ceil(props.windowSize.height / tileRenderHeight()) + 1;
  const virtualWidth = () => tileRenderWidth() * virtualTilesCountX();
  const virtualHeight = () => tileRenderHeight() * virtualTilesCountY();
  let virtualTileXIndices = createMemo(() => new Array(virtualTilesCountX()).fill(undefined).map((_,idx) => idx));
  let virtualTileYIndices = createMemo(() => new Array(virtualTilesCountY()).fill(undefined).map((_,idx) => idx));
  let container: Container = new Container();
  createMemo(mapArray(
    virtualTileYIndices,
    (yIdx) => {
      let physicalY = createMemo(() =>
        yIdx * tileRenderHeight() - props.cameraY,
      );
      let y = createMemo(() =>
        magicMod(
          physicalY() + tileRenderHeight(),
          virtualHeight(),
        ) - tileRenderHeight()
      );
      let virtualYIdx = createMemo(() =>
        Math.floor((virtualHeight() - physicalY() - tileRenderHeight()) / virtualHeight()) * virtualTilesCountY() + yIdx,
      );
      let rowContainer = new Container();
      //
      createMemo(mapArray(
        virtualTileXIndices,
        (idx) => {
          let physicalX = createMemo(() =>
            idx * tileRenderWidth() - props.cameraX
          );
          let x = createMemo(() =>
            magicMod(
              physicalX() + tileRenderWidth(),
              virtualWidth(),
            ) - tileRenderWidth()
          );
          let virtualXIdx = createMemo(() =>
            Math.floor((virtualWidth() - physicalX() - tileRenderWidth()) / virtualWidth()) * virtualTilesCountX() + idx,
          );
          let cell = createMemo<keyof (typeof props.tileset)["textures"] | undefined>(() => {
            let vxIdx = virtualXIdx();
            let vyIdx = virtualYIdx();
            return props.level.readTile(vxIdx, vyIdx);
          });
          // Debug stuff
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
          // Debug stuff
          /*
          let text = new Text();
          createMemo(() => {
            text.text = cell() ?? ""; //`${virtualXIdx().toString(16)},${virtualYIdx().toString(16)}`;
          });
          createMemo(() => {
            text.x = x();
            text.y = y();
          });
          */
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
          /*
          rowContainer.addChild(text);
          onCleanup(() => {
            rowContainer.removeChild(text);
          });
          */
          //
        },
      ));
      //
      container.addChild(rowContainer);
      onCleanup(() => {
        container.removeChild(rowContainer);
      });
    },
  ));
  return container;
}

/*
function TestSprites(props: {
  spritesheet: Spritesheet,
}): JSX.Element {
  let spritesheet = untrack(() => props.spritesheet);
  return (
    <For each={[
      spritesheet.animations.kitty_flying,
      spritesheet.animations.kitty_running,
      spritesheet.animations.kitty_stand,
      spritesheet.animations.kitty_bump,
      spritesheet.animations.kitty_skid,
      spritesheet.animations.kitty_jump,
      spritesheet.animations.kitty_drop,
      spritesheet.animations.kitty_pump,
      spritesheet.animations.kitty_hurt,
      spritesheet.animations.kitty_fall,
      spritesheet.animations.balloon,
      spritesheet.animations.balloon_pair,
    ]}>
      {(animation,idx) => {
        let col = createMemo(() => idx() % 5);
        let row = createMemo(() => Math.floor(idx() / 5));
        return (
          <AnimatedSprite
            x={50+col()*110}
            y={50+row()*110}
            animationSpeed={0.1}
            scale={5.0}
            textures={animation}
            ref={(ref) => ref.play()}
          />
        );
      }}
    </For>
  );
}
*/
export default App;
function mapIndex(): import("solid-js").EffectFunction<unknown, unknown> {
  throw new Error("Function not implemented.");
}

