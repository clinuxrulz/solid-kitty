import { Component, ComponentProps, splitProps } from "solid-js";
import { IEcsWorld } from "../../ecs/IEcsWorld";
import { Overwrite } from "@bigmistqke/solid-fs-components";

const Animations: Component<Overwrite<
  ComponentProps<'div'>,
  {
    world: IEcsWorld,
  }
>> = (props_) => {
  const [props, rest,] = splitProps(
    props_,
    [
      "world",
    ],
  );
  return undefined;
};

export default Animations;
