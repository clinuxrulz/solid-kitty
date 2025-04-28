// @ts-ignore
import * as _ecsy from "ecsy@0.4.3";
type Ecsy = typeof import("ecsy");
const ecsy = _ecsy as Ecsy;
const { Component, Types, World, } = ecsy;

let world = new ecsy.World();

let sources = new Map<string,{
    url: string,
    code: Promise<{
        init: (ecsy: Ecsy, world: ecsy.World) => void,
        onCleanup: (ecsy: Ecsy, world: ecsy.World) => void,
    }>,
}>();

window.addEventListener("message", (e) => {
    let msg = e.data;
    if (msg.type == "UpdateSource") {
        let path = msg.path;
        let url = msg.url;
        let code = import(url);
        sources.set(path, {
            url,
            code,
        });
        (async () => {
            let code2 = await code;
            code2.init(ecsy, world);
        })();
    } else if (msg.type == "DisposeSource") {
        let path = msg.path;
        let node = sources.get(path);
        if (node != undefined) {
            sources.delete(path);
            (async () => {
                let code2 = await node.code;
                code2.onCleanup(ecsy, world);
            })();
        }
    }
});

document.body.append(document.createTextNode("Hello World!"));

let onDOMContentLoaded = () => {
    window.postMessage("ready");
    document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
};
document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
