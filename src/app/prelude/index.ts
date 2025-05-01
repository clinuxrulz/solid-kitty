import Ecs from "ecs-lib";
let world = new Ecs();
let ecs = Ecs;

type ECS = typeof world;

let sources = new Map<string,{
    url: string,
    code: Promise<{
        init: (ecs: typeof Ecs, world: ECS) => void,
        onCleanup: (ecs: typeof Ecs, world: ECS) => void,
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
