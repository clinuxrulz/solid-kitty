import { createMemo } from "solid-js/types/server/reactive.js";
import { levelRefComponentType } from "../components/LevelRefComponent";
import { EcsWorld } from "../ecs/EcsWorld";
import { createComputed, mapArray, on } from "solid-js";
import { createGetLevelsFolder } from "../lib";
import { EcsWorldAutomergeProjection } from "../ecs/EcsWorldAutomergeProjection";
import { registry } from "../level-builder/components/registry";
import { levelComponentType } from "../level-builder/components/LevelComponent";

export class CollisionSystem {
    constructor(params: {
        world: EcsWorld,
    }) {
        let world = params.world;
        let levelsFolder = createGetLevelsFolder();
        createComputed(on(
            levelsFolder,
            (levelsFolder) => {
                if (levelsFolder.type != "Success") {
                    return;
                }
                let levelsFolder2 = levelsFolder.value;
                let levelRefEntities = () => world.entitiesWithComponentType(levelRefComponentType);
                createComputed(mapArray(
                    levelRefEntities,
                    (levelRefEntity) => {
                        let levelRef = world.getComponent(levelRefEntity, levelRefComponentType)?.state;
                        if (levelRef == undefined) {
                            return;
                        }
                        let levelFileId = createMemo(() => {
                            for (let entry of levelsFolder2.contents) {
                                if (entry.name == levelRef.levelFilename && entry.type == "File") {
                                    return entry.id;
                                }
                            }
                            return undefined;
                        });
                        createComputed(on(
                            levelFileId,
                            (levelFileId) => {
                                if (levelFileId == undefined) {
                                    return;
                                }
                                let levelFile = levelsFolder2.openFileById(levelFileId);
                                createComputed(on(
                                    levelFile,
                                    (levelFile) => {
                                        if (levelFile.type != "Success") {
                                            return;
                                        }
                                        let levelFile2 = levelFile.value;
                                        let r = EcsWorldAutomergeProjection.create(
                                            registry,
                                            levelFile2.docHandle,
                                        );
                                        if (r.type == "Err") {
                                            return;
                                        }
                                        let levelWorld = r.value;
                                        createComputed(mapArray(
                                            () => levelWorld.entitiesWithComponentType(levelComponentType),
                                            (levelEntity) => createComputed(() => {
                                                let levelComponent = levelWorld.getComponent(levelEntity, levelComponentType);
                                                if (levelComponent == undefined) {
                                                    return;
                                                }
                                                let levelComponent2 = levelComponent;
                                                let levelState = levelComponent2.state;
                                                // TODO: Scan level cells for collision against characters
                                            })
                                        ));
                                    },
                                ));
                            },
                        ));
                    },
                ));
            },
        ));
    }
}
