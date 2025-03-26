import { v4 as uuid } from "uuid";
import { Doc, DocHandle, DocHandleChangePayload, Patch } from "@automerge/automerge-repo";
import { IsEcsComponentType, IsEcsComponent, EcsComponentType, EcsComponent } from "./EcsComponent";
import { EcsWorld } from "./EcsWorld";
import { IEcsWorld } from "./IEcsWorld";
import { EcsRegistry } from "./EcsRegistry";
import { err, ok, Result } from "../kitty-demo/Result";
import { produce } from "solid-js/store";
import { loadFromJsonViaTypeSchema, saveToJsonViaTypeSchema, TypeSchema } from "../TypeSchema";
import { Accessor, batch, Component, createComputed, createMemo, createRoot, mapArray, on, onCleanup, untrack } from "solid-js";
import { makeDocumentProjection } from "automerge-repo-solid-primitives";

export class EcsWorldAutomergeProjection implements IEcsWorld {
    private world: EcsWorld;
    private docHandle: DocHandle<any>;
    private doc: Doc<any>;
    private keepAliveMap = new Map<string,()=>void>();

    constructor(world: EcsWorld, docHandle: DocHandle<any>, doc: Doc<any>) {
        this.world = world;
        this.docHandle = docHandle;
        this.doc = doc;
        onCleanup(() => {
            this.keepAliveMap.values().forEach((c) => c());
        });
    }

    static create(registry: EcsRegistry, docHandle: DocHandle<any>): Result<EcsWorldAutomergeProjection> {
        let world = EcsWorld.fromJson(registry, docHandle.doc());
        if (world.type  == "Err") {
            return world;
        }
        let world2 = world.value;
        /*
        let onPatch = (payload: DocHandleChangePayload<any>) => {
            doPatchWorld(docHandle, registry, world2, payload);
        };
        let onDelete = () => {
            doDeleteWorld(world2);
        };
        docHandle.on("change", onPatch);
        docHandle.on("delete", onDelete);
        onCleanup(() => {
            docHandle.off("change", onPatch);
            docHandle.off("delete", onDelete);
        });*/
        let doc = makeDocumentProjection(docHandle);
        doPatchWorldV2(registry, docHandle, doc, world2);
        return ok(new EcsWorldAutomergeProjection(world2, docHandle, doc));
    }

    entities(): string[] {
        return this.world.entities();
    }

    entitiesWithComponentType(componentType: IsEcsComponentType): string[] {
        return this.world.entitiesWithComponentType(componentType);
    }

    createEntityWithId(entityId: string, components: IsEcsComponent[]): void {
        this.docHandle.change((doc) => {
            let components2: { [t: string]: any } = {};
            for (let component of components) {
                let component2 = component as EcsComponent<object>;
                let component3 =
                    saveToJsonViaTypeSchema(
                        component2.type.typeSchema,
                        component2.state
                    );
                components2[component2.type.typeName] = component3;
            }
            doc[entityId] = components2;
        });
        for (let component of components) {
            let component2 = component as EcsComponent<object>;
            let key = entityId + "_" + component.type.typeName;
            let dispose = createRoot((dispose) => {
                let componentJson = createMemo(() =>
                    saveToJsonViaTypeSchema(
                        component2.type.typeSchema,
                        component2.state,
                    )
                );
                createComputed(on(
                    componentJson,
                    (componentJson2) => {
                        this.docHandle.change((doc) => {
                            doc[entityId][component2.type.typeName] = componentJson2;
                        });
                    },
                    { defer: true, },
                ));
                let docCompState = createMemo(
                    () => {
                        try {
                            let json = this.doc[entityId][component2.type.typeName];
                            let jsonString = JSON.stringify(json);
                            let r = loadFromJsonViaTypeSchema<object>(component2.type.typeSchema, json);
                            if (r.type == "Err") {
                                return undefined;
                            }
                            return { state: r.value, jsonString, };
                        } catch {
                            return undefined;
                        }
                    },
                    undefined,
                    {
                        equals: (a, b) => a?.jsonString == b?.jsonString
                    }
                );
                createComputed(on(
                    docCompState,
                    (state) => {
                        if (state == undefined) {
                            return;
                        }
                        component2.setState(state.state);
                    },
                    { defer: true, }
                ));
                return dispose;
            });
            this.keepAliveMap.set(key, dispose);
        }
    }

    createEntity(components: IsEcsComponent[]): string {
        let id = uuid();
        this.createEntityWithId(id, components);
        return id;
    }

