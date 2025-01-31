import { A, useNavigate } from "@solidjs/router";
import { Component } from "solid-js";

const App: Component = (props) => {
    let navigate = useNavigate();
    return (
        <div style="flex-grow: 1; overflow: auto; ">
            <b>Links:</b><br/>
            <div
                style={{
                    "margin-left": "10px",
                    "display": "flex",
                    "flex-direction": "column",
                }}
            >
                <button
                    class="btn"
                    onClick={() => navigate("/kitty-demo")}
                >
                    Kitty Demo
                </button><br/>
                <button
                    class="btn"
                    onClick={() => navigate("/pixel-editor")}
                >
                    Pixel Editor
                </button><br/>
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
            </div>
        </div>
    );
};

export default App;
