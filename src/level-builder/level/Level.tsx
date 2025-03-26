import {
    Accessor,
    batch,
    Component,
    createComputed,
    createEffect,
    createMemo,
    createSignal,
    JSX,
    mapArray,
    mergeProps,
    on,
    onCleanup,
    Show,
} from "solid-js";
import { AsyncResult } from "../../AsyncResult";
import { VirtualFileSystem } from "../VirtualFileSystem";
import { createStore } from "solid-js/store";
import { EcsWorld } from "../../ecs/EcsWorld";
import { UndoManager, UndoUnit } from "../../pixel-editor/UndoManager";
import { Vec2 } from "../../Vec2";
import { PickingSystem } from "./systems/PickingSystem";
import { ModeParams } from "./ModeParams";
import { Mode } from "./Mode";
import { RenderSystem } from "./systems/RenderSystem";
import { IdleMode } from "./modes/IdleMode";
import { RenderParams } from "./RenderParams";
import { registry } from "../components/registry";
import { TextureAtlasState } from "../components/TextureAtlasComponent";
import { FrameState } from "../components/FrameComponent";
import { InsertTileMode } from "./modes/InsertTileMode";
import { levelComponentType, LevelState } from "../components/LevelComponent";
import { EcsComponent } from "../../ecs/EcsComponent";
import { ReactiveVirtualFileSystem } from "../../ReactiveVirtualFileSystem";
import { AutomergeVirtualFileSystem } from "../../AutomergeVirtualFileSystem";
import { EcsWorldAutomergeProjection } from "../../ecs/EcsWorldAutomergeProjection";
import { IEcsWorld } from "../../ecs/IEcsWorld";

const AUTO_SAVE_TIMEOUT = 2000;

export class Level {
    readonly Render: Component<{
        style?: JSX.CSSProperties;
        onBurger?: () => void;
    }>;

