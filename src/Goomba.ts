import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { ActorBase, IsActor, IsAnimated } from "./Actor";
import { Accessor } from "solid-js";

type GoombaState = {};

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
        });
        this.state = state;
        this.setState = setState;
        this.actor = new ActorBase({
            spawnHome: params.spawnHome,
            initPos: params.initPos,
        });
        this.animation = () => "goomba_walking";
    }

    update(params: { leftPressed: boolean; rightPressed: boolean; jumpPressed: boolean; onGround: boolean; playSoundEffect: (soundId: number) => void; }): void {
        this.actor.update(params);
        this.actor.setState("vel", "x", -1);
    }
}
