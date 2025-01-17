import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { ActorBase, IsActor, IsAnimated } from "./Actor";
import { Accessor, createMemo } from "solid-js";
import { KOOPA_TROOPA_1_HEIGHT, KOOPA_TROOPA_WIDTH } from "./SmSprites";

type KoopaTroopaState = {
    state: "Walking" | "Shell" | "Spinning" | "WakingUp",
    facing: "Left" | "Right",
};

export class KoopaTroopa implements
    IsActor
{
    state: Store<KoopaTroopaState>;
    setState: SetStoreFunction<KoopaTroopaState>;
    actor: ActorBase;
    animated: IsAnimated;

    constructor(params: {
        spawnHome?: {
            xIdx: number,
            yIdx: number,
        },
        initPos?: {
            x: number,
            y: number,
        },
    }) {
        let [ state, setState, ] = createStore<KoopaTroopaState>({
            state: "Walking",
            facing: "Left",
        });
        this.state = state;
        this.setState = setState;
        this.actor = new ActorBase({
            spawnHome: params.spawnHome,
            initPos: params.initPos,
            initSize: {
                x: KOOPA_TROOPA_WIDTH * 5,
                y: KOOPA_TROOPA_1_HEIGHT * 5,
            },
        });
        this.animated = {
            flipX: createMemo(() => state.facing == "Left"),
            animation: createMemo(() => {
                switch (state.state) {
                    case "Walking":
                        return "koopa_troopa_walking";
                    case "Shell":
                        return "koopa_troopa_shell";
                    case "Spinning":
                        return "koopa_troopa_shell_spin";
                    case "WakingUp":
                        return "koopa_troopa_waking_up";
                }
            }),
        };
    }

    update(params: {
        leftPressed: boolean;
        rightPressed: boolean;
        jumpPressed: boolean;
        onGround: boolean;
        playSoundEffect: (soundId: number) => void;
        playBackgroundMusic: (musicId: number) => void;
        removeSelf: () => void;
    }): void {
        this.actor.update(params);
        if (this.state.state == "Walking") {
            let vx = this.state.facing == "Left" ? -1 : 1;
            this.actor.setState("vel", "x", vx);
        }
    }

    onCollide(params: {
        other: IsActor;
        playSoundEffect: (soundId: number) => void;
        playBackgroundMusic: (musicId: number) => void;
    }): void {
        
    }
}