    destroyEntity(entityId: string): void {
        this.docHandle.change((doc) => {
            delete doc[entityId];
        });
    }

    getComponent<A extends object>(entityId: string, componentType: EcsComponentType<A>): EcsComponent<A> | undefined {
        return this.world.getComponent(entityId, componentType);
    }

    getComponents(entityId: string): IsEcsComponent[] {
        return this.world.getComponents(entityId);
    }

    unsetComponent(entityId: string, componentType: IsEcsComponentType): void {
        this.docHandle.change((doc) => {
            let entity = doc[entityId];
            if (entity == undefined) {
                return;
            }
            delete entity[componentType.typeName];
        });
    }

    unsetComponents(entityId: string, componentTypes: IsEcsComponentType[]): void {
        this.docHandle.change((doc) => {
            let entity = doc[entityId];
            if (entity == undefined) {
                return;
            }
            for (let componentType of componentTypes) {
                delete entity[componentType.typeName];
            }
        });
    }
}

function doPatchWorldV2(
    registry: EcsRegistry,
    docHandle: DocHandle<any>,
    doc: Doc<any>,
    world: EcsWorld,
) {
    let entities = createMemo(() => Object.keys(doc));
    createComputed(mapArray(
        entities,
        (entity) => {
            onCleanup(() => {
                world.destroyEntity(entity);
            });
            let componentTypeNames = createMemo(() => Object.keys(doc[entity]));
            let components_ = createMemo(mapArray(
                componentTypeNames,
                (componentTypeName) => {
                    let componentType = registry.componentTypeMap.get(componentTypeName);
                    if (componentType == undefined) {
                        return err(`Component type ${componentTypeName} not found`);
                    }
                    let componentType2 = componentType as EcsComponentType<object>;
                    let component = componentType2.createJsonProjection(
                        createMemo(() => doc[entity][componentTypeName]),
                        (x: any) => docHandle.change((doc2) => doc2[entity][componentTypeName] = x),
                    );
                    return ok(component);
                },
            ));
            let components = createMemo(() => {
                return components_()
                    .flatMap((tmp2) => {
                        if (tmp2.type == "Err") {
                            return [];
                        }
                        let tmp3 = tmp2.value();
                        if (tmp3.type == "Err") {
                            return [];
                        }
                        return [tmp3.value];
                    });
            });
            let lastComponents = untrack(components);
            world.createEntityWithId(entity, lastComponents);
            createComputed(on(
                components,
                (components2) => {
                    let removed: EcsComponent<object>[] = [];
                    let added: EcsComponent<object>[] = [];
                    for (let component of components2) {
                        let has = false;
                        for (let component2 of lastComponents) {
                            if (component == component2) {
                                has = true;
                                break;
                            }
                        }
                        if (!has) {
                            added.push(component);
                        }
                    }
                    for (let component of lastComponents) {
                        let has = false;
                        for (let component2 of components2) {
                            if (component == component2) {
                                has = true;
                                break;
                            }
                        }
                        if (!has) {
                            removed.push(component);
                        }
                    }
                    lastComponents = components2;
                    if (added.length != 0) {
                        world.setComponents(entity, added);
                    }
                    if (removed.length != 0) {
                        world.unsetComponents(entity, removed.map((x) => x.type));
                    }
                },
                { defer: true, }
            ));
        },
    ));
}

function doPatchWorld(
    docHandle: DocHandle<any>,
    registry: EcsRegistry,
    world: EcsWorld,
    payload: DocHandleChangePayload<any>,
) {
    let goDeeper = (patch: Patch) => {
        // could be deleting a entity or a component, go deeper
        let entityId = patch.path[0];
        if (typeof entityId != "string") {
            throw new Error("Expected string for entity id");
        }
        doPatchEntity(docHandle, registry, world, entityId, patch);
    };
    batch(() => {
        for (let patch of payload.patches) {
            switch (patch.action) {
                case "conflict":
                case "inc":
                case "mark":
                case "unmark":
                    throw new Error(
                        `Unsupported automerge patch: ${patch.action}`,
                    );
                case "del": {
                    if (patch.path.length == 0) {
                        // deleting the world
                        doDeleteWorld(world);
                    } else {
                        // could be deleting a entity or a component, go deeper
                        goDeeper(patch);
                    }
                    break;
                }
                case "insert": {
                    if (patch.path.length == 0) {
                        // insert a whole new world
                        if (patch.values.length != 1) {
                            throw new Error(
                                "Expected just one world when inserting a whole new world",
                            );
                        }
                        let value = patch.values[0];
                        let world2 = EcsWorld.fromJson(registry, value);
                        if (world2.type == "Err") {
                            throw new Error(world2.message);
                        }
                        let world3 = world2.value;
                        for (let entity of world3.entities()) {
                            let components = world3.getComponents(entity);
                            world.createEntityWithId(entity, components);
                        }
                    } else {
                        // go deeper
                        goDeeper(patch);
                    }
                    break;
                }
                case "splice": {
                    if (patch.path.length == 0) {
                        throw new Error(
                            "splice does not make sense at top world level",
                        );
                    } else {
                        // go deeper
                        goDeeper(patch);
                    }
                    break;
                }
                case "put": {
                    if (patch.path.length == 0) {
                        let value = patch.value;
                        let world2 = EcsWorld.fromJson(registry, value);
                        if (world2.type == "Err") {
                            throw new Error(world2.message);
                        }
                        let world3 = world2.value;
                        for (let entity of world3.entities()) {
                            let components = world3.getComponents(entity);
                            world.createEntityWithId(entity, components);
                        }
                    } else {
                        // go deeper
                        goDeeper(patch);
                    }
                    break;
                }
            }
        }
    });
}

