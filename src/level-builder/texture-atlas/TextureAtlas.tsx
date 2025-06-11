import {
  Accessor,
  batch,
  Component,
  createComputed,
  createEffect,
  createMemo,
  createSignal,
  JSX,
  mergeProps,
  on,
  onCleanup,
  Setter,
  Show,
} from "solid-js";
import { Vec2 } from "../../math/Vec2";
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { UndoManager, UndoUnit } from "../../pixel-editor/UndoManager";
import { Mode } from "./Mode";
import { ModeParams } from "./ModeParams";
import { MakeFrameMode } from "./modes/MakeFrameMode";
import { IdleMode } from "./modes/IdleMode";
import { EcsWorld } from "../../ecs/EcsWorld";
import { RenderSystem } from "./systems/RenderSystem";
import { RenderParams } from "./RenderParams";
import { PickingSystem } from "./systems/PickingSystem";
import { asyncFailed, AsyncResult, asyncSuccess } from "../../AsyncResult";
import { registry } from "../components/registry";
import { textureAtlasComponentType } from "../components/TextureAtlasComponent";
import { ReactiveVirtualFileSystem } from "../../ReactiveVirtualFileSystem";
import {
  AutomergeVfsFolder,
  AutomergeVirtualFileSystem,
} from "solid-fs-automerge";
import { makeDocumentProjection } from "solid-automerge";
import { ok } from "../../kitty-demo/Result";
import { base64ToUint8Array, NoTrack } from "../../util";
import { IEcsWorld } from "../../ecs/IEcsWorld";
import { EcsWorldAutomergeProjection } from "../../ecs/EcsWorldAutomergeProjection";
import ImageToTilesetCreator from "./ImageToTilesetCreator";

type State = {
  mousePos: Vec2 | undefined;
  pan: Vec2;
  scale: number;
  //
  touches: {
    id: number;
    pos: Vec2;
  }[];
  // panning/zoom states
  isTouchPanZoom: boolean;
  touchPanZoomFrom: Vec2 | undefined;
  touchPanZoomInitScale: number | undefined;
  touchPanZoomInitGap: number | undefined;
  //
  mkMode: (() => Mode) | undefined;
  //
  autoSaving: boolean;
  world: IEcsWorld;
  overlayApp:
    | NoTrack<{
        Title: Component;
        View: Component;
      }>
    | undefined;
};

const AUTO_SAVE_TIMEOUT = 2000;

export class TextureAtlas {
  private undoManager: UndoManager;
  private state: Store<State>;
  private setState: SetStoreFunction<State>;
  private image: Accessor<HTMLImageElement | undefined>;
  private size: Accessor<Vec2 | undefined>;
  private screenPtToWorldPt: (screenPt: Vec2) => Vec2 | undefined;
  private worldPtToScreenPt: (worldPt: Vec2) => Vec2 | undefined;
  private svg: Accessor<SVGSVGElement | undefined>;
  private setSvg: Setter<SVGSVGElement | undefined>;
  private mode: Accessor<Mode>;
  private renderSystem: RenderSystem;
  Render: Component<{
    style?: JSX.CSSProperties;
    onBurger?: () => void;
  }>;

