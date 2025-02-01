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
                    "margin-top": "10px",
                    "display": "inline-block",
                }}
            >
                <div
                    style={{
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
            </div><br/>
            <b>Test Tabs:</b><br/>
            <ul class="nav-tabs">
                <li class="nav-item">
                    <a href="#" class="nav-link-selected">Tab 1</a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link">Tab 2</a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link">Tab 3</a>
                </li>
            </ul>
        </div>
    );
};

export default App;
