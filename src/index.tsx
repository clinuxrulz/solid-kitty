/* @refresh reload */
//import "uno.css";
//import "@unocss/reset/tailwind.css";
import { render } from "solid-js/web";
import { HashRouter, Route } from "@solidjs/router";
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {
    Accessor,
    Component,
    createEffect,
    createMemo,
    createResource,
    lazy,
} from "solid-js";
import App from "./App";
import { createConnectionManagementUi } from "./connection-management/ConnectionManagement";
import {
    DocHandle,
    isValidAutomergeUrl,
    Repo,
} from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";
import {
    AutomergeVirtualFileSystem,
    AutomergeVirtualFileSystemState,
} from "./AutomergeVirtualFileSystem";
import { asyncPending, AsyncResult, asyncSuccess } from "./AsyncResult";
import { createStore } from "solid-js/store";
const KittyDemoApp = lazy(() => import("./kitty-demo/KittyDemo"));
const PixelEditor = lazy(() => import("./pixel-editor/PixelEditor"));
const LevelBuilder = lazy(() => import("./level-builder/LevelBuilder"));
const ScriptEditor = lazy(() => import("./script-editor/ScriptEditor"));
const ColourPicker = lazy(() => import("./pixel-editor/ColourPicker"));
const ReactiveSimulator = lazy(
    () => import("./reactive-simulator/ReactiveSimulator"),
);
const VectorEditor = lazy(() => import("./vector-editor/VectorEditor"));
const GravityTest = lazy(() => import("./gravity-test/GravityTest"));
const ThreeBody = lazy(() => import("./three-body/ThreeBody"));
const VfsTest = lazy(() => import("./level-builder/VirtualFileSystemTest"));
const AutomergeWebRtcTest = lazy(
    () => import("./automerge-webrtc-test/AutomergeWebRtcTest"),
);

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
    throw new Error(
        "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
    );
}

render(() => {
    let urlParams = new URLSearchParams(window.location.search);
    let lastDocUrl = window.localStorage.getItem("lastDocUrl");
    let initDocumentUrl = urlParams.get("docUrl") ?? lastDocUrl;

    // TODO: Use this to start off with no doc
    let [state, setState] = createStore<{
        documentUrl: string | undefined;
    }>({
        documentUrl: initDocumentUrl ?? undefined,
    });

    let repo = new Repo({
        storage: new IndexedDBStorageAdapter(),
        network: [new BroadcastChannelNetworkAdapter()],
    });

    let automergeVirtualFileSystemDoc: Accessor<
        DocHandle<AutomergeVirtualFileSystemState> | undefined
    >;

    if (initDocumentUrl == undefined || !isValidAutomergeUrl(initDocumentUrl)) {
        let doc = repo.create(AutomergeVirtualFileSystem.makeEmptyState(repo));
        window.localStorage.setItem("lastDocUrl", doc.url);
        automergeVirtualFileSystemDoc = () => doc;
    } else {
        let [doc] = createResource(() =>
            repo.find<AutomergeVirtualFileSystemState>(initDocumentUrl),
        );
        automergeVirtualFileSystemDoc = doc;
    }

    let connectionManagementUi = createConnectionManagementUi({});
    let connections = connectionManagementUi.connections.bind(
        connectionManagementUi,
    );
    createEffect(() => {
        console.log(connections());
    });
    let App2: Component = () => (
        <App
            onShareVfs={() => {
                let doc = automergeVirtualFileSystemDoc();
                if (doc == undefined) {
                    return;
                }
                const url = new URL(window.location.href);
                url.searchParams.set("docUrl", doc.url);
                let url2 = url.toString();
                window.history.pushState(null, "", url2);
                navigator.clipboard.writeText(url2);
            }}
        />
    );
    return (
        <HashRouter>
            <Route path="/" component={App2} />
            <Route path="/kitty-demo" component={KittyDemoApp} />
            <Route path="/pixel-editor" component={PixelEditor} />
            <Route path="/level-builder" component={LevelBuilder} />
            <Route path="/script-editor" component={ScriptEditor} />
            <Route
                path="/colour-picker"
                component={() => {
                    return (
                        <div
                            style={{
                                width: "300px",
                                height: "300px",
                                display: "flex",
                                "flex-direction": "column",
                                "margin-left": "20px",
                                "margin-top": "20px",
                            }}
                        >
                            <ColourPicker />
                        </div>
                    );
                }}
            />
            <Route path="/reactive-sim" component={ReactiveSimulator} />
            <Route path="/vector-editor" component={VectorEditor} />
            <Route path="/gravity-test" component={GravityTest} />
            <Route path="/three-body" component={ThreeBody} />
            <Route path="/vfs-test" component={VfsTest} />
            <Route
                path="/automerge-webrtc-test"
                component={AutomergeWebRtcTest}
            />
            <Route
                path="/connection-management"
                component={connectionManagementUi.Render}
            />
        </HashRouter>
    );
}, root!);