function doDeleteWorld(world: EcsWorld) {
    batch(() => {
        let entities = world.entities();
        for (let entity of entities) {
            world.destroyEntity(entity);
        }
    });
}

function doPatchEntity(
    docHandle: DocHandle<any>,
    registry: EcsRegistry,
    world: EcsWorld,
    entityId: string,
    patch: Patch,
) {
    if (patch.path.length < 1) {
        throw new Error("unreachable");
    }
    let goDeeper = () => {
        let componentTypeName = patch.path[1];
        if (typeof componentTypeName != "string") {
            throw new Error("expected a string for a component type name");
        }
        doPatchComponent(
            docHandle,
            registry,
            world,
            entityId,
            componentTypeName,
            patch,
        );
    };
    switch (patch.action) {
        case "conflict":
        case "inc":
        case "mark":
        case "unmark":
            throw new Error("unreachable");
        case "del": {
            if (patch.path.length == 1) {
                // deleting this entity
                world.destroyEntity(entityId);
            } else {
                // go deeper
                goDeeper();
            }
            break;
        }
        case "insert": {
            if (patch.path.length == 1) {
                // inserting this entity
                let components: IsEcsComponent[] = [];
                if (patch.values.length != 1) {
                    throw new Error("Only one component set per entity");
                }
                let obj = patch.values[0];
                if (typeof obj != "object") {
                    throw new Error("Expected object");
                }
                let obj2 = obj as object;
                for (let componentTypeName of Object.keys(obj2)) {
                    let componentType =
                        registry.componentTypeMap.get(componentTypeName);
                    if (componentType == undefined) {
                        throw new Error(
                            `component type ${componentTypeName} not found`,
                        );
                    }
                    let componentType2 =
                        componentType as EcsComponentType<object>;
                    let val = (obj2 as any)[componentTypeName];
                    let component = loadFromJsonViaTypeSchema<object>(
                        componentType2.typeSchema,
                        val,
                    );
                    if (component.type == "Err") {
                        throw new Error(component.message);
                    }
                    let component2 = component.value;
                    let component3 = componentType2.create(component2);
                    components.push(component3);
                }
                world.createEntityWithId(entityId, components);
            } else {
                // go deeper
                goDeeper();
            }
            break;
        }
        case "splice": {
            if (patch.path.length == 1) {
                throw new Error("splice does not make sense at entity level");
            } else {
                // go deeper
                goDeeper();
            }
            break;
        }
        case "put": {
            if (patch.path.length == 1) {
                let components: IsEcsComponent[] = [];
                let obj = patch.value;
                if (typeof obj != "object") {
                    throw new Error("Expected object");
                }
                let obj2 = obj as object;
                for (let componentTypeName of Object.keys(obj2)) {
                    let componentType =
                        registry.componentTypeMap.get(componentTypeName);
                    if (componentType == undefined) {
                        throw new Error(
                            `component type ${componentTypeName} not found`,
                        );
                    }
                    let componentType2 =
                        componentType as EcsComponentType<object>;
                    let val = (obj2 as any)[componentTypeName];
                    let component = loadFromJsonViaTypeSchema<object>(
                        componentType2.typeSchema,
                        val,
                    );
                    if (component.type == "Err") {
                        throw new Error(component.message);
                    }
                    let component2 = component.value;
                    let component3 = componentType2.create(component2);
                    components.push(component3);
                }
                world.createEntityWithId(entityId, components);
            } else {
                // go deeper
                goDeeper();
            }
            break;
        }
    }
}

