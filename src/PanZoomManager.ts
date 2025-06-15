import { Accessor, batch, createComputed, createMemo, on, untrack } from "solid-js";
import { Vec2 } from "./math/Vec2";
import { createStore } from "solid-js/store";
import { ReactiveMap } from "@solid-primitives/map";

export function createPanZoomManager(params: {
    pan: Accessor<Vec2>,
    setPan: (x: Vec2) => void,
    scale: Accessor<number>,
    setScale: (x: number) => void,
    setPointerCapture: (pointerId: number) => void,
    releasePointerCapture: (pointerId: number) => void,
}): {
    onPointerDown: (e: PointerEvent) => void,
    onPointerUp: (e: PointerEvent) => void,
    onPointerCancel: (e: PointerEvent) => void,
    onPointerMove: (e: PointerEvent) => void,
    onWheel: (e: WheelEvent) => void,
    debugPointers: Accessor<string>,
} {
    let pointersDown = new ReactiveMap<number, Vec2>();
    let pointersDownArray = createMemo(() => {
        let result: { id: number, pos: Vec2, }[] = [];
        for (let [ id, pos, ] of pointersDown.entries()) {
            result.push({ id, pos, });
        }
        result.sort((a, b) => a.id - b.id);
        return result;
    });
    let debugPointers = createMemo(() =>
        pointersDownArray().map((x) => JSON.stringify(x)).join(";")
    );
    { // One Finger Pan
        let hasOnePointerDown = createMemo(() => pointersDownArray().length == 1);
        createComputed(() => {
            if (!hasOnePointerDown()) {
                return;
            }
            let pt = createMemo(() => pointersDownArray()[0].pos);
            let initPan = untrack(() => params.pan());
            let initScale = untrack(() => params.scale());
            let initPt = untrack(() => pt());
            let inverseInitScale = 1.0 / initScale;
            if (!Number.isFinite(inverseInitScale)) {
                return;
            }
            createComputed(on(
                pt,
                (pt) => {
                    params.setPan(initPan.sub(pt.sub(initPt).multScalar(inverseInitScale)));
                },
                { defer: true, },
            ));
        });
    }
    { // Two Finger Pan/Zoom
        let hasTwoPointersDown = createMemo(() => pointersDownArray().length == 2);
        createComputed(() => {
            if (!hasTwoPointersDown()) {
                return;
            }
            let pt1 = createMemo(() => pointersDownArray()[0].pos);
            let pt2 = createMemo(() => pointersDownArray()[1].pos);
            let centre = createMemo(() => pt1().add(pt2()).multScalar(0.5));
            let dist = createMemo(() => pt1().distance(pt2()));
            let initPan = untrack(() => params.pan());
            let initScale = untrack(() => params.scale());
            let initCentre = untrack(() => centre());
            let initDist = untrack(() => dist());
            let initWorldCentre = untrack(() => initCentre.multScalar(1.0 / initScale).add(initPan));
            if (!Number.isFinite(initWorldCentre.x) || !Number.isFinite(initWorldCentre.y)) {
                return;
            }
            createComputed(on(
                [ centre, dist, ],
                ([ centre, dist, ]) => {
                    let newScale = initScale * dist / initDist;
                    let newPan = initWorldCentre.sub(centre.multScalar(1.0 / newScale));
                    batch(() => {
                        if (Number.isFinite(newScale) && Number.isFinite(newPan.x) && Number.isFinite(newPan.y)) {
                            params.setPan(newPan);
                            params.setScale(newScale);
                        }
                    });
                },
                { defer: true, },
            ));
        });
    }
    return {
        onPointerDown(e) {
            pointersDown.set(
                e.pointerId,
                Vec2.create(
                    e.offsetX,
                    e.offsetY,
                ),
            );
        },
        onPointerUp(e) {
            pointersDown.delete(e.pointerId);
            params.releasePointerCapture(e.pointerId);
        },
        onPointerCancel(e) {
            pointersDown.delete(e.pointerId);
            params.releasePointerCapture(e.pointerId);
        },
        onPointerMove(e) {
            if (!pointersDown.has(e.pointerId)) {
                return;
            }
            pointersDown.set(
                e.pointerId,
                Vec2.create(
                    e.offsetX,
                    e.offsetY,
                ),
            );
        },
        onWheel(e) {
            let newScale = params.scale();
            if (e.deltaY > 0) {
                newScale *= 1.1;
            } else if (e.deltaY < 0) {
                newScale /= 1.1;
            }
            params.setScale(newScale);
        },
        debugPointers,
    };
}
