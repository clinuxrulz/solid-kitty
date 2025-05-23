import { levelRefComponentType } from "../components/LevelRefComponent";
import { EcsWorld } from "../ecs/EcsWorld";
import { createMemo, on, onCleanup } from "solid-js";
import { Complex, createGetLevelsFolder, spriteComponentType, Transform2D, transform2DComponentType, Vec2 } from "../lib";
import { EcsWorldAutomergeProjection } from "../ecs/EcsWorldAutomergeProjection";
import { registry } from "../level-builder/components/registry";
import { levelComponentType } from "../level-builder/components/LevelComponent";
import { Cont } from "../Cont";
import { tileCollisionComponentType } from "../components/TileCollisionComponent";

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
      .then(({ levelWorld, levelEntity }) => Cont.liftCC(() =>
        levelWorld.getComponent(levelEntity, levelComponentType)?.state
      ))
      .filterNonNullable()
      .map((x) => ({ level: x, }))
      .then(({ level, }) => {
        let shortIdToTextureAtlasAndFrameIdMap = new Map<number,{
          textureAtlasFilename: string,
          frameId: string,
        }>();
        for (let { textureAtlasRef, frames, } of level.tileToShortIdTable) {
          for (let { frameId, shortId, } of frames) {
            shortIdToTextureAtlasAndFrameIdMap.set(
              shortId,
              {
                textureAtlasFilename: textureAtlasRef,
                frameId,
              }
            );
          }
        }
        return Cont
          .liftCCMA(() => world.entitiesWithComponentType(spriteComponentType))
          .then((spriteEntity) => Cont.liftCC(() => {
            let sprite = world.getComponent(spriteEntity, spriteComponentType)?.state;
            if (sprite == undefined) {
              return undefined;
            }
            let transform = world.getComponent(spriteEntity, transform2DComponentType)?.state.transform ?? Transform2D.identity;
            return {
              spriteEntity,
              sprite,
              transform,
            };
          }))
          .filterNonNullable()
          .map(({ spriteEntity, sprite, transform, }) => ({
            level,
            shortIdToTextureAtlasAndFrameIdMap,
            spriteEntity,
            sprite,
            spriteTransform: transform,
          }));
      })
      .then(({
          level,
          shortIdToTextureAtlasAndFrameIdMap,
          spriteEntity,
          sprite,
          spriteTransform,
      }) => Cont.liftCC(() => {
        const spritePos = spriteTransform.origin;
        const tileWidth = 16*3;
        const tileHeight = 16*3;
        const minXIdx = Math.floor(spritePos.x / tileWidth);
        const minYIdx = Math.floor(spritePos.y / tileHeight);
        // just rough it for now
        const maxXIdx = minXIdx;
        const maxYIdx = minYIdx;
        // TODO:
        for (let i = minYIdx; i <= maxYIdx; ++i) {
          let row = level.mapData[i];
          if (row == undefined) {
            continue;
          }
          for (let j = minXIdx; j <= maxXIdx; ++j) {
            let cell = row[j];
            if (cell == undefined) {
              continue;
            }
            let data = shortIdToTextureAtlasAndFrameIdMap.get(cell);
            if (data == undefined) {
              continue;
            }
            let collisionId = world.createEntity([
              transform2DComponentType.create({
                transform: Transform2D.create(
                  Vec2.create(
                    j * tileWidth - spritePos.x,
                    i * tileHeight - spritePos.y,
                  ),
                  Complex.rot0,
                )
              }),
              tileCollisionComponentType.create({
                textureAtlasFilename: data.textureAtlasFilename,
                frameName: data.frameId,
                width: tileWidth,
                height: tileHeight,
              }),
            ]);
            world.attachToParent(collisionId, spriteEntity);
            onCleanup(() => {
              world.detactFromParent(collisionId);
              world.destroyEntity(collisionId);
            });
          }
        }
      }))
      .run();
  }
}
