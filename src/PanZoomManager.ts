import { Vec2 } from "./math/Vec2";

export function createPanZoomManager(params: {
    pan: () => Vec2,
    setPan: (x: Vec2) => void,
    zoom: () => number,
    setZoom: (x: number) => void
}): {} {
    return {};
};
