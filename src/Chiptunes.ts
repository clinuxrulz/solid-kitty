import { err, ok, Result } from "./Result.js";

import bp_url from "./buffer-processor.ts?worker&url";

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

export class Chiptunes {
    private node: AudioWorkletNode;
    private sampleRate: number;
    private onMoreData: ((pool?: ArrayBuffer[]) => {
        channels: ArrayBuffer[],
    }) | undefined;
    
    static async init(): Promise<Chiptunes> {
        const audioContext = new AudioContext();
        await audioContext.audioWorklet.addModule(
            bp_url
        );
        const chiptunesNode = new AudioWorkletNode(
            audioContext,
            "buffer-processor",
            {
                outputChannelCount: [2],
            }
        );
        const volume = audioContext.createGain();
        chiptunesNode.connect(volume);
        volume.gain.setValueAtTime(1.0, audioContext.currentTime);
        volume.connect(audioContext.destination);
        return new Chiptunes(chiptunesNode, audioContext.sampleRate);
    }

    constructor(node: AudioWorkletNode, sampleRate: number) {
        this.node = node;
        this.node.port.onmessage = (e) => {
            if (this.onMoreData != undefined) {
                this.node.port.postMessage(this.onMoreData(e.pool));
            }
        };
        this.sampleRate = sampleRate;
    }

    async load(musicData: ArrayBuffer):
    Promise<Result<{
        emu: number,
        subtuneCount: number,
    }>> {
        let musicData2 = new Uint8Array(musicData);
        let ref = GME.allocate(1, "i32", GME.ALLOC_STATIC);
        if (GME.ccall(
            "gme_open_data",
            "number",
            ["array", "number", "number", "number"],
            [musicData2, musicData2.length, ref, this.sampleRate]
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

    async play(emu: number, subtune: number): Promise<Result<{}>> {
        if (GME.ccall("gme_start_track", "number", ["number", "number"], [emu, subtune]) != 0) {
            return err("Failed.");
        }
        const bufferSize = 1024 * 16;
        const inputs = 2;
        const outputs = 2;
    
        //
        const buffer = GME.allocate(bufferSize * 2, 'i32', GME.ALLOC_STATIC);
    
        const INT32_MAX = Math.pow(2, 32) - 1;

        this.onMoreData = (pool) => {
            let channels: Float32Array[];
            if (pool == undefined) {
                channels = [
                    new Float32Array(bufferSize),
                    new Float32Array(bufferSize),
                ];
            } else {
                channels = pool.map((c) => new FloatArray(c));
            }
            const err = GME.ccall('gme_play', 'number', ['number', 'number', 'number'], [emu, bufferSize * 2, buffer]);
            for (var i = 0; i < bufferSize; i++) {
                for (var n = 0; n < channels.length; n++) {
                    channels[n][i] = GME.getValue(buffer + i * channels.length * 2 + n * 4, 'i32') / INT32_MAX;
                }
            }
            return {
                channels: channels.map((c) => c.buffer),
            };
        };
        this.node.port.postMessage(this.onMoreData());
        return ok({});
    }
}
