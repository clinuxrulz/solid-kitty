import { err, ok, Result } from "./Result";

interface ALLOC_STATIC_TYPE {}

interface GME_Module {
    ALLOC_STATIC: ALLOC_STATIC_TYPE;
    run(): void;
    allocate(a: number, b: "i32", c: ALLOC_STATIC_TYPE): number;
    getValue(a: number, b: "i32"): number;
    ccall(
        a: "gme_open_data",
        b: "number",
        c: ["array", "number", "number", "number"],
        d: [Uint8Array, number, number, number],
    ): number;
    ccall(
        a: "gme_track_count",
        b: "number",
        c: ['number'],
        d: [number],
    ): number;
    ccall(
        a: "gme_ignore_silence",
        b: 'number',
        c: ['number'],
        d: [number, 1]
    ): void;
    ccall(
        a: "gme_start_track",
        b: "number",
        c: ['number', 'number'],
        d: [number, number]
    ): number;
    ccall(
        a: "gme_track_ended",
        b: "number",
        c: ['number'],
        d: [number]
    ): number;
    ccall(
        a: "gme_play",
        b: "number",
        c: ['number', 'number', 'number'],
        d: [number, number, number],
    ): number;
};

let GME: GME_Module;
let oldModule = (globalThis as any)["Module"];
// @ts-ignore
await import("../node_modules/nsf-player/libgme/libgme.js");
GME = (globalThis as any)["Module"];
(globalThis as any)["Module"] = oldModule;

GME.run();

interface AudioWorkletProcessor {
    readonly port: MessagePort;
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean;
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;
    new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

declare function registerProcessor(
    name: string,
    processorCtor: (new (
        options?: AudioWorkletNodeOptions
    ) => AudioWorkletProcessor) /* & {
        parameterDescriptors?: AudioParamDescriptor[];
    }*/
): void;

let onProcess = (outputs: Float32Array[][]) => {};

class ChiptunesProcessor extends AudioWorkletProcessor {
    process(inputs: Float32Array[][], outputs: Float32Array[][], params: Record<string, Float32Array>): boolean {
        return true;
    }
}

registerProcessor("chuptunes-processor", ChiptunesProcessor);

self.addEventListener("message", (e) => {
    let callbackId = e.data.callbackId;
    let message = e.data.message;
    let type = message.tyoe;
    let data = message;
    switch (type) {
        case "load": {
            let musicData = new Uint8Array(data.musicData);
            let sampleRate = data.sampleRate;
            let r = load(musicData, sampleRate);
            self.postMessage(r);
            break;
        }
        case "play": {
            let emu = data.emu;
            let subtune = data.subtune;
            let r = play(emu, subtune);
            self.postMessage(r);
            break;
        }
    }
});

function load(musicData: Uint8Array, sampleRate: number):
Result<{
    emu: number,
    subtuneCount: number,
}> {
    let ref = GME.allocate(1, "i32", GME.ALLOC_STATIC);
    if (GME.ccall(
        "gme_open_data",
        "number",
        ["array", "number", "number", "number"],
        [musicData, musicData.length, ref, sampleRate]
    ) != 0) {
        return err("failed.");
    }
    let emu = GME.getValue(ref, "i32");
    let subtuneCount = GME.ccall("gme_track_count", "number", ["number"], [emu]);
    GME.ccall("gme_ignore_silence", "number", ["number"], [emu, 1]);
    return ok({
        emu,
        subtuneCount,
    });
}

function play(emu: number, subtune: number): Result<{}> {
    if (GME.ccall("gme_start_track", "number", ["number", "number"], [emu, subtune]) != 0) {
        return err("Failed.");
    }
    const bufferSize = 1024 * 16;
    const inputs = 2;
    const outputs = 2;

    //
    const buffer = GME.allocate(bufferSize * 2, 'i32', GME.ALLOC_STATIC);

    const INT32_MAX = Math.pow(2, 32) - 1;

    onProcess = (outputs: Float32Array[][]) => {
      if (GME.ccall('gme_track_ended', 'number', ['number'], [emu]) == 1) {
        onProcess = () => {};
        return;
      }

      const channels = [outputs[0][0], outputs[0][1]];

      const err = GME.ccall('gme_play', 'number', ['number', 'number', 'number'], [emu, bufferSize * 2, buffer]);
      for (var i = 0; i < bufferSize; i++) {
        for (var n = 0; n < channels.length; n++) {
          channels[n][i] = GME.getValue(buffer + i * channels.length * 2 + n * 4, 'i32') / INT32_MAX;
        }
      }
    }
    return ok({});
}

