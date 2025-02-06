import { v4 as uuid } from "uuid";
import { ReactiveMap } from "@solid-primitives/map";
import { IsEcsComponent } from "./EcsComponent";
import { createSignal, Signal } from "solid-js";

export class EcsWorld {
    private entityMap: ReactiveMap<string,Signal<IsEcsComponent[]>>;

    constructor() {
        this.entityMap = new ReactiveMap();
    }

    createEntityWithId(entityId: string, components: IsEcsComponent[]) {
        this.entityMap.set(entityId, createSignal(components));
    }

    createEntity(components: IsEcsComponent[]): string {
        let id = uuid();
        this.createEntityWithId(id, components);
        return id;
    }

    destroyEntity(entityId: string) {
        this.entityMap.delete(entityId);
    }
}
