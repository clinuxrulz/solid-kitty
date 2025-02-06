import { v4 as uuid } from "uuid";
import { ReactiveMap } from "@solid-primitives/map";
import { IsEcsComponent, IsEcsComponentType } from "./EcsComponent";
import { createSignal, Signal } from "solid-js";
import { ReactiveSet } from "@solid-primitives/set";
import { makeRefCountedMakeReactiveObject } from "../util";

export class EcsWorld {
    private entityMap: ReactiveMap<string,Signal<IsEcsComponent[]>>;
    private componentTypeEntitiesMap: ReactiveMap<string,ReactiveSet<string>>;
    private componentTypeEntitiesMap_: Map<string, () => string[]> = new Map();

    constructor() {
        this.entityMap = new ReactiveMap();
        this.componentTypeEntitiesMap = new ReactiveMap();
    }

    entitiesWithComponentType(componentType: IsEcsComponentType): string[] {
        {
            let r = this.componentTypeEntitiesMap_.get(componentType.typeName);
            if (r != undefined) {
                return r();
            }
        }
        let r = makeRefCountedMakeReactiveObject(
            () => {
                let result = this.componentTypeEntitiesMap.get(componentType.typeName);
                if (result == undefined) {
                    return [];
                }
                let result2: string[] = [];
                for (let x of result) {
                    result2.push(x);
                }
                return result2;
            },
            () => {
                this.componentTypeEntitiesMap_.delete(componentType.typeName);
            },
        );
        this.componentTypeEntitiesMap_.set(componentType.typeName, r);
        return r();
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
