import { launch, EcsWorld } from "tool-kitty";

launch();

(window as any)["world"] = new EcsWorld();

