/* @refresh reload */
import "uno.css";
import "@unocss/reset/tailwind.css";
import { render } from "solid-js/web";
import { HashRouter, Route } from "@solidjs/router";
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { lazy } from "solid-js";
import App from "./App";
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
const AutomergeWebRtcTest = lazy(() => import("./automerge-webrtc-test/AutomergeWebRtcTest"));

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
    throw new Error(
        "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
    );
}

render(
    () => (
        <HashRouter>
            <Route path="/" component={App} />
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
            <Route path="/automerge-webrtc-test" component={AutomergeWebRtcTest}/>
        </HashRouter>
    ),
    root!,
);
