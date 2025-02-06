import { IsEcsComponentType } from "./EcsComponent";

export class EcsRegistry {
    componentTypes: IsEcsComponentType[];
    componentTypeMap: Map<string,IsEcsComponentType>;

    constructor() {
        this.componentTypes = [];
        this.componentTypeMap = new Map();
    }

    registerComponentTypes(componentTypes: IsEcsComponentType[]) {
        for (let componentType of componentTypes) {
            this.componentTypes.push(componentType);
            this.componentTypeMap.set(componentType.typeName, componentType);
        }
    }
}
