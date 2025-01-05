import { Kitty } from "./Kitty";
import { IsActor } from "./Actor";
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { Level, level1 } from "./Level";
import { untrack } from "solid-js";

type WorldState = {
    camera: {
        pos: {
            x: number,
            y: number,
        },
    },
    actors: IsActor[],
    level: Level,
};

export class World {
    state: Store<WorldState>;
    setState: SetStoreFunction<WorldState>;

    constructor() {
        let kitty = new Kitty({
            initPos: {
                x: 100.0,
                y: 210.0,
            },
        });
        let [ state, setState, ] = createStore<WorldState>({
            camera: {
                pos: {
                    x: untrack(() => kitty.actor.state.pos.x - 100),
                    y: untrack(() => kitty.actor.state.pos.y - 300),
                },
            },
            actors: [ kitty ],
            level: new Level(level1),
        });
        this.state = state;
        this.setState = setState;
    }

    update(params: {
        windowSize: {
            width: number,
            height: number,
        },
        leftPressed: boolean,
        rightPressed: boolean,
        jumpPressed: boolean,
    }) {
        { // drag camera if kitty gets close to edges
            let minScreenX = params.windowSize.width / 3;
            let maxScreenX = params.windowSize.width * 2 / 3;
            let minScreenY = params.windowSize.height / 3;
            let maxScreenY = params.windowSize.height * 2 / 3;
            for (let i = 0; i < this.state.actors.length; ++i) {
                let actor = this.state.actors[i];
                if (actor instanceof Kitty) {
                    let actor2 = actor.actor.state;
                    let kittyScreenX = actor2.pos.x - this.state.camera.pos.x;
                    let kittyScreenY = actor2.pos.y - this.state.camera.pos.y;
                    if (kittyScreenX < minScreenX) {
                        this.setState("camera", "pos", "x", (x) => x + kittyScreenX - minScreenX);
                    } else if (kittyScreenX > maxScreenX) {
                        this.setState("camera", "pos", "x", (x) => x + kittyScreenX - maxScreenX);
                    }
                    if (kittyScreenY < minScreenY) {
                        this.setState("camera", "pos", "y", (y) => y + kittyScreenY - minScreenY);
                    } else if (kittyScreenY > maxScreenY) {
                        this.setState("camera", "pos", "y", (y) => y + kittyScreenY - maxScreenY);
                    }
                }
            }
        }
        for (let actor of this.state.actors) {
            actor.actor.setState("acc", "x", 0.0);
            actor.actor.setState("acc", "y", 0.0);
        }
        for (let i = 0; i < this.state.actors.length; ++i) {
            let actor = this.state.actors[i];
            // check if actor on ground
            let onGround = false;
            {
                let actor2 = actor.actor.state;
                const RENDER_BLOCK_WIDTH = 16*3;
                const RENDER_BLOCK_HEIGHT = 16*3;
                const ACTOR_WIDTH = 24;
                const ACTOR_HEIGHT = 24;
                let minX = actor2.pos.x;
                let minY = actor2.pos.y;
                let maxX = minX + ACTOR_WIDTH;
                let maxY = minY + ACTOR_HEIGHT;
                let minXIdx = Math.floor(minX / RENDER_BLOCK_WIDTH);
                let maxXIdx = Math.ceil(maxX / RENDER_BLOCK_WIDTH);
                let maxYIdx = Math.ceil((maxY + 1) / RENDER_BLOCK_HEIGHT);
                let yIdx = maxYIdx;
                for (let xIdx = minXIdx; xIdx <= maxXIdx; ++xIdx) {
                    if (this.state.level.readBlock(xIdx, yIdx) == "G") {
                        onGround = true;
                        break;
                    }
                }
            }
            //
            if (actor instanceof Kitty) {
                actor.update({
                    leftPressed: params.leftPressed,
                    rightPressed: params.rightPressed,
                    jumpPressed: params.jumpPressed,
                    onGround,
                });
            }
        }
        for (let actor of this.state.actors) {
            let oldX = actor.actor.state.pos.x;
            let oldY = actor.actor.state.pos.y;
            let actor2 = actor.actor.state;
            let vx = actor2.vel.x + actor2.acc.x;
            let vy = actor2.vel.y + actor2.acc.y;
            if (Math.abs(vx) > actor2.maxVel.x) {
                vx = Math.sign(vx) * actor2.maxVel.x;
            }
            if (Math.abs(vy) > actor2.maxVel.y) {
                vy = Math.sign(vy) * actor2.maxVel.y;
            }
            let x = actor.actor.state.pos.x + vx;
            let y = actor.actor.state.pos.y + vy;
            actor.actor.setState("vel", "x", vx);
            actor.actor.setState("vel", "y", vy);
            actor.actor.setState("pos", "x", x);
            actor.actor.setState("pos", "y", y);
            { // check if actor hit block
                let actor2 = actor.actor.state;
                const RENDER_BLOCK_WIDTH = 16*3;
                const RENDER_BLOCK_HEIGHT = 16*3;
                const ACTOR_WIDTH = 24;
                const ACTOR_HEIGHT = 24;
                let minX = actor2.pos.x;
                let minY = actor2.pos.y;
                let maxX = minX + ACTOR_WIDTH;
                let maxY = minY + ACTOR_HEIGHT;
                let minXIdx = Math.floor(minX / RENDER_BLOCK_WIDTH);
                let minYIdx = Math.floor(minY / RENDER_BLOCK_HEIGHT);
                let maxXIdx = Math.ceil(maxX / RENDER_BLOCK_WIDTH);
                let maxYIdx = Math.ceil(maxY / RENDER_BLOCK_HEIGHT);
                let originalPosX = actor.actor.state.pos.x;
                let originalPosY = actor.actor.state.pos.y;
                for (let yIdx = minYIdx; yIdx <= maxYIdx; ++yIdx) {
                    for (let xIdx = minXIdx; xIdx <= maxXIdx; ++xIdx) {
                        let cell = this.state.level.readBlock(xIdx, yIdx);
                        let leftCell = this.state.level.readBlock(xIdx - 1, yIdx);
                        let rightCell = this.state.level.readBlock(xIdx + 1, yIdx);
                        let topCell = this.state.level.readBlock(xIdx, yIdx-1);
                        let bottomCell = this.state.level.readBlock(xIdx, yIdx+1);
                        if (cell == "G") {
                            let blockLeft = xIdx * RENDER_BLOCK_WIDTH;
                            let blockRight = blockLeft + RENDER_BLOCK_WIDTH;
                            let blockTop = yIdx * RENDER_BLOCK_HEIGHT;
                            let blockBottom = blockTop + RENDER_BLOCK_HEIGHT;
                            if (
                                leftCell != "G" &&
                                actor2.pos.x + 24*3 - blockLeft < 20
                            ) {
                                actor.actor.setState("pos", "x", blockLeft - 24*3);
                                actor.actor.setState("vel", "x", 0);
                            } else if (
                                rightCell != "G" &&
                                blockRight - actor2.pos.x < 20
                            ) {
                                actor.actor.setState("pos", "x", blockRight);
                                actor.actor.setState("vel", "x", 0);
                            } else if (
                                topCell != "G" &&
                                originalPosY + 24*3 - blockTop < 20
                            ) {
                                console.log(actor2.pos.y + 24*3 - blockTop);
                                actor.actor.setState("pos", "y", blockTop - 24*3);
                                actor.actor.setState("vel", "y", 0);
                            } else if (
                                bottomCell != "G" &&
                                originalPosY - blockBottom < 20
                            ) {
                                actor.actor.setState("pos", "y", blockBottom);
                                actor.actor.setState("vel", "y", 0);
                                if (actor instanceof Kitty) {
                                    actor.setState("jumpHeld", false);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
