import { Component, For, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { NoTrack } from "../util";

const AutomergeWebRtcTest: Component = () => {
    let [ state, setState, ] = createStore<{
        iceCandidates: NoTrack<RTCIceCandidate>[],
        connectionEstablished: boolean,
        messages: string[],
    }>({
        iceCandidates: [],
        connectionEstablished: false,
        messages: [],
    });
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration);
    const msgDataChannel = peerConnection.createDataChannel("msg");
    let makeCallAndCopyOffer = async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await navigator.clipboard.writeText(JSON.stringify(offer));
    }
    let pasteOfferAndCopyAnswer = async () => {
        let offer = JSON.parse(await navigator.clipboard.readText());
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        let answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await navigator.clipboard.writeText(JSON.stringify(answer));
    };
    let pasteAnswer = async () => {
        let answer = JSON.parse(await navigator.clipboard.readText());
        await peerConnection.setRemoteDescription(answer);
    };
    let copyIceCandidates = async () => {
        await navigator.clipboard.writeText(JSON.stringify(state.iceCandidates.map((x) => x.value)));
    };
    let pasteIceCandidates = async () => {
        let iceCandidates: RTCIceCandidate[] = JSON.parse(await navigator.clipboard.readText());
        for (let iceCandidate of iceCandidates) {
            try {
                peerConnection.addIceCandidate(iceCandidate);
            } catch (ex) {
                console.error('Error adding received ice candidate', ex);
            }
        }
    };
    peerConnection.addEventListener("icecandidate", (event) => {
        if (event.candidate != null) {
            let candidate = event.candidate;
            setState("iceCandidates", produce((x) => x.push(new NoTrack(candidate))));
        }
    });
    /*
peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
        signalingChannel.send({'new-ice-candidate': event.candidate});
    }
});

// Listen for remote ICE candidates and add them to the local RTCPeerConnection
signalingChannel.addEventListener('message', async message => {
    if (message.iceCandidate) {
        try {
            await peerConnection.addIceCandidate(message.iceCandidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
});    */
    peerConnection.addEventListener("connectionstatechange", (e) => {
        console.log(e);
        if (peerConnection.connectionState == "connected") {
            setState("connectionEstablished", true);
        }
    });
    msgDataChannel.addEventListener("open", (e) => {
        console.log(e);
    });
    msgDataChannel.addEventListener("close", (e) => {
        console.log(e);
    });
    msgDataChannel.addEventListener("message", (e) => {
        setState("messages", produce((messages) => messages.push(e.data)));
    });
    peerConnection.addEventListener("datachannel", (e) => {
        console.log(e);
        e.channel.addEventListener("message", (e) => {
            setState("messages", produce((x) => x.push(e.data)));
        });
    });
    return (
        <div>
            Automege WebRTC Test<br/>
            <Show when={!state.connectionEstablished}>
                <b>Calling Side:</b><br/>
                <button
                    class="btn"
                    onClick={() => makeCallAndCopyOffer()}
                >
                    Call (Copy Offer)
                </button>
                <button
                    class="btn"
                    onClick={() => pasteAnswer()}
                >
                    Paste Answer (Call Accepted)
                </button>
                <br/>
                <b>Answering Side:</b><br/>
                <button
                    class="btn"
                    onClick={() => pasteOfferAndCopyAnswer()}
                >
                    Paste Offer, and Copy Answer
                </button>
                <br/>
                <br/>
                <b>ICE Candidates:</b><br/>
                <Show when={state.iceCandidates.length != 0}>
                    <button
                        class="btn"
                        onClick={() => copyIceCandidates()}
                    >
                        Copy ICE Candidates
                    </button>
                </Show>
                <button
                    class="btn"
                    onClick={() => pasteIceCandidates()}
                >
                    Paste ICE Candidates
                </button>
            </Show>
            <Show when={state.connectionEstablished}>
                <For each={state.messages}>
                    {(message) => (<>{message}<br/></>)}
                </For>
                Enter Message:
                <input
                    style={{
                        "color": "black",
                    }}
                    onChange={(e) => {
                        let text = e.currentTarget.value;
                        setState("messages", produce((x) => x.push(text)));
                        msgDataChannel.send(text);
                        e.currentTarget.value = "";
                    }}
                />
            </Show>
        </div>
    );
};


/*
async function makeCall() {
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration);
    signalingChannel.addEventListener('message', async message => {
        if (message.answer) {
            const remoteDesc = new RTCSessionDescription(message.answer);
            await peerConnection.setRemoteDescription(remoteDesc);
        }
    });
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    signalingChannel.send({'offer': offer});
}
*/

export default AutomergeWebRtcTest;
