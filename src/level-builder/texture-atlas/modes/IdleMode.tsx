import { Accessor, Component, createMemo } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { opToArr } from "../../../kitty-demo/util";
import { createStore } from "solid-js/store";
import { frameComponentType } from "../components/FrameComponent";
import { ResizeHelper } from "./ResizeHelper";
import { Vec2 } from "../../../Vec2";

export class IdleMode implements Mode {
    overlaySvgUI: Component;
    highlightedEntities: Accessor<string[]>;
    selectedEntities: Accessor<string[]>;
    dragStart: () => void;
    dragEnd: () => void;
    click: () => void;
    disableOneFingerPan: Accessor<boolean>;

    constructor(modeParams: ModeParams) {
        let [ state, setState, ] = createStore<{
            selectedEntities: string[],
        }>({
            selectedEntities: [],
        });
        //
        let entityUnderMouse = modeParams.pickingSystem.mkEntityUnderMouse();
        //
        let singleSelectedEntity = createMemo(() => {
            if (state.selectedEntities.length != 1) {
                return undefined;
            }
            return state.selectedEntities[0];
        });
        let resizeHelper = createMemo(() => {
            let entity = singleSelectedEntity();
            if (entity == undefined) {
                return undefined;
            }
            let world = modeParams.world();
            let frame = world.getComponent(entity, frameComponentType);
            if (frame == undefined) {
                return undefined;
            }
            return new ResizeHelper({
                mousePos: modeParams.mousePos,
                screenPtToWorldPt: modeParams.screenPtToWorldPt,
                worldPtToScreenPt: modeParams.worldPtToScreenPt,
                rect: {
                    pos: () => frame.state.pos,
                    size: () => frame.state.size,
                    setPos: (x) =>
                        frame.setState("pos",
                            Vec2.create(
                                Math.round(x.x),
                                Math.round(x.y),
                            ),
                        ),
                    setSize: (x) =>
                        frame.setState("size",
                            Vec2.create(
                                Math.round(x.x),
                                Math.round(x.y),
                            ),
                        ),
                },
            });
        });
        //
        this.overlaySvgUI = () => (<>
            {resizeHelper()?.overlaySvgUI?.({})}
        </>);
        this.highlightedEntities = createMemo(() => opToArr(entityUnderMouse()));
        this.selectedEntities = () => state.selectedEntities;
        this.dragStart = () => {
            return resizeHelper()?.dragStart?.();
        };
        this.dragEnd = () => {
            return resizeHelper()?.dragEnd?.();
        };
        this.click = () => {
            let entity = entityUnderMouse();
            setState("selectedEntities", opToArr(entity));
        };
        this.disableOneFingerPan = createMemo(() => {
            return resizeHelper()?.disableOneFingerPan?.() ?? false;
        });
    }
}
