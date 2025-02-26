import { EcsRegistry } from "../../ecs/EcsRegistry";
import { catmullRomSplineComponentType } from "./CatmullRomSpline";

export const registry = new EcsRegistry([catmullRomSplineComponentType]);
