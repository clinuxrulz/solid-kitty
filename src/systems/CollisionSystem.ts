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
    Cont.ofCC(
      createMemo(
        on(levelsFolder, (levelsFolder) => {
          if (levelsFolder.type != "Success") {
            return [];
          }
          let levelsFolder2 = levelsFolder.value;
          let levelRefEntities = () =>
            world.entitiesWithComponentType(levelRefComponentType);
          return [
            {
              levelsFolder: levelsFolder2,
              levelRefEntities,
            },
          ];
        }),
      ),
    )
      .thenContCCCC(({ levelsFolder, levelRefEntities }) =>
        createMemo(
          mapArray(levelRefEntities, (levelRefEntity) =>
            createMemo(() => {
              let levelRef = world.getComponent(
                levelRefEntity,
                levelRefComponentType,
              )?.state;
              if (levelRef == undefined) {
                return [];
              }
              let levelFileId = createMemo(() => {
                for (let entry of levelsFolder.contents) {
                  if (
                    entry.name == levelRef.levelFilename &&
                    entry.type == "File"
                  ) {
                    return entry.id;
                  }
                }
                return undefined;
              });
              return [
                {
                  levelsFolder,
                  levelFileId,
                },
              ];
            }),
          ),
        ),
      )
      .thenContCC(({ levelsFolder, levelFileId }) =>
        createMemo(() => {
          let levelFileId2 = levelFileId();
          if (levelFileId2 == undefined) {
            return [];
          }
          return [
            {
              levelFile: levelsFolder.openFileById(levelFileId2),
            },
          ];
        }),
      )
      .thenContCC(({ levelFile }) =>
        createMemo(
          on(levelFile, (levelFile) => {
            if (levelFile.type != "Success") {
              return [];
            }
            let levelFile2 = levelFile.value;
            let r = EcsWorldAutomergeProjection.create(
              registry,
              levelFile2.docHandle,
            );
            if (r.type == "Err") {
              return [];
            }
            let levelWorld = r.value;
            let levelEntities = () =>
              levelWorld.entitiesWithComponentType(levelComponentType);
            return [
              {
                levelWorld,
                levelEntities,
              },
            ];
          }),
        ),
      )
      .thenCont<void>(({ levelWorld, levelEntities }) => {
        createComputed(
          mapArray(levelEntities, (levelEntity) => {
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
          }),
        );
      })
      .run();
  }
}