  constructor(params: {
    vfs: AutomergeVirtualFileSystem;
    imagesFolder: Accessor<AsyncResult<AutomergeVfsFolder>>;
    textureAtlasesFolder: Accessor<AsyncResult<AutomergeVfsFolder>>;
    textureAtlasFileId: Accessor<string | undefined>;
  }) {
    let undoManager = new UndoManager();
    let [state, setState] = createStore<State>({
      mousePos: undefined,
      pan: Vec2.create(-1, -1),
      scale: 30.0,
      touches: [],
      isTouchPanZoom: false,
      touchPanZoomFrom: undefined,
      touchPanZoomInitScale: undefined,
      touchPanZoomInitGap: undefined,
      mkMode: undefined,
      autoSaving: false,
      world: new EcsWorld(),
      overlayApp: undefined,
    });
    let [imageUrlDispose, setImageUrlDispose] = createSignal<() => void>(
      () => {},
    );
    let [image, setImage] = createSignal<HTMLImageElement>();
    let [size, setSize] = createSignal<Vec2>();
    onCleanup(() => {
      imageUrlDispose()();
    });
    createComputed(
      on([params.textureAtlasFileId], async () => {
        let textureAtlasFileId = params.textureAtlasFileId();
        if (textureAtlasFileId == undefined) {
          batch(() => {
            setState("world", new EcsWorld());
            setImage(undefined);
            setSize(undefined);
          });
          return;
        }
        let imagesFolder = params.imagesFolder();
        if (imagesFolder.type != "Success") {
          return;
        }
        let textureAtlasesFolder = params.textureAtlasesFolder();
        if (textureAtlasesFolder.type != "Success") {
          return;
        }
        let textureAtlasesFolder2 = textureAtlasesFolder.value;
        let imagesFolder2 = imagesFolder.value;
        let textureAtlasFileId2 = textureAtlasFileId;
        let textureAtlasData =
          textureAtlasesFolder2.openFileById(textureAtlasFileId2);
        createEffect(
          on(textureAtlasData, () => {
            let textureAtlasData2 = textureAtlasData();
            if (textureAtlasData2.type != "Success") {
              return;
            }
            let textureAtlasData3 = textureAtlasData2.value;
            let r = EcsWorldAutomergeProjection.create(
              registry,
              textureAtlasData3.docHandle,
            );
            if (r.type == "Err") {
              return;
            }
            let world = r.value;
            let entities = world.entitiesWithComponentType(
              textureAtlasComponentType,
            );
            if (entities.length != 1) {
              return;
            }
            let entity = entities[0];
            let textureAtlas = world.getComponent(
              entity,
              textureAtlasComponentType,
            )?.state;
            if (textureAtlas == undefined) {
              return;
            }
            let imageFilename = textureAtlas.imageRef;
            let filesAndFolders = createMemo(() => imagesFolder2.contents);
            createEffect(
              on(filesAndFolders, () => {
                let imageFileId: string | undefined = undefined;
                for (let x of filesAndFolders()) {
                  if (x.name == imageFilename && x.type == "File") {
                    imageFileId = x.id;
                    break;
                  }
                }
                if (imageFileId == undefined) {
                  return;
                }
                let imageData = imagesFolder2.openFileById<{
                  mimeType: string;
                  data: Uint8Array;
                }>(imageFileId);
                createEffect(
                  on(imageData, () => {
                    let imageData2 = imageData();
                    if (imageData2.type != "Success") {
                      return imageData2;
                    }
                    let imageData3 = imageData2.value;
                    let blob = new Blob([imageData3.doc.data], {
                      type: imageData3.doc.mimeType,
                    });
                    let imageUrl = URL.createObjectURL(blob);
                    imageUrlDispose()();
                    setImageUrlDispose(() => () => {
                      URL.revokeObjectURL(imageUrl);
                    });
                    let image = new Image();
                    image.src = imageUrl;
                    image.style.setProperty("image-rendering", "pixelated");
                    image.onload = () => {
                      batch(() => {
                        setImage(image);
                        setSize(Vec2.create(image.width, image.height));
                      });
                    };
                    setState("world", world);
                  }),
                );
              }),
            );
          }),
        );
      }),
    );
    let [svg, setSvg] = createSignal<SVGSVGElement>();
    let [screenSize, setScreenSize] = createSignal<Vec2>();
    createComputed(
      on(svg, () => {
        let svg2 = svg();
        if (svg2 == undefined) {
          return;
        }
        let resizeObserver = new ResizeObserver(() => {
          let rect = svg2.getBoundingClientRect();
          setScreenSize(Vec2.create(rect.width, rect.height));
        });
        resizeObserver.observe(svg2);
        onCleanup(() => {
          resizeObserver.unobserve(svg2);
          resizeObserver.disconnect();
          setScreenSize(undefined);
        });
      }),
    );
    //
    let screenPtToWorldPt = (screenPt: Vec2): Vec2 | undefined => {
      return screenPt.multScalar(1.0 / state.scale).add(state.pan);
    };
    let worldPtToScreenPt = (worldPt: Vec2): Vec2 | undefined => {
      return worldPt.sub(state.pan).multScalar(state.scale);
    };
    //
    let renderParams: RenderParams = {
      worldPtToScreenPt,
    };
    //
    let pickingSystem = new PickingSystem({
      mousePos: () => state.mousePos,
      screenPtToWorldPt,
      worldPtToScreenPt,
      world: () => state.world,
    });
    //
    let setMode = (mkMode: () => void) => {
      setState("mkMode", () => mkMode);
    };
    let modeParams: ModeParams = {
      undoManager,
      mousePos: () => state.mousePos,
      screenSize,
      screenPtToWorldPt,
      worldPtToScreenPt,
      world: () => state.world,
      pickingSystem,
      onDone: () => idle(),
      setMode,
    };
    let idle = () => {
      setMode(() => new IdleMode({ modeParams }));
    };
    let makeFrame = () => {
      setMode(() => new MakeFrameMode(modeParams));
    };
    let mode = createMemo<Mode>(() => {
      if (state.mkMode == undefined) {
        return new IdleMode({ modeParams });
      }
      return state.mkMode();
    });
    let highlightedEntitiesSet = createMemo(() => {
      return new Set(mode().highlightedEntities?.() ?? []);
    });
    let selectedEntitiesSet = createMemo(() => {
      return new Set(mode().selectedEntities?.() ?? []);
    });
    let renderSystem = new RenderSystem({
      renderParams,
      world: () => state.world,
      highlightedEntitiesSet,
      selectedEntitiesSet,
    });
    //
    this.undoManager = undoManager;
    this.state = state;
    this.setState = setState;
    this.image = image;
    this.size = size;
    this.screenPtToWorldPt = screenPtToWorldPt;
    this.worldPtToScreenPt = worldPtToScreenPt;
    this.svg = svg;
    this.setSvg = setSvg;
    this.mode = mode;
    this.renderSystem = renderSystem;
    //
    this.Render = (props) => {
      let Instructions = () => <>{mode().instructions?.({})}</>;
      let OverlaySvgUI = () => <>{mode().overlaySvgUI?.({})}</>;
      let OverlayHtmlUI = () => <>{mode().overlayHtmlUI?.({})}</>;
      let disableOneFingerPan = createMemo(
        () => mode().disableOneFingerPan?.() ?? false,
      );
      //
      let zoomByFactor = (factor: number) => {
        if (state.mousePos == undefined) {
          return;
        }
        let pt = screenPtToWorldPt(state.mousePos);
        if (pt == undefined) {
          return;
        }
        let newScale = state.scale * factor;
        let newPan = pt.sub(state.mousePos.multScalar(1.0 / newScale));
        batch(() => {
          setState("pan", newPan);
          setState("scale", state.scale * factor);
        });
      };
      createComputed(
        on(
          [
            () => state.isTouchPanZoom,
            () => state.touchPanZoomFrom,
            () => state.touchPanZoomInitGap,
            () => state.touchPanZoomInitScale,
            () => state.touches,
            () => state.mousePos,
            disableOneFingerPan,
          ],
          () => {
            if (!state.isTouchPanZoom) {
              return;
            }
            if (state.touchPanZoomFrom == undefined) {
              return;
            }
            if (state.mousePos == undefined) {
              return;
            }
            if (state.touchPanZoomInitScale == undefined) {
              return;
            }
            if (disableOneFingerPan() && state.touches.length == 1) {
              return;
            }
            let pt = screenPtToWorldPt(state.mousePos);
            if (pt == undefined) {
              return;
            }
            let gap: number | undefined;
            if (state.touches.length != 2) {
              gap = undefined;
            } else {
              gap = state.touches[1].pos.sub(state.touches[0].pos).length();
            }
            let delta = state.touchPanZoomFrom.sub(pt);
            let initScale = state.touchPanZoomInitScale;
            batch(() => {
              setState("pan", (pan) => pan.add(delta));
              if (state.touchPanZoomInitGap != undefined && gap != undefined) {
                let newScale = (initScale * gap) / state.touchPanZoomInitGap;
                setState("scale", newScale);
              }
            });
          },
        ),
      );
      let startTouchPanZoom = () => {
        if (state.touches.length == 0) {
          return;
        }
        if (state.mousePos == undefined) {
          return;
        }
        let initGap: number | undefined;
        if (state.touches.length != 2) {
          initGap = undefined;
        } else {
          initGap = state.touches[1].pos.sub(state.touches[0].pos).length();
        }
        let pt = screenPtToWorldPt(state.mousePos);
        if (pt == undefined) {
          return;
        }
        batch(() => {
          setState("isTouchPanZoom", true);
          setState("touchPanZoomFrom", pt);
          setState("touchPanZoomInitGap", initGap);
          setState("touchPanZoomInitScale", state.scale);
        });
      };
      let stopTouchPanZoom = () => {
        batch(() => {
          setState("isTouchPanZoom", false);
          setState("touchPanZoomFrom", undefined);
          setState("touchPanZoomInitGap", undefined);
          setState("touchPanZoomInitScale", undefined);
        });
      };
      let onWheel = (e: WheelEvent) => {
        if (e.deltaY > 0) {
          zoomByFactor(1.0 / 1.1);
        } else if (e.deltaY < 0) {
          zoomByFactor(1.1 / 1.0);
        }
      };
      let onPointerDown = (e: PointerEvent) => {
        e.preventDefault();
        let svg2 = svg();
        if (svg2 == undefined) {
          return;
        }
        svg2.setPointerCapture(e.pointerId);
        let rect = svg2.getBoundingClientRect();
        let id = e.pointerId;
        let pos = Vec2.create(e.clientX - rect.left, e.clientY - rect.top);
        let newTouches = [...state.touches, { id, pos }];
        batch(() => {
          setState("touches", newTouches);
          setState("mousePos", newTouches[0].pos);
        });
        startTouchPanZoom();
        if (newTouches.length == 1) {
          mode().dragStart?.();
        }
      };
      let onPointerUp = (e: PointerEvent) => {
        e.preventDefault();
        let svg2 = svg();
        if (svg2 == undefined) {
          return;
        }
        svg2.releasePointerCapture(e.pointerId);
        let id = e.pointerId;
        let newTouches = state.touches.filter(({ id: id2 }) => id2 != id);
        stopTouchPanZoom();
        if (newTouches.length == 0) {
          mode().dragEnd?.();
          onClick();
        }
        batch(() => {
          setState("touches", newTouches);
          if (e.pointerType != "mouse") {
            setState(
              "mousePos",
              newTouches.length != 0 ? newTouches[0].pos : undefined,
            );
          }
        });
        if (newTouches.length != 0) {
          startTouchPanZoom();
        }
      };
      let onPointerCanceled = (e: PointerEvent) => {
        onPointerUp(e);
      };
      let onPointerMove = (e: PointerEvent) => {
        e.preventDefault();
        let svg2 = svg();
        if (svg2 == undefined) {
          return;
        }
        let rect = svg2.getBoundingClientRect();
        let id = e.pointerId;
        let touchIdx = state.touches.findIndex(({ id: id2 }) => id2 == id);
        let pos = Vec2.create(e.clientX - rect.left, e.clientY - rect.top);
        if (touchIdx != -1) {
          setState("touches", touchIdx, "pos", () => {
            return pos;
          });
        }
        if (touchIdx == 0 || touchIdx == -1) {
          setState("mousePos", pos);
        }
      };
      let onPointerLeave = (e: PointerEvent) => {
        e.preventDefault();
        if (state.touches.length == 0) {
          setState("mousePos", undefined);
        }
      };
      let onClick = () => {
        mode().click?.();
      };
      let onKeyDown = (e: KeyboardEvent) => {
        if (e.key == "Escape") {
          idle();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      onCleanup(() => {
        document.removeEventListener("keydown", onKeyDown);
      });
      //
      let transform = createMemo(
        () =>
          `scale(${this.state.scale}) translate(${-this.state.pan.x} ${-this.state.pan.y})`,
      );
      return (
        <div
          style={mergeProps<[JSX.CSSProperties, JSX.CSSProperties]>(
            props.style ?? {},
            {
              display: "flex",
              "flex-direction": "column",
            },
          )}
        >
          <div>
            <Show when={props.onBurger}>
              {(onBurger) => (
                <button
                  class="btn"
                  style="font-size: 20pt;"
                  onClick={() => onBurger()()}
                >
                  <i class="fa-solid fa-burger"></i>
                </button>
              )}
            </Show>
            <button
              class="btn"
              style="font-size: 20pt;"
              disabled={!this.undoManager.canUndo()}
              onClick={() => this.undoManager.undo()}
            >
              <i class="fa-solid fa-rotate-left"></i>
            </button>
            <button
              class="btn"
              style="font-size: 20pt;"
              disabled={!this.undoManager.canRedo()}
              onClick={() => this.undoManager.redo()}
            >
              <i class="fa-solid fa-rotate-right"></i>
            </button>
            <button
              class="btn"
              style="position: relative;"
              onClick={() => makeFrame()}
            >
              {(() => {
                let s = 0.5;
                return (
                  <>
                    <i
                      class="fa-regular fa-square"
                      style={{
                        "font-size": `${40 * s}pt`,
                      }}
                    />
                    <i
                      class="fa-solid fa-tree"
                      style={{
                        position: "absolute",
                        left: `50%`,
                        top: `50%`,
                        "-webkit-transform": "translate(-50%, -50%)",
                        transform: "translate(-50%, -50%)",
                        "font-size": `${24 * s}pt`,
                      }}
                    />
                  </>
                );
              })()}
            </button>
            <button
              class="btn"
              onClick={() => {
                setState(
                  "overlayApp",
                  new NoTrack({
                    Title: () => "Auto Frames",
                    View: () => (
                      <Show when={image()} keyed>
                        {(image) => (
                          <ImageToTilesetCreator
                            world={state.world}
                            image={image}
                            overwriteImage={(newImage) => {
                              // TODO: save over the current image in automerge
                              setImage(newImage);
                            }}
                          />
                        )}
                      </Show>
                    ),
                  }),
                );
              }}
            >
              Auto Frames
            </button>
          </div>
          <div
            style={{
              "flex-grow": "1",
              display: "flex",
              "flex-direction": "column",
              position: "relative",
            }}
          >
            <svg
              ref={setSvg}
              style={{
                "flex-grow": "1",
                "background-color": "#DDD",
                "background-image":
                  "linear-gradient(45deg, #FFFFFF 25%, transparent 25%), linear-gradient(-45deg, #FFFFFF 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #FFFFFF 75%), linear-gradient(-45deg, transparent 75%, #FFFFFF 75%)",
                "background-size": "20px 20px",
                "background-position": "0 0, 0 10px, 10px -10px, -10px 0px",
                "touch-action": "none",
              }}
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCanceled}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              onContextMenu={(e) => {
                e.preventDefault();
                return false;
              }}
            >
              <g transform={transform()}>
                <Show when={this.size()}>
                  {(size) => (
                    <Show when={this.image()}>
                      {(image) => (
                        <foreignObject width={size().x} height={size().y}>
                          {image()}
                        </foreignObject>
                      )}
                    </Show>
                  )}
                </Show>
                <renderSystem.Render />
              </g>
              <renderSystem.RenderOverlay />
              <OverlaySvgUI />
            </svg>
            <OverlayHtmlUI />
            <div
              style={{
                position: "absolute",
                left: "0",
                top: "0",
                "background-color": "rgba(0,0,0,0.8)",
              }}
            >
              <Show when={state.autoSaving}>
                Saving...
                <br />
              </Show>
              <Instructions />
            </div>
          </div>
          <Show when={state.overlayApp?.value} keyed={true}>
            {(overlayApp) => (
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  bottom: "0",
                  right: "0",
                  display: "flex",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    "flex-grow": "1",
                    margin: "5%",
                    display: "flex",
                    "flex-direction": "column",
                    overflow: "hidden",
                  }}
                  class="bg-base-200 rounded-box"
                >
                  <div
                    style={{
                      display: "flex",
                      "flex-direction": "row",
                      padding: "10px",
                    }}
                    class="bg-base-300 rounded-box"
                  >
                    <div
                      style={{
                        "flex-grow": "1",
                        display: "flex",
                        "flex-direction": "row",
                        "align-items": "center",
                        overflow: "hidden",
                      }}
                    >
                      <overlayApp.Title />
                    </div>
                    <button
                      class="btn btn-primary"
                      onClick={() => setState("overlayApp", undefined)}
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div
                    style={{
                      "flex-grow": "1",
                      display: "flex",
                      padding: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <overlayApp.View />
                  </div>
                </div>
              </div>
            )}
          </Show>
        </div>
      );
    };
  }
}
