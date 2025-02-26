import { A, useNavigate } from "@solidjs/router";
import { Component } from "solid-js";

const App: Component = (props) => {
    let navigate = useNavigate();
    return (
        <div style="flex-grow: 1; overflow: auto; ">
            <b>Links:</b>
            <br />
            <div
                style={{
                    "margin-left": "10px",
                    "margin-top": "10px",
                    display: "inline-block",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        "flex-direction": "column",
                    }}
                >
                    <button class="btn" onClick={() => navigate("/kitty-demo")}>
                        Kitty Demo
                    </button>
                    <button
                        class="btn"
                        onClick={() => navigate("/pixel-editor")}
                    >
                        Pixel Editor
                    </button>
                    <button
                        class="btn"
                        onClick={() => navigate("/level-builder")}
                    >
                        Level Builder
                    </button>
                    <button
                        class="btn"
                        onClick={() => navigate("/colour-picker")}
                    >
                        Colour Picker
                    </button>
                    <button
                        class="btn"
                        onClick={() => navigate("/reactive-sim")}
                    >
                        Reactive Simulator
                    </button>
                    <button
                        class="btn"
                        onClick={() => navigate("/vector-editor")}
                    >
                        Vector Editor
                    </button>
                    <button
                        class="btn"
                        onClick={() => navigate("/gravity-test")}
                    >
                        Gravity Test
                    </button>
                    <button class="btn" onClick={() => navigate("/three-body")}>
                        Three Body
                    </button>
                    <button class="btn" onClick={() => navigate("/vfs-test")}>
                        Virtual File System Test
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
