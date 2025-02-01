import { Component } from "solid-js";

const LevelBuilder: Component = () => {
    return (
        <div style="flex-grow: 1;">
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

export default LevelBuilder;
