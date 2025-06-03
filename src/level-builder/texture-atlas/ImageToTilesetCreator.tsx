import { Accessor, batch, Component, createComputed, createMemo, For, Match, onCleanup, Show, Switch, untrack } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import { TextureAtlasState } from "../components/TextureAtlasComponent";
import { frameComponentType, FrameState } from "../components/FrameComponent";
import { h32 } from "xxhashjs";
import { NoTrack } from "../../util";
import { LevelState } from "../components/LevelComponent";
import { EcsComponent } from "../../ecs/EcsComponent";
import { EcsWorld, Vec2 } from "../../lib";
import { IEcsWorld } from "../../ecs/IEcsWorld";

const ImageToTilesetCreator: Component<{
  /**
   * The texture atlas ecs world
   */
  world: IEcsWorld,
  /**
   * The image being used by the texture atlas
   */
  image: HTMLImageElement,
}> = (props) => {
  let [state, setState,] = createStore<{
    offsetXText: string,
    offsetYText: string,
    tileWidthText: string,
    tileHeightText: string,
  }>({
    offsetXText: "0",
    offsetYText: "0",
    tileWidthText: "16",
    tileHeightText: "16",
  });
  let offsetX = createMemo(() => {
    let value = Number.parseFloat(state.offsetXText);
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return value;
  });
  let offsetY = createMemo(() => {
    let value = Number.parseFloat(state.offsetYText);
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return value;
  });
  let tileWidth = createMemo(() => {
    let value = Number.parseFloat(state.tileWidthText);
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return value;
  });
  let tileHeight = createMemo(() => {
    let value = Number.parseFloat(state.tileHeightText);
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return value;
  });
  let _hashTileBuffer: Uint8Array | undefined = undefined;
  let _hashTileBuffer2: ArrayBuffer | undefined = undefined;
  let hashTile = (
    imageData: Uint8ClampedArray<ArrayBufferLike>,
    imageWidth: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    let srcOffset = (y * imageWidth + x) << 2;
    if (_hashTileBuffer == undefined || _hashTileBuffer2 == undefined || _hashTileBuffer.length != ((w * h) << 2)) {
      _hashTileBuffer2 = new ArrayBuffer((w * h) << 2);
      _hashTileBuffer = new Uint8Array(_hashTileBuffer2);
    }
    let dstOffset = 0;
    for (let i = 0; i < h; ++i, srcOffset += (imageWidth << 2)) {
      let srcOffset2 = srcOffset;
      for (let j = 0; j < w; ++j, srcOffset2 += 4, dstOffset += 4) {
        _hashTileBuffer[dstOffset] = imageData[srcOffset2];
        _hashTileBuffer[dstOffset+1] = imageData[srcOffset2+1];
        _hashTileBuffer[dstOffset+2] = imageData[srcOffset2+2];
        _hashTileBuffer[dstOffset+3] = imageData[srcOffset2+3];
      }
    }
    return h32(_hashTileBuffer2, 0);
  };
  let hasTileByHashSet = new Set<string>();
  let performMatch = () => {
    let image = props.image;
    let offsetX2 = offsetX();
    if (offsetX2 == undefined) {
      return;
    }
    let offsetY2 = offsetY();
    if (offsetY2 == undefined) {
      return;
    }
    let tileWidth2 = tileWidth();
    if (tileWidth2 == undefined) {
      return;
    }
    let tileHeight2 = tileHeight();
    if (tileHeight2 == undefined) {
      return;
    }
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    if (ctx == null) {
      return;
    }
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let imageData2 = imageData.data;
    //
    let yIdx = 0;
    let atY = offsetY2;
    while (atY + tileHeight2 <= canvas.height) {
      let xIdx = 0;
      let atX = offsetX2;
      while (atX + tileWidth2 <= canvas.width) {
        let hash = hashTile(
          imageData2,
          canvas.width,
          atX,
          atY,
          tileWidth2,
          tileHeight2,
        );
        let hash2 = hash.toString();
        if (!hasTileByHashSet.has(hash2)) {
          hasTileByHashSet.add(hash2);
          props.world.createEntity([
            frameComponentType.create({
              name: "frame",
              pos: Vec2.create(atX, atY),
              size: Vec2.create(tileWidth2, tileHeight2),
              numCells: Vec2.create(1, 1),
              metaData: null,
            }),
          ]);
        }
        ++xIdx;
        atX += tileWidth2;
      }
      ++yIdx;
      atY += tileHeight2;
    }
  };
  return (
    <div
      style="width: 100%; height: 100%; overflow: auto;"
    >
      <div>
        <label class="input w-fit">
          <span class="label">Offset X:</span>
          <input
            type="text"
            value={state.offsetXText}
            onInput={(e) => {
              setState("offsetXText", e.currentTarget.value);
            }}
            size={4}
          />
        </label>
        <label class="input w-fit">
          <span class="label">Offset Y:</span>
          <input
            type="text"
            value={state.offsetYText}
            onInput={(e) => {
              setState("offsetYText", e.currentTarget.value);
            }}
            size={4}
          />
        </label>
        <label class="input w-fit">
          <span class="label">Tile Width:</span>
          <input
            type="text"
            value={state.tileWidthText}
            onInput={(e) => {
              setState("tileWidthText", e.currentTarget.value);
            }}
            size={4}
          />
        </label>
        <label class="input w-fit">
          <span class="label">Tile Height:</span>
          <input
            type="text"
            value={state.tileHeightText}
            onInput={(e) => {
              setState("tileHeightText", e.currentTarget.value);
            }}
            size={4}
          />
        </label>
        <br/>
        <button
          class="btn"
          onClick={() => performMatch()}
        >
          Find Unique Tiles
        </button>
      </div>
    </div>
  );
};

export default ImageToTilesetCreator;
