// @ts-ignore
import * as _ecs from "ecs-lib@0.8.0-pre.2";
type Ecs = typeof import("ecs-lib");
const ecs = _ecs as Ecs;
let world = new ecs.default();

type ECS = typeof world;

let sources = new Map<string,{
    url: string,
    code: Promise<{
        init: (ecsy: Ecs, world: ECS) => void,
        onCleanup: (ecsy: Ecs, world: ECS) => void,
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
            code2.init(ecs, world);
        })();
    } else if (msg.type == "DisposeSource") {
        let path = msg.path;
        let node = sources.get(path);
        if (node != undefined) {
            sources.delete(path);
            (async () => {
                let code2 = await node.code;
                code2.onCleanup(ecs, world);
            })();
        }
    }
});

document.body.append(document.createTextNode("Hello World!"));
