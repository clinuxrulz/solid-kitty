import { Result } from "./Result";
import ChiptunesProcessorUrl from './chiptunes-processor?worker&url';

export class Chiptunes {
    private node: AudioWorkletNode;
    private call: <R>(params: object) => Promise<Result<R>>;

    static async init(): Promise<Chiptunes> {
        const audioContext = new AudioContext();
        await audioContext.audioWorklet.addModule(ChiptunesProcessorUrl);
        const chiptunesNode = new AudioWorkletNode(
            audioContext,
            "chiptunes-processor",
        );
        chiptunesNode.connect(audioContext.destination);
        return new Chiptunes(chiptunesNode);
    }

    private constructor(node: AudioWorkletNode) {
        this.node = node;
        //
        let nextCallbackId = 0;
        let callbacks = new Map<number,(r: Result<any>)=>void>();
        let call = <R>(
            message: object,
        ): Promise<Result<R>> => {
            let callbackId = nextCallbackId++;
            return new Promise((resolve) => {
                callbacks.set(callbackId, resolve);
                this.node.port.postMessage({ callbackId, message, });
            });
        }
        this.node.port.addEventListener("message", (e) => {
            callbacks.get(e.data.callbackId)!(e.data.result);
            callbacks.delete(e.data.callbackId);
        });
        this.call = call;
    }

    load(musicData: ArrayBuffer): Promise<Result<{ emu: number, subtuneCount: number, }>> {
        return this.call({
            "type": "load",
            "musicData": musicData,
        });
    }

    play(emu: number, subtune: number): Promise<{}> {
        return this.call({
            "type": "play",
            "emu": emu,
            "subtune": subtune,
        });
    }
}

