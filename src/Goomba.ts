import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { ActorBase, IsActor, IsAnimated } from "./Actor";
import { Accessor, createMemo } from "solid-js";
import { Kitty } from "./Kitty";
import { SQUASH_SOUND } from "./sound-effect-ids";

type GoombaState = {
    isFlat: boolean,
};

export class Goomba implements
    IsActor,
    IsAnimated
{
    state: Store<GoombaState>;
    setState: SetStoreFunction<GoombaState>;
    actor: ActorBase;
    flipX = () => false;
    animation: Accessor<string>;

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
        let [ state, setState ] = createStore<GoombaState>({
            isFlat: false,
        });
        this.state = state;
        this.setState = setState;
        this.actor = new ActorBase({
            spawnHome: params.spawnHome,
            initPos: params.initPos,
        });
        this.animation = createMemo(() => {
            if (state.isFlat) {
                return "goomba_flat";
            } else {
                return "goomba_walking";
            }
        });
    }

    update(params: { leftPressed: boolean; rightPressed: boolean; jumpPressed: boolean; onGround: boolean; playSoundEffect: (soundId: number) => void; }): void {
        this.actor.update(params);
        if (this.state.isFlat) {
            this.actor.setState("vel", "x", 0);
            return;
        }
        this.actor.setState("vel", "x", -1);
    }

    onCollide(params: {
        other: IsActor,
        playSoundEffect: (soundId: number) => void,
    }): void {
        if (!this.state.isFlat) {
            if (params.other instanceof Kitty) {
                this.setState("isFlat", true);
                params.playSoundEffect(SQUASH_SOUND);
            }
        }
    }
}
