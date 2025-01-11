import { err, ok, Result } from "./Result.js";
// @ts-ignore
import initGME from "../libgme/gme.js";

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

interface ALLOC_STATIC_TYPE {}

interface GME_Module {
    ALLOC_STATIC: ALLOC_STATIC_TYPE;
    run(): void;
    _malloc(size: number): number;
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

class ChiptunesProcessor extends AudioWorkletProcessor {
    private GME!: GME_Module;
    private buffer: number = 0;
    private bufferSize: number = 0;
    private channels: Float32Array[] = [];
    private nextChannels: Float32Array[] = [];
    private atFrame: number = 0;
    private onMoreData: () => void = () => {};

    constructor(options?: AudioWorkletNodeOptions) {
        super(options);
        //
        this.port.onmessage = (e) => {
            let callbackId = e.data.callbackId;
            let message = e.data.message;
            let type = message.type;
            let data = message;
            switch (type) {
                case "init": {
                    (async () => {
                        let r = await this.init();
                        this.port.postMessage({
                            callbackId,
                            result: r,
                        });
                    })();
                    break;
                }
                case "load": {
                    let r = this.load(
                        data.musicData,
                        data.sampleRate
                    );
                    this.port.postMessage({
                        callbackId,
                        result: r,
                    });
                    break;
                }
                case "play": {
                    let r = this.play(
                        data.emu,
                        data.subtune,
                    );
                    this.port.postMessage({
                        callbackId,
                        result: r,
                    });
                    break;
                }
            }
        };
    }

    async init(): Promise<Result<{}>> {
        // @ts-ignore
        this.GME = await initGME();
        this.bufferSize = 1024 * 16;
        this.buffer = this.GME._malloc(this.bufferSize * 2 * 4);
        this.channels = [
            new Float32Array(this.bufferSize),
            new Float32Array(this.bufferSize),
        ];
        this.nextChannels = [
            new Float32Array(this.bufferSize),
            new Float32Array(this.bufferSize),
        ];
        return ok({});
    }

    load(musicData: ArrayBuffer, sampleRate: number): Result<{
        emu: number,
        subtuneCount: number,
    }> {
        let musicData2 = new Uint8Array(musicData);
        let ref = this.GME._malloc(4);
        if (this.GME.ccall(
            "gme_open_data",
            "number",
            ["array", "number", "number", "number"],
            [musicData2, musicData2.length, ref, sampleRate]
        ) != 0) {
            return err("failed.");
        }
        let emu = this.GME.getValue(ref, "i32");
        let subtuneCount = this.GME.ccall("gme_track_count", "number", ["number"], [emu]);
        this.GME.ccall("gme_ignore_silence", "number", ["number"], [emu, 1]);
        return ok({
            emu,
            subtuneCount,
        });
    }

    play(emu: number, subtune: number): Result<{}> {
        if (this.GME.ccall("gme_start_track", "number", ["number", "number"], [emu, subtune]) != 0) {
            return err("Failed.");
        }
        const INT32_MAX = Math.pow(2, 32) - 1;
        let onMoreData: () => void = () => {
            if (this.GME.ccall('gme_track_ended', 'number', ['number'], [emu]) == 1) {
                this.onMoreData = () => {};
            }
            const err = this.GME.ccall('gme_play', 'number', ['number', 'number', 'number'], [emu, this.bufferSize * 2, this.buffer]);
            for (var i = 0; i < this.bufferSize; i++) {
                for (var n = 0; n < this.channels.length; n++) {
                    this.channels[n][i] = this.GME.getValue(this.buffer + i * this.channels.length * 2 + n * 4, 'i32') / INT32_MAX;
                }
            }
        };
        this.onMoreData = onMoreData;
        this.onMoreData();
        this.atFrame = 0;
        return ok({});
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        if (this.channels.length == 0) {
            return true;
        }
        let outputs2 = outputs[0];
        for (let i = 0; i < outputs2[0].length; ++i) {
            for (let j = 0; j < this.channels.length; ++j) {
                outputs2[j][i] = this.channels[j][this.atFrame];
            }
            ++this.atFrame;
            if (this.atFrame >= this.channels[0].length) {
                this.atFrame = 0;
                this.onMoreData();
                let tmp = this.nextChannels;
                this.nextChannels = this.channels;
                this.channels = tmp;
            }
        }
        return true;
    }
}

registerProcessor("chiptunes-processor", ChiptunesProcessor);
