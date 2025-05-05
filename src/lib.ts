import { Accessor, createMemo, createResource, createRoot, createSignal } from "solid-js";
import { registry as baseRegistry } from "./ecs/components/registry";
import { EcsWorld } from "./lib";
import { EcsRegistry } from "./lib";
import { makeRefCountedMakeReactiveObject } from "./util";
import { AutomergeVirtualFileSystem, AutomergeVirtualFileSystemState } from "solid-fs-automerge";
import { isValidAutomergeUrl, Repo } from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";

export * from "./ecs/EcsComponent";
export * from "./ecs/EcsRegistry";
export * from "./ecs/EcsWorld";
export * from "./TypeSchema";
export { PixiRenderSystem, } from "./systems/PixiRenderSystem";
export * from "solid-js";

export const REQUIRED_FOR_KEEPING_MANUAL_CHUNKS = () => undefined;

export function launch() {
    import("./index");
}

let [ docUrl, setDocUrl, ] = createSignal<string>();

window.addEventListener("message", (e) => {
    let data = e.data;
    if (typeof data.type !== "string") {
        return;
    }
    switch (data.type) {
        case "SetDocUrl": {
            let docUrl2 = data?.params?.docUrl;
            if (typeof docUrl2 !== "string") {
                return;
            }
            setDocUrl(docUrl2);
            return;
        }
        default:
            return;
    }
});

let repo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [new BroadcastChannelNetworkAdapter()],
});

export const createAutomergeVfs = makeRefCountedMakeReactiveObject(
    () => {
        let doc_ = createMemo(() => {
            let docUrl2 = docUrl();
            if (docUrl2 == undefined) {
                return undefined;
            }
            let [ doc, ] = createResource(() => {
                if (docUrl2 == undefined) {
                    return;
                }
                if (!isValidAutomergeUrl(docUrl2)) {
                    return;
                }
                return repo.find<AutomergeVirtualFileSystemState>(docUrl2)
            });
            return doc as Accessor<ReturnType<typeof doc>>;
        });
        let doc = createMemo(() =>
            doc_()?.()
        );
        let vfs = createMemo(() => {
            let doc2 = doc();
            if (doc2 == undefined) {
                return undefined;
            }
            return new AutomergeVirtualFileSystem({
                repo,
                docHandle: () => doc2,
            });
        });
        return vfs;
    },
);

export const libUrl = import.meta.url;

export const world = new EcsWorld();

export const registry = new EcsRegistry([
    ...baseRegistry.componentTypes,
]);

export function fixRelativeUrl(relativeUrl: string): string {
    return relativeUrl;
    /*
    const libUrl_ = import.meta.url;
    if (true) {
        return "http://localhost:3000/" + relativeUrl;
    }
    let libBaseUrl = libUrl_.slice(0, libUrl_.lastIndexOf("/") + 1);
    return libBaseUrl + relativeUrl;
    */
}