function doPatchComponent(
    docHandle: DocHandle<any>,
    registry: EcsRegistry,
    world: EcsWorld,
    entityId: string,
    componentTypeName: string,
    patch: Patch,
) {
    if (patch.path.length < 2) {
        throw new Error("unreachable");
    }
    let goDeeper = () => {
        let fieldName = patch.path[3];
        if (typeof fieldName != "string") {
            throw new Error("Expected a string for a field name");
        }
        let componentType = registry.componentTypeMap.get(componentTypeName);
        if (componentType == undefined) {
            throw new Error(`component type ${componentTypeName} not found`);
        }
        let componentType2 = componentType as EcsComponentType<object>;
        let component = world.getComponent(entityId, componentType2);
        if (component == undefined) {
            throw new Error(`component of type ${componentTypeName} not found`);
        }
        doPatchProperty(
            docHandle,
            registry,
            world,
            entityId,
            componentTypeName,
            componentType2.typeSchema,
            component,
            fieldName,
            patch,
        );
    };
    switch (patch.action) {
        case "conflict":
        case "inc":
        case "mark":
        case "unmark":
            throw new Error("unreachable");
        case "del": {
            if (patch.path.length == 2) {
                // delete this component
                let componentType =
                    registry.componentTypeMap.get(componentTypeName);
                if (componentType == undefined) {
                    throw new Error(
                        `component type ${componentTypeName} not found`,
                    );
                }
                world.unsetComponent(entityId, componentType);
            } else {
                // go deeper
                goDeeper();
            }
            break;
        }
        case "insert": {
            if (patch.path.length == 2) {
                // insert this component
                if (patch.values.length != 1) {
                    throw new Error(
                        "can only be one component of a given type",
                    );
                }
                let obj = patch.values[0] as object;
                if (typeof obj != "object") {
                    return;
                }
                let componentType =
                    registry.componentTypeMap.get(componentTypeName);
                if (componentType == undefined) {
                    throw new Error(
                        `component type ${componentTypeName} not found`,
                    );
                }
                let componentType2 = componentType as EcsComponentType<object>;
                let component = loadFromJsonViaTypeSchema<object>(
                    componentType2.typeSchema,
                    obj,
                );
                if (component.type == "Err") {
                    throw new Error(component.message);
                }
                let component2 = component.value;
                let component3 = componentType2.create(component2);
                world.setComponent(entityId, component3);
            } else {
                // go deeper
                goDeeper();
            }
            // TODO
            break;
        }
        case "splice": {
            if (patch.path.length == 2) {
                throw new Error("splice does not make sense here");
            } else {
                // go deeper
                goDeeper();
            }
            break;
        }
        case "put": {
            if (patch.path.length == 2) {
                // insert this component
                let obj = patch.value;
                if (typeof obj != "object") {
                    return;
                }
                let componentType =
                    registry.componentTypeMap.get(componentTypeName);
                if (componentType == undefined) {
                    throw new Error(
                        `component type ${componentTypeName} not found`,
                    );
                }
                let componentType2 = componentType as EcsComponentType<object>;
                let component = loadFromJsonViaTypeSchema<object>(
                    componentType2.typeSchema,
                    obj,
                );
                if (component.type == "Err") {
                    throw new Error(component.message);
                }
                let component2 = component.value;
                let component3 = componentType2.create(component2);
                world.setComponent(entityId, component3);
            } else {
                goDeeper();
            }
            break;
        }
    }
}

function doPatchProperty(
    docHandle: DocHandle<any>,
    registry: EcsRegistry,
    world: EcsWorld,
    entityId: string,
    componentTypeName: string,
    typeSchema: TypeSchema<object>,
    component: EcsComponent<object>,
    fieldName: string,
    patch: Patch,
) {
    if (patch.path.length < 3) {
        throw new Error("unreachable");
    }
    if (typeSchema.type != "Object") {
        throw new Error(
            "all components are meant to have an object based TypeSchema",
        );
    }
    // shortcut (getting lazy)
    let componentData = loadFromJsonViaTypeSchema<object>(
        typeSchema,
        (docHandle as any)[entityId][componentTypeName],
    );
    if (componentData.type == "Err") {
        throw new Error(componentData.message);
    }
    let componentData2 = componentData.value;
    component.setState(
        produce((x) => {
            for (let key of Object.keys(componentData2)) {
                (x as any)[key] = (componentData2 as any)[key];
            }
        }),
    );
}
