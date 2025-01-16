import { Accessor, createMemo } from "solid-js";
import { ActorBase, IsActor, IsAnimated } from "./Actor";
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { JUMP_SOUND } from "./sound-effect-ids";

type KittyState = {
    facing: "Left" | "Right",
    onGround: boolean,
    lastJumpPressed: boolean,
    jumpHeld: boolean,
    remainingJumpHeldFrames: number,
};

const GRAVITY = 1;
const MAX_HOLD_JUMP_FRAMES = 20;

export class Kitty implements
    IsActor,
    IsAnimated
{
    state: Store<KittyState>;
    setState: SetStoreFunction<KittyState>;
    actor: ActorBase;
    flipX: Accessor<boolean>;
    animation: Accessor<string>;

    constructor(params: {
        initPos?: {
            x: number,
            y: number,
        },
        initVel?: {
            x: number,
            y: number,
        },
    }) {
        let [ state, setState ] = createStore<KittyState>({
            facing: "Right",
            onGround: false,
            lastJumpPressed: false,
            jumpHeld: false,
            remainingJumpHeldFrames: 0,
        });
        this.state = state;
        this.setState = setState;
        this.actor = new ActorBase({
            initPos: params.initPos,
            initVel: params.initVel,
        });
        this.flipX = createMemo(() => state.facing == "Left");
        this.animation = createMemo(() => {
            if (this.state.onGround) {
                if (this.actor.state.vel.x != 0.0) {
                    return "kitty_running";
                } else {
                    return "kitty_stand";
                }
            } else {
                if (this.actor.state.vel.y < 0.0) {
                    return "kitty_jump";
                } else {
                    return "kitty_drop";
                }
            }
        });
    }

    update(params: {
        leftPressed: boolean,
        rightPressed: boolean,
        jumpPressed: boolean,
        onGround: boolean,
        playSoundEffect: (soundId: number) => void,
    }) {
        this.setState("onGround", params.onGround);
        let accelX = 0.0;
        if (params.leftPressed) {
            accelX -= 1.0;
        }
        if (params.rightPressed) {
            accelX += 1.0;
        }
        if (accelX < 0.0) {
            this.setState("facing", "Left");
        } else if (accelX > 0.0) {
            this.setState("facing", "Right");
        }
        if (params.jumpPressed && !this.state.lastJumpPressed && params.onGround) {
            params.playSoundEffect(JUMP_SOUND);
            this.actor.setState("vel", "y", -10);
            this.setState("jumpHeld", true);
            this.setState("remainingJumpHeldFrames", MAX_HOLD_JUMP_FRAMES);
        } else if (params.jumpPressed && this.state.jumpHeld && this.state.remainingJumpHeldFrames != 0) {
            this.actor.setState("vel", "y", -10);
            this.setState("remainingJumpHeldFrames", (x) => x - 1);
        } else if (!params.onGround) {
            this.setState("jumpHeld", false);
        }
        if (!this.state.onGround && !this.state.jumpHeld) {
            this.actor.setState("acc", "y", (ay) => ay + GRAVITY);
        }
        this.actor.setState("acc", "x", (ax) => ax + accelX);
        // friction
        this.actor.setState("vel", "x", (vx) => {
            let vx2 = 0.90 * vx;
            if (this.actor.state.acc.x == 0.0 && Math.abs(vx2) < 1) {
                vx2 = 0.0;
            }
            return vx2;
        });
        this.setState("lastJumpPressed", params.jumpPressed);
    }

    onCollide(params: {
        other: IsActor,
        playSoundEffect: (soundId: number) => void,
    }): void {
    }
}