    constructor(params: {
        vfs: AutomergeVirtualFileSystem;
        imagesFolderId: Accessor<AsyncResult<string>>;
        textureAtlasesFolderId: Accessor<AsyncResult<string>>;
        levelFileId: Accessor<string | undefined>;
        textureAtlasWithImageAndFramesList: Accessor<
            AsyncResult<
                {
                    textureAtlasFilename: string;
                    textureAtlas: TextureAtlasState;
                    image: HTMLImageElement;
                    frames: { frameId: string, frame: FrameState, }[];
                }[]
            >
        >;
    }) {
        // Short name
        let textureAtlases = params.textureAtlasWithImageAndFramesList;
        //
        let tileWidth: Accessor<number> = () => 50;
        let tileHeight: Accessor<number> = () => 50;
        //
        let [state, setState] = createStore<{
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
        }>({
            mousePos: undefined,
            pan: Vec2.create(-1, -1),
            scale: 30.0,
            touches: [],
            isTouchPanZoom: false,
            touchPanZoomFrom: undefined,
            touchPanZoomInitScale: undefined,
            touchPanZoomInitGap: undefined,
            autoSaving: false,
            mkMode: undefined,
            world: new EcsWorld(),
        });
        let undoManager = new UndoManager();
        createEffect(
            on([params.levelFileId], () => {
                let levelFileId = params.levelFileId();
                if (levelFileId == undefined) {
                    setState("world", new EcsWorld());
                    return;
                }
                let levelFileId2 = levelFileId;
                let levelData = params.vfs.readFile(levelFileId2);
                createEffect(async () => {
                    let levelData2 = levelData();
                    if (levelData2.type != "Success") {
                        return;
                    }
                    let levelData3 = levelData2.value;
                    let r = EcsWorldAutomergeProjection.create(
                        registry,
                        levelData3,
                    );
                    if (r.type == "Err") {
                        return;
                    }
                    let world = r.value;
                    setState("world", world);
                });
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
            return screenPt
                .clone()
                .multScalar(1.0 / state.scale)
                .add(state.pan);
        };
        let worldPtToScreenPt = (worldPt: Vec2): Vec2 | undefined => {
            return worldPt.clone().sub(state.pan).multScalar(state.scale);
        };
        //
        let levelComponent: Accessor<EcsComponent<LevelState> | undefined>;
        {
            let levelEntities = createMemo(() =>
                state.world.entitiesWithComponentType(levelComponentType),
            );
            levelComponent = createMemo(() => {
                let levelEntities2 = levelEntities();
                if (levelEntities2.length != 1) {
                    return undefined;
                }
                let levelEntity = levelEntities2[0];
                return state.world.getComponent(
                    levelEntity,
                    levelComponentType,
                );
            });
        }
        let level = createMemo(() => levelComponent()?.state);
        let tileIndexToFrameMap = createMemo(() => {
            let level2 = level();
            if (level2 == undefined) {
                return undefined;
            }
            let result = new Map<
                number,
                { textureAtlasRef: string; frameRef: string }
            >();
            for (let { textureAtlasRef, frames } of level2.tileToShortIdTable) {
                for (let frame of frames) {
                    result.set(frame.shortId, {
                        textureAtlasRef,
                        frameRef: frame.frameId,
                    });
                }
            }
            return result;
        });
        let maxTileIndex = createMemo(() => {
            let tileIndexToFrameMap2 = tileIndexToFrameMap();
            if (tileIndexToFrameMap2 == undefined) {
                return 0;
            }
            let maxTileIndex = 0;
            for (let tileIndex of tileIndexToFrameMap2.keys()) {
                maxTileIndex = Math.max(maxTileIndex, tileIndex);
            }
            return maxTileIndex;
        });
        let frameToTileIndexSep = "/";
        let frameToTileIndexMap = createMemo(() => {
            let level2 = level();
            if (level2 == undefined) {
                return undefined;
            }
            let result = new Map<string, number>();
            for (let { textureAtlasRef, frames } of level2.tileToShortIdTable) {
                for (let frame of frames) {
                    result.set(
                        textureAtlasRef + frameToTileIndexSep + frame.frameId,
                        frame.shortId,
                    );
                }
            }
            return result;
        });
        let frameToTileIndexOrCreate = (params: {
            textureAtlasRef: string;
            frameRef: string;
        }) => {
            let frameToTileIndexMap2 = frameToTileIndexMap();
            if (frameToTileIndexMap2 == undefined) {
                return undefined;
            }
            let r = frameToTileIndexMap2.get(
                params.textureAtlasRef + frameToTileIndexSep + params.frameRef,
            );
            if (r != undefined) {
                return r;
            }
            let maxIndex = maxTileIndex();
            let newIndex = maxIndex + 1;
            let levelComponent2 = levelComponent();
            if (levelComponent2 == undefined) {
                return undefined;
            }
            let idx1 = levelComponent2.state.tileToShortIdTable.findIndex(
                (x) => x.textureAtlasRef == params.textureAtlasRef,
            );
            if (idx1 == -1) {
                levelComponent2.setState("tileToShortIdTable", (x) => [
                    ...x,
                    {
                        textureAtlasRef: params.textureAtlasRef,
                        frames: [
                            {
                                frameId: params.frameRef,
                                shortId: newIndex,
                            },
                        ],
                    },
                ]);
            } else {
                levelComponent2.setState("tileToShortIdTable", idx1, "frames", [
                    ...levelComponent2.state.tileToShortIdTable[idx1].frames,
                    {
                        frameId: params.frameRef,
                        shortId: newIndex,
                    },
                ]);
            }
            return newIndex;
        };
        let writeTile = (params: {
            xIdx: number;
            yIdx: number;
            textureAtlasRef: string;
            frameRef: string;
        }) => {
            let xIdx = params.xIdx;
            let yIdx = params.yIdx;
            let textureAtlasRef = params.textureAtlasRef;
            let frameRef = params.frameRef;
            let levelComponent2 = levelComponent();
            if (levelComponent2 == undefined) {
                return undefined;
            }
            let level2 = level();
            if (level2 == undefined) {
                return undefined;
            }
            if (yIdx < 0 || yIdx >= level2.mapData.length) {
                return;
            }
            let row = level2.mapData[yIdx];
            if (xIdx < 0 || xIdx >= row.length) {
                return;
            }
            let tileIndex = frameToTileIndexOrCreate({
                textureAtlasRef,
                frameRef,
            });
            if (tileIndex == undefined) {
                return;
            }
            levelComponent2.setState("mapData", yIdx, xIdx, tileIndex);
        };
        //
        let renderParams: RenderParams = {
            worldPtToScreenPt,
            textureAtlases,
            tileWidth,
            tileHeight,
            level,
            tileIndexToFrameMap,
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
            tileWidth,
            tileHeight,
            level,
            writeTile,
            pickingSystem,
            textureAtlases,
            onDone: () => idle(),
            setMode,
        };
        let idle = () => {
            setMode(() => new IdleMode({ modeParams }));
        };
        const insertTile = () => {
            setMode(() => new InsertTileMode(modeParams));
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
        let Instructions = () => <>{mode().instructions?.({})}</>;
        let OverlaySvgUI = () => <>{mode().overlaySvgUI?.({})}</>;
        let OverlayHtmlUI = () => <>{mode().overlayHtmlUI?.({})}</>;
        let disableOneFingerPan = createMemo(
            () => mode().disableOneFingerPan?.() ?? false,
        );
        let zoomByFactor = (factor: number) => {
            if (state.mousePos == undefined) {
                return;
            }
            let pt = screenPtToWorldPt(state.mousePos);
            if (pt == undefined) {
                return;
            }
            let newScale = state.scale * factor;
            let newPan = pt
                .clone()
                .sub(state.mousePos.clone().multScalar(1.0 / newScale));
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
                        gap = state.touches[1].pos
                            .clone()
                            .sub(state.touches[0].pos)
                            .length();
                    }
                    let delta = state.touchPanZoomFrom.clone().sub(pt);
                    let initScale = state.touchPanZoomInitScale;
                    batch(() => {
                        setState("pan", (pan) => pan.clone().add(delta));
                        if (
                            state.touchPanZoomInitGap != undefined &&
                            gap != undefined
                        ) {
                            let newScale =
                                (initScale * gap) / state.touchPanZoomInitGap;
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
                initGap = state.touches[1].pos
                    .clone()
                    .sub(state.touches[0].pos)
                    .length();
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
                setState("touches", touchIdx, "pos", (oldPos) => {
                    oldPos.dispose();
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
                `scale(${state.scale}) translate(${-state.pan.x} ${-state.pan.y})`,
        );
        this.Render = (props) => {
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
                            disabled={!undoManager.canUndo()}
                            onClick={() => undoManager.undo()}
                        >
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>
                        <button
                            class="btn"
                            style="font-size: 20pt;"
                            disabled={!undoManager.canRedo()}
                            onClick={() => undoManager.redo()}
                        >
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                        <button
                            class="btn"
                            style="position: relative;"
                            onClick={() => insertTile()}
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
                                                "-webkit-transform":
                                                    "translate(-50%, -50%)",
                                                transform:
                                                    "translate(-50%, -50%)",
                                                "font-size": `${24 * s}pt`,
                                            }}
                                        />
                                    </>
                                );
                            })()}
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
                                "background-color": "#FFF",
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
                                <renderSystem.Render />
                            </g>
                            <renderSystem.RenderOverlay />
                            <OverlaySvgUI />
                        </svg>
                        {<OverlayHtmlUI />}
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
                </div>
            );
        };
    }
}
