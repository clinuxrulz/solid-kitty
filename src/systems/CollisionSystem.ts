import { createMemo } from "solid-js/types/server/reactive.js";
import { levelRefComponentType } from "../components/LevelRefComponent";
import { EcsWorld } from "../ecs/EcsWorld";
import { createComputed, mapArray, on } from "solid-js";
import { createGetLevelsFolder } from "../lib";
import { EcsWorldAutomergeProjection } from "../ecs/EcsWorldAutomergeProjection";
import { registry } from "../level-builder/components/registry";
import { levelComponentType } from "../level-builder/components/LevelComponent";
import { Cont } from "../Cont";

export class CollisionSystem {
  constructor(params: { world: EcsWorld }) {
    let world = params.world;
    let levelsFolder = createGetLevelsFolder();
    Cont.liftCC(
      on(levelsFolder, (levelsFolder) => {
        if (levelsFolder.type != "Success") {
          return undefined;
        }
        let levelsFolder2 = levelsFolder.value;
        let levelRefEntities = () =>
          world.entitiesWithComponentType(levelRefComponentType);
        return {
          levelsFolder: levelsFolder2,
          levelRefEntities,
        };
      }),
    )
      .filterNonNullable()
      .then(({ levelsFolder, levelRefEntities }) =>
        Cont.liftCCMA(levelRefEntities)
          .map(
            (levelRefEntity) =>
              world.getComponent(levelRefEntity, levelRefComponentType)?.state,
          )
          .filterNonNullable()
          .map((levelRef) =>
            createMemo(() => {
              for (let entry of levelsFolder.contents) {
                if (
                  entry.name == levelRef.levelFilename &&
                  entry.type == "File"
                ) {
                  return entry.id;
                }
              }
              return undefined;
            }),
          )
          .map((levelFileId) => ({
            levelsFolder,
            levelFileId,
          })),
      )
      .then(({ levelsFolder, levelFileId }) =>
        Cont.liftCC(() => {
          let levelFileId2 = levelFileId();
          if (levelFileId2 == undefined) {
            return undefined;
          }
          return {
            levelFile: levelsFolder.openFileById(levelFileId2),
          };
        }),
      )
      .filterNonNullable()
      .then(({ levelFile }) =>
        Cont.liftCC(
          on(levelFile, (levelFile) => {
            if (levelFile.type != "Success") {
              return undefined;
            }
            let levelFile2 = levelFile.value;
            let r = EcsWorldAutomergeProjection.create(
              registry,
              levelFile2.docHandle,
            );
            if (r.type == "Err") {
              return undefined;
            }
            let levelWorld = r.value;
            let levelEntities = () =>
              levelWorld.entitiesWithComponentType(levelComponentType);
            return {
              levelWorld,
              levelEntities,
            };
          }),
        ),
      )
      .filterNonNullable()
      .then(({ levelWorld, levelEntities }) =>
        Cont.liftCCMA(levelEntities).map((levelEntity) => ({
          levelWorld,
          levelEntity,
        })),
      )
      .run(({ levelWorld, levelEntity }) => {
        let levelComponent = levelWorld.getComponent(
          levelEntity,
          levelComponentType,
        );
        if (levelComponent == undefined) {
          return;
        }
        let levelComponent2 = levelComponent;
        let levelState = levelComponent2.state;
        // TODO: Scan level cells for collision against characters
      });
  }
}
