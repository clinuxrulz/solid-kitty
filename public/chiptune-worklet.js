let ringBuffer = [];
let ringBufferAt = 0;
let ringBufferEnd = 0;

class ChiptuneProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        if (ringBufferAt == ringBufferEnd) {
            self.postMessage("moreDataPlease");
            return true;
        }
        const output = outputs[0];
        for (let i = 0; i < output[0].length; ++i) {
            let data = ringBuffer[ringBufferAt];
            output[0][i] = data[0];
            output[1][i] = data[1];
            ++ringBufferAt;
            if (ringBufferAt >= ringBuffer.length) {
                ringBufferAt = 0;
            }
            if (ringBufferAt == ringBufferEnd) {
                self.postMessage("moreDataPlease");
                return true;
            }
        }
        return true;
    }
}

self.addEventListener("message", (e) => {
    let data = e.data;
    if (data.length > ringBuffer.length) {
        ringBuffer = data;
        ringBufferAt = 0;
    } else if (data.length < ringBuffer.length) {
        ringBufferEnd = (ringBufferAt + data.length) % ringBuffer.length;
    } else {
        for (let i = 0, j = ringBufferAt; i < data.length; ++i) {
            ringBuffer[i][0] = data[i][0];
            ringBuffer[i][1] = data[i][1];
            j++;
            if (j >= ringBuffer.length) {
                j -= ringBuffer.length;
            }
        }
    }
});

registerProcessor("chiptunes-processor", ChiptuneProcessor);
