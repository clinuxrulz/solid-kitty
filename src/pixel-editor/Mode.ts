import { Component } from "solid-js";

export interface Mode {
    instructions?: Component,
    overlaySvgUI?: Component,
    click?: () => void,
}
