import { Accessor, Component, createMemo, Match, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { TextureAtlasState } from "../components/TextureAtlasComponent";
import { FrameState } from "../components/FrameComponent";
import { h32 } from "xxhashjs";
import { NoTrack } from "../../util";

const ImageTileMatcher: Component<{
  textureAtlases: {
    textureAtlasFilename: Accessor<string>;
    textureAtlas: TextureAtlasState;
    image: HTMLImageElement;
    frames: {
        frameId: string;
        frame: FrameState;
    }[];
  }[]
}> = (props) => {
  const tabs = [
    "Image" as const,
    "Reconstruction" as const,
  ];
  type Tab = (typeof tabs)[number];
  let [state, setState,] = createStore<{
    image: HTMLImageElement | undefined,
    offsetXText: string,
    offsetYText: string,
    tileWidthText: string,
    tileHeightText: string,
    selectedTab: Tab,
    result: NoTrack<({
      textureAtlasFilename: string,
      frameId: string,
    } | undefined)[][]> | undefined,
  }>({
    image: undefined,
    offsetXText: "0",
    offsetYText: "0",
    tileWidthText: "16",
    tileHeightText: "16",
    selectedTab: "Image",
    result: undefined,
  })
  let fileInput!: HTMLInputElement;
  let loadImage = (file: File) => {
    setState("image", undefined);
    let url = URL.createObjectURL(file);
    let image = new Image();
    image.src = url;
    image.onerror = () => {
      URL.revokeObjectURL(url);
    };
    image.onload = () => {
      URL.revokeObjectURL(url);
      setState("image", image);
    };
  };
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
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j, srcOffset += 4, dstOffset += 4) {
        _hashTileBuffer[dstOffset] = imageData[srcOffset];
        _hashTileBuffer[dstOffset+1] = imageData[srcOffset+1];
        _hashTileBuffer[dstOffset+2] = imageData[srcOffset+2];
        _hashTileBuffer[dstOffset+3] = imageData[srcOffset+3];
      }
    }
    return h32(_hashTileBuffer2, 0);
  };
  let performMatch = () => {
    setState("result", undefined);
    if (state.image == undefined) {
      return;
    }
    let image = state.image;
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
    let hashToTileMap = new Map<string,{
      textureAtlasFilename: string,
      frameId: string,
    }>();
    for (let textureAtlas of props.textureAtlases) {
      let textureAtlasFilename = textureAtlas.textureAtlasFilename();
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      if (ctx == null) {
        return;
      }
      canvas.width = textureAtlas.image.naturalWidth;
      canvas.height = textureAtlas.image.naturalHeight;
      ctx.drawImage(textureAtlas.image, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let imageData2 = imageData.data;
      for (let { frameId, frame, } of textureAtlas.frames) {
        if (frame.size.x != tileWidth2 || frame.size.y != tileHeight2) {
          continue;
        }
        let hash = hashTile(
          imageData2,
          canvas.width,
          frame.pos.x,
          frame.pos.y,
          tileWidth2,
          tileHeight2,
        );
        hashToTileMap.set(
          hash.toString(),
          {
            textureAtlasFilename,
            frameId,
          },
        );
      }
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
    let result: ({
      textureAtlasFilename: string,
      frameId: string,
    } | undefined)[][] = [];
    let yIdx = 0;
    let atY = offsetY2;
    while (atY + tileHeight2 <= canvas.height) {
      let resultRow: ({
        textureAtlasFilename: string,
        frameId: string,
      } | undefined)[] = [];
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
        let tile = hashToTileMap.get(hash.toString());
        resultRow.push(tile);
        ++xIdx;
        atX += tileWidth2;
      }
      result.push(resultRow);
      ++yIdx;
      atY += tileHeight2;
    }
    setState("result", new NoTrack(result));
  };
  return (
    <div
      style="width: 100%; height: 100%; overflow: auto;"
    >
      <div>
        <button
          class="btn"
          onClick={() => fileInput.click()}
        >
          Load Image...
          <input
            ref={fileInput}
            type="file"
            hidden
            onChange={(e) => {
              let files = e.currentTarget.files;
              if (files == null || files.length != 1) {
                return;
              }
              loadImage(files[0]);
              e.currentTarget.value = "";
            }}
          />
        </button>
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
          Perform Match
        </button>
      </div>
      <div role="tablist" class="tabs tabs-box">
        <a
          role="tab"
          classList={{
            "tab": true,
            "tab-active": state.selectedTab == "Image",
          }}
          onClick={() => setState("selectedTab", "Image")}
        >
          Image
        </a>
        <a
          role="tab"
          classList={{
            "tab": true,
            "tab-active": state.selectedTab == "Reconstruction"
          }}
          onClick={() => setState("selectedTab", "Reconstruction")}
        >
          Reconstruction
        </a>
      </div>
      <Switch>
        <Match when={state.selectedTab == "Image"}>
          {state.image}
        </Match>
        <Match when={state.selectedTab == "Reconstruction"}>
          <></>
        </Match>
      </Switch>
    </div>
  );
};

export default ImageTileMatcher;
