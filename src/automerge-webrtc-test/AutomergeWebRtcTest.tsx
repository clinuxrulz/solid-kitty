import { Component, createMemo, For, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { NoTrack } from "../util";
import { loadFromJsonViaTypeSchema, TypeSchema } from "../TypeSchema";

type OfferWithIce = {
    offer: string,
    iceCandidates: string[],
};

const offerWithIceTypeSchema: TypeSchema<OfferWithIce> = {
    type: "Object",
    properties: {
        offer: "String",
        iceCandidates: {
            type: "Array",
            element: "String",
        },
    },
};

const AutomergeWebRtcTest: Component = () => {
    let searchParams = new URLSearchParams(window.location.search);
    let initOffer: string | undefined = undefined;
    let initIceCandidates: string[] | undefined = undefined;
    let offerWithIce = searchParams.get("offerWithIce");
    if (offerWithIce != null) {
        let result = loadFromJsonViaTypeSchema<OfferWithIce>(offerWithIceTypeSchema, JSON.parse(offerWithIce));
        if (result.type == "Ok") {
            let result2 = result.value;
            initOffer = result2.offer;
            initIceCandidates = result2.iceCandidates;
            console.log(initIceCandidates);
        }
    }
    let initIceCandidates2: NoTrack<RTCIceCandidate>[] = [];
    if (initIceCandidates != undefined) {
        initIceCandidates2 = initIceCandidates.map((x) => new NoTrack(JSON.parse(x)));
    }
    let [ state, setState, ] = createStore<{
        offer: NoTrack<RTCSessionDescriptionInit> | undefined,
        answer: NoTrack<RTCSessionDescriptionInit> | undefined,
        iceCandidates: NoTrack<RTCIceCandidate>[],
        connectionEstablished: boolean,
        messages: string[],
    }>({
        offer: undefined,
        answer: undefined,
        iceCandidates: initIceCandidates2,
        connectionEstablished: false,
        messages: [],
    });
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration);
    if (initOffer != undefined) {
        let offer = JSON.parse(initOffer);
        (async () => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            let answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            setState("answer", new NoTrack(answer));
        })();
    }
    if (initIceCandidates2 != undefined) {
        let ice = initIceCandidates2.map((x) => x.value);
        (async () => {
            for (let ice2 of ice) {
                try {
                    await peerConnection.addIceCandidate(ice2);
                } catch (ex) {
                    // ~\:)/~
                }
            }
        })();
    }
    const msgDataChannel = peerConnection.createDataChannel("msg");
    (async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        setState("offer", new NoTrack(offer));
    })();
    let makeCallAndCopyOffer = async () => {
        const offer = state.offer?.value;
        if (offer == undefined) {
            return;
        }
        await navigator.clipboard.writeText(JSON.stringify(offer));
    }
    let pasteOfferAndCopyAnswer = async () => {
        let offer = JSON.parse(await navigator.clipboard.readText());
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        let answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        setState("answer", new NoTrack(answer));
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
                await peerConnection.addIceCandidate(iceCandidate);
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
    let offerWithIceUrl = createMemo(() => {
        let offer = state.offer?.value;
        if (offer == undefined) {
            return undefined;
        }
        let ice = state.iceCandidates.map((x) => JSON.stringify(x.value));
        if (ice == undefined) {
            return undefined;
        }
        let url = new URL(window.location.href);
        let offerWithIce: OfferWithIce = {
            offer: JSON.stringify(offer),
            iceCandidates: ice,
        };
        url.searchParams.append("offerWithIce", JSON.stringify(offerWithIce));
        return url.toString();
    });
    return (
        <div
            style={{
                "width": "100%",
                "height": "100%",
                "overflow-y": "auto",
            }}
        >
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
                <hr/>
                <b>Fast Track:</b><br/>
                <Show when={offerWithIceUrl()}>
                    {(offerWithIceUrl2) => (<>
                        Call URL:
                        <button
                            class="btn"
                            onClick={async () => {
                                await navigator.clipboard.writeText(offerWithIceUrl2());
                            }}
                        >
                            Copy
                        </button>
                    </>)}
                </Show>
                <Show when={state.answer}>
                    {(answer) => (<>
                        Answer:
                        <button
                            class="btn"
                            onClick={async () => {
                                await navigator.clipboard.writeText(JSON.stringify(answer().value));
                            }}
                        >
                            Copy
                        </button>
                    </>)}
                </Show>
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

export default AutomergeWebRtcTest;
