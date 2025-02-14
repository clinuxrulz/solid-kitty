import { v4 as uuid } from "uuid";
import { ReactiveMap } from "@solid-primitives/map";
import { EcsComponent, EcsComponentType, IsEcsComponent, IsEcsComponentType } from "./EcsComponent";
import { batch, createSignal, Signal, untrack } from "solid-js";
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

    entities(): string[] {
        return Array.from(this.entityMap.keys());
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
        untrack(() => batch(() => {
            this.entityMap.set(entityId, createSignal(components));
            for (let component of components) {
                let entitySet = this.componentTypeEntitiesMap.get(component.type.typeName);
                if (entitySet == undefined) {
                    entitySet = new ReactiveSet();
                    this.componentTypeEntitiesMap.set(component.type.typeName, entitySet);
                }
                entitySet.add(entityId);
            }
        }));
    }

    createEntity(components: IsEcsComponent[]): string {
        let id = uuid();
        this.createEntityWithId(id, components);
        return id;
    }

    destroyEntity(entityId: string) {
        untrack(() => batch(() => {
            let components = this.entityMap.get(entityId);
            if (components != undefined) {
                for (let component of components[0]()) {
                    let entitySet = this.componentTypeEntitiesMap.get(component.type.typeName);
                    if (entitySet != undefined) {
                        entitySet.delete(entityId);
                    }
                }
            }
            this.entityMap.delete(entityId);
        }));
    }

    getComponent<A extends object>(entityId: string, componentType: EcsComponentType<A>): EcsComponent<A> | undefined {
        let components = this.entityMap.get(entityId)?.[0]?.();
        if (components == undefined) {
            return undefined;
        }
        return components.find((component) => component.type.typeName === componentType.typeName) as (EcsComponent<A> | undefined);
    }

    getComponents(entityId: string): IsEcsComponent[] {
        return this.entityMap.get(entityId)?.[0]?.() ?? [];
    }
}
